// Table row template
{/* <tr>
          <td class="text-center">CATEGORY</td>
          <td class="text-center">Employee Notes</td>
          <td class="text-center">Amount</td>
          <td class="text-center">  
            <!-- Button to Open the Modal -->
            <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#myModal">
              Open modal
            </button>
        </td>
        </tr> */}

const BASE = window.location.origin; // dynamic base for self-contained mode

function currentRole(){
    try { return sessionStorage.getItem('role'); } catch(e){ return null; }
}

function safeUserArray() {
    try {
        const raw = localStorage.getItem("data");
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
}

async function reconstructSessionIfNeeded(){
    const existing = safeUserArray();
    if (existing.length > 0) return existing;
    const email = sessionStorage.getItem('email');
    if (!email) return [];
    try {
        const resp = await fetch(`${BASE}/employees?email=${encodeURIComponent(email)}`);
        if (!resp.ok) return [];
        const arr = await resp.json();
        if (Array.isArray(arr) && arr.length > 0) {
            localStorage.setItem('data', JSON.stringify(arr));
            return arr;
        }
    } catch(e){ console.warn('[employee] reconstructSessionIfNeeded failed', e); }
    return [];
}

async function populateEmployeeTable(){
    let userArr = safeUserArray();
    if (userArr.length === 0){
        userArr = await reconstructSessionIfNeeded();
    }
    if (userArr.length === 0) {
        console.warn("[employee] No user data in localStorage; redirecting to login");
        const tb = document.getElementById('tableBody');
        if (tb) tb.innerHTML = `<tr><td colspan="4" class="text-center text-warning">No session. Please <a href='index.html'>login</a>.</td></tr>`;
        return;
    }
    // Ensure role matches this page
    if (currentRole() && currentRole() !== 'employees') {
        console.warn('[employee] Role mismatch (role=' + currentRole() + ') redirecting to index');
        window.location = 'index.html';
        return;
    }
    const eidRaw = userArr[0].eid;
    const eid = typeof eidRaw === 'number' ? eidRaw : parseInt(eidRaw, 10);
    if (!Number.isInteger(eid) || eid <= 0) {
        console.error('[employee] Invalid eid in cached user array', eidRaw, userArr[0]);
        const tableBody = document.getElementById('tableBody');
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Session invalid. Please log out and log back in.</td></tr>`;
        return;
    }
    let tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = "";
    try {
        let response = await fetch(`${BASE}/reimbursements?employeeId=${eid}`, { cache: 'no-store' });
        if (!response.ok) throw new Error("HTTP " + response.status);
        let info = await response.json();
        for (const element of info) {
            let cData = await fetchCategoryData(element.cid);
            tableBody.innerHTML += `
                <tr>
                    <td class="text-center">${cData.title}</td>
                    <td class="text-center" style="word-wrap: break-word;">${element.employee_note || ''}</td>
                    <td class="text-center">${element.amount}</td>
                    <td class="text-center">  
                        <button onclick="populateEmployeeModal(${element.eid},${element.rid});" type="button" class="btn btn-primary" data-toggle="modal" data-target="#myModal">
                            Open modal
                        </button>
                    </td>
                </tr>`;
        }
    } catch (e) {
        console.error("[employee] Failed to populate table", e);
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Failed to load reimbursements</td></tr>`;
    }
}


// Modal Employee Card Template
/* <img class="card-img-top" src="https://robohash.org/johndoe/?set=set2" alt="Card image">
<div class="card-body">
    <h4 class="card-title">John Doe</h4>
    <p class="card-text">Some example text.</p>
</div> 
*/
async function populateEmployeeModal(eid,rid) {
    // Using the employee id and reimbursement id we have all we need to display
    populateEmployeeCard(eid);
    populateModalReimbursementDetails(rid);
    return;
}

async function fetchCategoryData(cid){
    let response = await fetch(`${BASE}/expense-category/${cid}`);
    return response.json();
}

async function fetchReimbursementById(rid){
    let response = await fetch(`${BASE}/reimbursement/${rid}`);
    return response.json();
}

async function fetchEmployeeData(eid){
    let response = await fetch(`${BASE}/employee/${eid}`);
    return response.json();
}

async function populateEmployeeCard(eid){
    let eData = await fetchEmployeeData(eid);
    let modalCard = document.getElementById("modalCard");
    modalCard.innerHTML = `
        <img class="card-img-top" src="${eData.image_url}" alt="Card image">
        <div class="card-body">
            <h4 class="card-title">${eData.name}</h4>
            <p class="card-text">Email: ${eData.email}</p>
        </div>`;
}

async function populateModalReimbursementDetails(rid){
    let modalAmount = document.getElementById("modalAmount");
    let modalCategory = document.getElementById("modalCategory");
    let modalNotes = document.getElementById("modalNotes");
    let thumbsUp = document.getElementById("thumbsUp");
    let thumbsDown = document.getElementById("thumbsDown");
    let modalComment = document.getElementById("modalComment");
    let rData = await fetchReimbursementById(rid);
    let cData = await fetchCategoryData(rData.cid);
    modalAmount.textContent = `$ ${rData.amount}`;
    modalCategory.textContent = cData.title;
    modalNotes.textContent = rData.employee_note || '';
    modalComment.textContent = rData.manager_note || '';
    // status coloring (view only)
    if (rData.status === 1) { // approved
        thumbsUp.style.color = "green"; thumbsDown.style.color = "gray";
    } else if (rData.status === 2) { // denied
        thumbsUp.style.color = "gray"; thumbsDown.style.color = "red";
    } else { // pending
        thumbsUp.style.color = "gray"; thumbsDown.style.color = "gray";
    }
}

// Reimbursement bullet Template
/* <div class="form-check">
<label class="form-check-label" for="radio1">
    <input type="radio" class="form-check-input" id="radio1" name="optradio" value="option1" checked>Option 1
</label>
</div> */
async function populateBullets(){
    let catBullets = document.getElementById("catBullets");
    catBullets.innerHTML = "";
    try {
        let response = await fetch(`${BASE}/expense-categories`);
        if (!response.ok) throw new Error("HTTP " + response.status);
        let info = await response.json();
        info.forEach((element, idx) => {
            catBullets.innerHTML += `
                <div class="form-check">
                    <label class="form-check-label" for="cat_${element.cid}">
                        <input type="radio" class="form-check-input" id="cat_${element.cid}" name="optradio" value="${element.cid}" ${idx===0? 'checked':''}>${element.title}
                    </label>
                </div>`;
        });
    } catch (e){
        console.error("[employee] Failed to load categories", e);
        catBullets.innerHTML = '<span class="text-danger">Failed to load categories</span>';
    }
}

async function uploadNewReimbursement(event){
    if (event) event.preventDefault();
    const userArr = safeUserArray();
    if (currentRole() && currentRole() !== 'employees') { alert('Invalid role for creating reimbursements.'); return; }
    if (userArr.length === 0) { alert("Session expired. Please login again."); return; }
    const eid = userArr[0].eid;
    if (!eid || isNaN(parseInt(eid,10))) { alert('Invalid employee id in session. Please re-login.'); return; }
    let employee_note = document.getElementById("rComment").value.trim();
    let rAmountRaw = document.getElementById("amount").value.trim();
    const rAmount = parseFloat(rAmountRaw);
    const selInput = document.querySelector('input[name="optradio"]:checked');
    if (!selInput) { alert("Select a category."); return; }
    if (isNaN(rAmount) || rAmount <= 0) { alert("Amount must be a positive number."); return; }
    const now = new Date().toISOString().slice(0,19).replace('T',' '); // mimic existing string style
    // Ensure numeric types for backend (Gson expects numbers, not numeric strings)
    const payload = { 
        rid: 0,
        amount: rAmount,
        submit_date: now,
        status: 0,
        status_date: now,
        employee_note,
        manager_note: "",
        cid: parseInt(selInput.value, 10),
        eid: eid
    };
    console.debug('[employee] Submitting reimbursement payload', payload);
    try {
        const response = await fetch(`${BASE}/reimbursement`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("HTTP " + response.status);
        // Refresh table instead of full reload for better UX
        await populateEmployeeTable();
        // clear form
        document.getElementById("amount").value='';
        document.getElementById("rComment").value='';
    } catch (e){
        console.error('[employee] Failed to submit reimbursement', e);
        alert('Failed to submit reimbursement: ' + e.message);
    }
}