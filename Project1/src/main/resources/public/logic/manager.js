// Table row template
/* <tr>
    <td class="text-center">CATEGORY</td>
    <td class="text-center">Employee Notes</td>
    <td class="text-center">Amount</td>
    <td class="text-center">  
    <!-- Button to Open the Modal -->
    <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#myModal">
        Open modal
    </button>
</td>
</tr> */
var employeeId;
var reimbursementId;
const BASE = window.location.origin;
let updateInFlight = false;

function safeManagerArray(){
    try {
        const raw = localStorage.getItem('data');
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr)? arr : [];
    } catch(e){return [];} 
}

async function reconstructManagerSessionIfNeeded(){
    const existing = safeManagerArray();
    if (existing.length > 0) return existing;
    const email = sessionStorage.getItem('email');
    if (!email) return [];
    try {
        const resp = await fetch(`${BASE}/managers?email=${encodeURIComponent(email)}`);
        if (!resp.ok) return [];
        const arr = await resp.json();
        if (Array.isArray(arr) && arr.length > 0){
            localStorage.setItem('data', JSON.stringify(arr));
            return arr;
        }
    } catch(e){ console.warn('[manager] reconstructManagerSessionIfNeeded failed', e); }
    return [];
}

async function populateManagerTable(){
    let tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = '';
    let mArr = safeManagerArray();
    if (mArr.length === 0){
        mArr = await reconstructManagerSessionIfNeeded();
    }
    if (mArr.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">No manager session</td></tr>`;
        return;
    }
    const mgid = mArr[0].mgid;
    try {
        let response = await fetch(`${BASE}/reimbursements?managerId=${mgid}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        let info = await response.json();
        for (const element of info) {
            let cData = await fetchCategoryData(element.cid);
            tableBody.innerHTML += `
                <tr>
                    <td class="text-center">${cData.title}</td>
                    <td class="text-center" style="word-wrap: break-word;">${element.employee_note || ''}</td>
                    <td class="text-center">${element.amount}</td>
                    <td class="text-center">  
                        <button onclick="populateEmployeeModal(${element.eid},${element.rid});" type="button" class="btn btn-primary" data-toggle="modal" data-target="#myModal">Open modal</button>
                    </td>
                </tr>`;
        }
        if (info.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center">No reimbursements yet</td></tr>`;
        }
    } catch (e){
        console.error('[manager] Failed to load reimbursements', e);
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

async function populateEmployeeCard(eid) 
{
    employeeId = eid;
    let eData = await fetchEmployeeData(eid);
    let modalCard = document.getElementById("modalCard");

    modalCard.innerHTML =`
        <img class="card-img-top" src="${eData.image_url}" alt="Card image">
        <div class="card-body">
            <h4 class="card-title">${eData.name}</h4>
            <p class="card-text">Email: ${eData.email}</p>
        </div> 
    `;
    return;
}

async function populateModalReimbursementDetails(rid){
    reimbursementId = rid;
    let modalAmount = document.getElementById("modalAmount");
    let modalCategory = document.getElementById("modalCategory");
    let modalNotes = document.getElementById("modalNotes");
    let thumbsUp = document.getElementById("thumbsUp");
    let thumbsDown = document.getElementById("thumbsDown");
    let modalComment = document.getElementById("modalCommentManager");
    let rData = await fetchReimbursementById(rid);
    let cData = await fetchCategoryData(rData.cid);
    modalAmount.textContent = `$ ${rData.amount}`;
    modalCategory.textContent = cData.title;
    modalNotes.textContent = rData.employee_note || '';
    modalComment.value = rData.manager_note || '';
    applyStatusColor(rData.status, thumbsUp, thumbsDown);
    // Ensure only one active click handler path
    thumbsUp.onclick = () => statusUpdate('approved');
    thumbsDown.onclick = () => statusUpdate('denied');
    updateInFlight = false;
}
     
async function statusUpdate(action){
    if (updateInFlight) {
        console.log('[manager] Ignoring click; update already in-flight');
        return;
    }
    updateInFlight = true;
    try {
        let managerNote = document.getElementById('modalCommentManager').value;
        let rData = await fetchReimbursementById(reimbursementId);
        rData.manager_note = managerNote;
        if (action === 'approved') rData.status = 1; else if (action === 'denied') rData.status = 2; else rData.status = 0;
        // ensure status_date updates to now
        rData.status_date = new Date().toISOString().slice(0,19).replace('T',' ');
        console.log('[manager] Updating reimbursement', rData);
        // Optimistic UI coloring
        const thumbsUp = document.getElementById('thumbsUp');
        const thumbsDown = document.getElementById('thumbsDown');
        applyStatusColor(rData.status, thumbsUp, thumbsDown, true);
        const resp = await fetch(`${BASE}/reimbursement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rData)
        });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        await populateManagerTable();
        // refresh modal details (optional)
        await populateModalReimbursementDetails(reimbursementId);
    } catch (e){
        console.error('[manager] Failed to update status', e);
        alert('Failed to update reimbursement: ' + (e && e.message ? e.message : e));
    }
    updateInFlight = false;
}

function applyStatusColor(status, thumbsUp, thumbsDown, dimPending){
    // Reset base colors first
    thumbsUp.style.color = 'gray';
    thumbsDown.style.color = 'gray';
    if (status === 1) {
        thumbsUp.style.color = 'green';
    } else if (status === 2) {
        thumbsDown.style.color = 'red';
    } else if (dimPending) {
        // leave both gray for pending
    }
}
       
function cleanTable()
{
    let tableBody = document.getElementById("tableBody");

    tableBody.innerHTML = "";
}