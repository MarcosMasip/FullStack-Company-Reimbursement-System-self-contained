function verifyUser() {
    const form = document.getElementById("form");
    clearError();
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        showErrorMsg("Please fill all required fields and select a role.");
        return;
    }

    const email = document.getElementById("emailInput").value.trim();
    const pass = document.getElementById("password").value;
    const emp = document.getElementById("employee").checked;
    const mgr = document.getElementById("manager").checked;

    if (!emp && !mgr) {
        showErrorMsg("Select Employee or Manager.");
        return;
    }

    sessionStorage.setItem("role", emp ? "employees" : "managers");
    storeEmail(email);
    storeShhh(pass);
    console.log("[login] Attempt login role=" + sessionStorage.getItem('role') + " email=" + email);
    login();
}

function checkStorageCapable()
{
    if (typeof(Storage) !== "undefined") 
    {
       
    } 
    else
    {
        showError();
    }
}

function showError() { document.getElementById("alert").style.display = "block"; }

function showErrorMsg(msg) {
    let el = document.getElementById("loginError");
    if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function clearError() {
    let el = document.getElementById("loginError");
    if (el) { el.textContent = ''; el.style.display = 'none'; }
}

// Storage
function storeEmail(value1){
    sessionStorage.setItem('email', value1);
    
}

function storeShhh(value1){
    sessionStorage.setItem('shhh', value1);
}

async function login() {
    const spinner = document.getElementById("spinners");
    spinner.style.display = "block";

    const origin = window.location.origin;
    const role = sessionStorage.getItem("role");
    const email = sessionStorage.getItem("email");
    const pw = sessionStorage.getItem('shhh');

    if (!role || !email) {
        spinner.style.display = 'none';
        showErrorMsg("Missing role or email.");
        return;
    }

    const endpoint = `${origin}/${role}?email=${encodeURIComponent(email)}`;
    console.log("[login] Fetching " + endpoint);
    try {
        const response = await fetch(endpoint, { cache: 'no-store' });
        console.log("[login] Response status=", response.status);
        if (!response.ok) throw new Error("HTTP " + response.status);
        const text = await response.text();
        console.log("[login] Raw body=", text);
        let info;
        try { info = JSON.parse(text); } catch(e){ showErrorMsg("Bad JSON returned"); return; }
        if (!Array.isArray(info) || info.length === 0) {
            showErrorMsg("User not found.");
            return;
        }
        if (!info[0].password) {
            showErrorMsg("Password field missing in response.");
            return;
        }
        if (info[0].password === pw) {
            try {
                // Persist the returned user array so role pages can read ids (eid/mgid)
                localStorage.setItem('data', JSON.stringify(info));
            } catch(e) { console.warn('[login] Failed to cache user data', e); }
            window.location = `${origin}/${role}.html`;
        } else {
            showErrorMsg("Invalid password.");
        }
    } catch (e) {
        console.error("[login] Error", e);
        showErrorMsg("Login failed: " + e.message);
    } finally {
        spinner.style.display = "none";
    }
}