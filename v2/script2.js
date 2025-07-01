// --- State ---
let participants = [];
let sessionType = 'single';
let sessions = [];
let expenses = {};
let currentSessionIdx = 0;

// --- Step 1: Participants ---
const participantInput = document.getElementById('participantInput');
const participantsChips = document.getElementById('participantsChips');
participantInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && this.value.trim()) {
    addParticipant(this.value.trim());
    this.value = '';
  }
});
function addParticipant(name) {
  if (!participants.includes(name)) {
    participants.push(name);
    renderParticipants();
    saveToLocal();
  }
}
function removeParticipant(name) {
  participants = participants.filter(p => p !== name);
  renderParticipants();
  saveToLocal();
}
function renderParticipants() {
  participantsChips.innerHTML = participants.map(name =>
    `<span class="chip">${name}<span class="remove" onclick="removeParticipant('${name}')">&times;</span></span>`
  ).join(' ');
}
window.removeParticipant = removeParticipant;

// --- Session Type and Names ---
document.getElementById('sessionTypeRadios').addEventListener('change', function(e) {
  sessionType = e.target.value;
  if (sessionType === 'single') {
    document.getElementById('singleSessionNameDiv').classList.remove('d-none');
    document.getElementById('multiSessionNamesDiv').classList.add('d-none');
  } else {
    document.getElementById('singleSessionNameDiv').classList.add('d-none');
    document.getElementById('multiSessionNamesDiv').classList.remove('d-none');
  }
  saveToLocal();
});
document.getElementById('addMultiSession').onclick = function() {
  const input = document.getElementById('multiSessionNameInput');
  const name = input.value.trim();
  if (name && !sessions.includes(name)) {
    sessions.push(name);
    renderMultiSessions();
    input.value = '';
    saveToLocal();
  }
};
function removeSession(idx) {
  sessions.splice(idx, 1);
  renderMultiSessions();
  saveToLocal();
}
function renderMultiSessions() {
  const list = document.getElementById('multiSessionList');
  list.innerHTML = sessions.map((name, idx) =>
    `<li>${name} <button class="btn btn-sm btn-danger" onclick="removeSession(${idx})">Remove</button></li>`
  ).join('');
}
window.removeSession = removeSession;

// --- Utility: Get sessionId from URL ---
function getSessionIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('sessionid');
}

// --- LocalStorage helpers ---
function saveToLocal() {
  // Save sessions as array of objects
  let sessionArr = [];
  if (sessionType === 'single') {
    const sessionTitle = document.getElementById('singleSessionName').value.trim() || (sessions[0] || '');
    if (sessionTitle) {
      sessionArr = [{
        id: 'local-' + sessionTitle,
        title: sessionTitle,
        participants: [...participants],
        type: 'single',
        parent: null
      }];
    }
  } else {
    sessionArr = sessions.map((title, idx) => ({
      id: 'local-' + title,
      title,
      participants: [...participants],
      type: 'multi',
      parent: null // or parent id if you want to support hierarchy
    }));
  }
  // Save expenses as array of objects
  let expenseArr = [];
  for (const sessionTitle in expenses) {
    const sessionId = 'local-' + sessionTitle;
    (expenses[sessionTitle] || []).forEach(exp => {
      expenseArr.push({
        id: exp.id || 'local-' + Math.random().toString(36).slice(2),
        name: exp.name,
        amount: exp.amount,
        gst: exp.gst,
        paid_by: exp.paid_by || exp.paidBy,
        split_by: exp.split_by || exp.splitBy,
        session_id: sessionId
      });
    });
  }
  localStorage.setItem('billSplitterSession', JSON.stringify({
    sessions: sessionArr,
    expenses: expenseArr
  }));
}

function loadFromLocal() {
  const data = localStorage.getItem('billSplitterSession');
  if (!data) return;
  try {
    const obj = JSON.parse(data);
    // Map sessions and expenses to UI state
    const sessionArr = obj.sessions || [];
    const expenseArr = obj.expenses || [];
    sessions = sessionArr.map(s => s.title);
    participants = sessionArr[0]?.participants || [];
    sessionType = sessionArr[0]?.type || 'single';
    // Populate singleSessionName input if single session
    if (sessionType === 'single' && sessions[0]) {
      const singleSessionNameInput = document.getElementById('singleSessionName');
      if (singleSessionNameInput) singleSessionNameInput.value = sessions[0];
    }
    // Map expenses to { [sessionTitle]: [expense, ...] }
    expenses = {};
    for (const exp of expenseArr) {
      const sessionObj = sessionArr.find(s => s.id === exp.session_id);
      const sessionTitle = sessionObj ? sessionObj.title : '';
      if (!expenses[sessionTitle]) expenses[sessionTitle] = [];
      expenses[sessionTitle].push({
        id: exp.id,
        name: exp.name,
        amount: exp.amount,
        gst: exp.gst,
        paid_by: exp.paid_by,
        split_by: exp.split_by
      });
    }
    currentSessionIdx = 0;
  } catch {}
}

// --- Add expense locally ---
document.getElementById('addExpenseBtn').onclick = async function() {
  const name = document.getElementById('expenseName').value.trim();
  const amount = parseFloat(document.getElementById('expenseAmount').value);
  const gst = parseFloat(document.getElementById('expenseGst').value) || 1.19;
  const paidBy = document.getElementById('expensePaidBy').value;
  const splitAmong = Array.from(document.querySelectorAll('#splitAmongCheckboxes input:checked')).map(cb => cb.value);
  if (!name || isNaN(amount) || amount <= 0 || !paidBy || splitAmong.length === 0) {
    alert('Please fill in all fields and select at least one participant to split.');
    return;
  }
  const sessionId = getSessionIdFromUrl();
  const sessionTitle = sessionType === 'single' ? document.getElementById('singleSessionName').value.trim() : sessions[currentSessionIdx];
  const newExpense = { name, amount, gst, paid_by: paidBy, split_by: splitAmong };
  if (sessionId) {
    // Add to Supabase
    try {
      // Find the correct session object (by title)
      let sessionObj = null;
      if (window.supabaseSession && window.supabaseSession.read) {
        const allSessions = await window.supabaseSession.read({ id: sessionId });
        if (Array.isArray(allSessions)) {
          sessionObj = allSessions.find(s => s.title === sessionTitle) || allSessions[0];
        } else {
          sessionObj = allSessions;
        }
      }
      if (sessionObj) {
        const created = await window.supabaseExpense.create({ ...newExpense, session_id: sessionObj.id });
        if (created && created.id) newExpense.id = created.id;
      }
    } catch (e) {
      alert('Failed to add expense to database.');
    }
  }
  addExpenseLocal(newExpense);
  document.getElementById('expenseName').value = '';
  document.getElementById('expenseAmount').value = '';
  document.getElementById('expenseGst').value = '1.19';
};
function addExpenseLocal(exp) {
  const sessionTitle = sessionType === 'single' ? document.getElementById('singleSessionName').value.trim() : sessions[currentSessionIdx];
  if (!expenses[sessionTitle]) expenses[sessionTitle] = [];
  expenses[sessionTitle].push(exp);
  renderExpenseList();
  saveToLocal();
}

// --- Utility: Robustly hide loading modal ---
let loadingModalTimeout = null;
function safeHideModal(loadingModal, loadingModalEl) {
  if (!loadingModal) return;
  try {
    if (loadingModalEl && loadingModalEl.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    loadingModal.hide();
  } catch (e) {
    // Ignore errors
  }
}

// --- Share Session: Insert into Supabase and show link ---
const copyBtn = document.getElementById('copySessionLinkBtn');
const copyBtnCaption = document.getElementById('copySessionCaption');
function showCopyBtn(sessionId) {
  if (!copyBtn) return;
  copyBtn.style.display = 'inline-block';
  copyBtnCaption.style.display = 'inline-block';
  copyBtn.onclick = function() {
    const url = `${window.location.origin}${window.location.pathname}?sessionid=${sessionId}`;
    navigator.clipboard.writeText(url);
    copyBtn.innerHTML = '<i class="bi bi-check2"></i> Copied!';
    setTimeout(() => {
      copyBtn.innerHTML = '<i class="bi bi-link-45deg"></i> Copy Session Link';
    }, 1500);
  };
}
copyBtn.onclick = async function() {
  // If sessionid exists in URL, just copy the link and return
  const existingSessionId = getSessionIdFromUrl();
  if (existingSessionId) {
    const url = `${window.location.origin}${window.location.pathname}?sessionid=${existingSessionId}`;
    navigator.clipboard.writeText(url);
    copyBtn.innerHTML = '<i class="bi bi-check2"></i> Copied!';
    setTimeout(() => {
      copyBtn.innerHTML = '<i class="bi bi-link-45deg"></i> Copy Session Link';
    }, 1500);
    return;
  }
  // Show loading spinner
  const loadingModalEl = document.getElementById('loadingModal');
  let loadingModal = null;
  let modalAvailable = false;
  if (loadingModalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    try {
      loadingModal = new bootstrap.Modal(loadingModalEl);
      loadingModal.show();
      modalAvailable = true;
      // Auto-hide after 5 seconds
      loadingModalTimeout = setTimeout(() => safeHideModal(loadingModal, loadingModalEl), 3000);
    } catch (e) {
      console.warn('Modal could not be shown:', e);
      modalAvailable = false;
    }
  }
  try {
    let createdSession, childSessions;
    if (sessionType === 'multi' && sessions.length > 0) {
      // Use the first session as the group name (parent), others as children
      const parentTitle = sessions[0];
      const childTitles = sessions;
      const result = await window.supabaseSession.create({
        title: parentTitle,
        participants,
        type: 'multi',
        children: childTitles
      });
      createdSession = result.parent;
      childSessions = result.children;
    } else {
      createdSession = await window.supabaseSession.create({
        title: sessionType === 'single' ? document.getElementById('singleSessionName').value.trim() : sessions[0],
        participants,
        type: sessionType,
        parent: null
      });
    }
    if (!createdSession) throw new Error('Session not created');
    // Insert all expenses for this session
    if (sessionType === 'multi' && childSessions && childSessions.length > 0) {
      // Map session titles to their DB ids
      const titleToId = {};
      childSessions.forEach(child => { titleToId[child.title] = child.id; });
      for (const sessionTitle of sessions) {
        const exps = expenses[sessionTitle] || [];
        for (const exp of exps) {
          await window.supabaseExpense.create({
            ...exp,
            session_id: titleToId[sessionTitle]
          });
        }
      }
    } else {
      for (const sessionTitle of sessionType === 'single' ? [document.getElementById('singleSessionName').value.trim()] : sessions) {
        const exps = expenses[sessionTitle] || [];
        for (const exp of exps) {
          await window.supabaseExpense.create({
            ...exp,
            session_id: createdSession.id
          });
        }
      }
    }
    // Hide loading spinner before redirect
    if (modalAvailable && loadingModal) {
      safeHideModal(loadingModal, loadingModalEl);
    }
    // Clear localStorage and redirect to session URL (parent session for multi)
    localStorage.removeItem('billSplitterSession');
    window.location.href = `${window.location.pathname}?sessionid=${createdSession.id}`;
    return;
  } catch (err) {
    if (modalAvailable && loadingModal) safeHideModal(loadingModal, loadingModalEl);
    alert('Failed to share session: ' + err.message);
  } finally {
    if (modalAvailable && loadingModal) {
      safeHideModal(loadingModal, loadingModalEl);
    }
  }
};

// --- Restore session/expenses if sessionid in URL ---
async function restoreSessionFromUrl() {
  const sessionId = getSessionIdFromUrl();
  if (!sessionId) {
    loadFromLocal();
    renderParticipants();
    renderMultiSessions();
    renderSessionTabs();
    renderExpenseForm();
    renderExpenseList();
    return;
  }
  // Show loading spinner
  const loadingModalEl = document.getElementById('loadingModal');
  let loadingModal = null;
  let modalAvailable = false;
  if (loadingModalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    try {
      loadingModal = new bootstrap.Modal(loadingModalEl);
      loadingModal.show();
      modalAvailable = true;
      // Auto-hide after 5 seconds
      loadingModalTimeout = setTimeout(() => safeHideModal(loadingModal, loadingModalEl), 5000);
    } catch (e) {
      console.warn('Modal could not be shown:', e);
      modalAvailable = false;
    }
  }
  try {
    // Get parent session
    let session = await window.supabaseSession.read({ id: sessionId });
    if (Array.isArray(session)) session = session[0];
    if (!session) throw new Error('NO_SESSION_FOUND');
    // Get child sessions (if any)
    let childSessions = await window.supabaseSession.read({ parent: sessionId });
    if (!Array.isArray(childSessions)) childSessions = childSessions ? [childSessions] : [];
    // If multi-session, use child sessions for session names
    if (session.type === 'multi' && childSessions.length > 0) {
      sessions = childSessions.map(s => s.title);
      participants = session.participants;
      sessionType = 'multi';
      // Populate session setup UI for multi-session
      document.getElementById('multiSession').checked = true;
      document.getElementById('singleSessionNameDiv').classList.add('d-none');
      document.getElementById('multiSessionNamesDiv').classList.remove('d-none');
      renderMultiSessions();
    } else {
      // Single session or no children
      sessions = [session.title];
      participants = session.participants;
      sessionType = 'single';
      document.getElementById('singleSession').checked = true;
      document.getElementById('singleSessionNameDiv').classList.remove('d-none');
      document.getElementById('multiSessionNamesDiv').classList.add('d-none');
      if (sessions[0]) document.getElementById('singleSessionName').value = sessions[0];
    }
    // Get expenses for each session
    expenses = {};
    if (session.type === 'multi' && childSessions.length > 0) {
      for (const s of childSessions) {
        const exps = await window.supabaseExpense.read({ session_id: s.id });
        expenses[s.title] = exps || [];
      }
    } else {
      const exps = await window.supabaseExpense.read({ session_id: session.id });
      expenses[session.title] = exps || [];
    }
    currentSessionIdx = 0;
    renderParticipants();
    renderSessionTabs();
    renderExpenseForm();
    renderExpenseList();
    showCopyBtn(sessionId);

  } catch (err) {
    if (err.message === 'NO_SESSION_FOUND') {
      if (modalAvailable && loadingModal) safeHideModal(loadingModal, loadingModalEl);
      alert('No session exists for this link. Please create a new session.');
      window.location.href = window.location.pathname;
      return;
    } else {
      alert('Failed to restore session: ' + err.message);
      console.log(err);
    }
  } finally {
    if (modalAvailable && loadingModal) safeHideModal(loadingModal, loadingModalEl);
  }
}

// --- Settle Up Logic ---
document.getElementById('settleUpBtn').onclick = function() {
  const resultsDiv = document.getElementById('resultsSummary');
  resultsDiv.innerHTML = '';
  // Gather all expenses across all sessions
  let allExpenses = [];
  if (sessionType === 'single') {
    const sessionTitle = document.getElementById('singleSessionName').value.trim();
    allExpenses = expenses[sessionTitle] || [];
  } else {
    for (const sessionTitle of sessions) {
      allExpenses = allExpenses.concat(expenses[sessionTitle] || []);
    }
  }
  // Calculate balances
  const balances = {};
  allExpenses.forEach(exp => {
    let amount = parseFloat(exp.amount) * parseFloat(exp.gst);
    // If GST is 1.19, apply 10% svc then 9% gst
    if (parseFloat(exp.gst) === 1.19) {
      amount = parseFloat(exp.amount) * 1.10;
      amount += amount * 0.09;
    }
    const splitBy = exp.split_by || exp.splitBy;
    const paidBy = exp.paid_by || exp.paidBy;
    const share = amount / splitBy.length;
    if (!balances[paidBy]) balances[paidBy] = 0;
    balances[paidBy] += amount;
    splitBy.forEach(person => {
      if (!balances[person]) balances[person] = 0;
      balances[person] -= share;
    });
  });
  // Determine who owes whom
  const owes = {};
  for (let person in balances) {
    if (balances[person] > 0) owes[person] = balances[person];
  }
  const owesList = [];
  for (let debtor in balances) {
    if (balances[debtor] < 0) {
      let amountOwed = -balances[debtor];
      for (let creditor in owes) {
        if (amountOwed === 0) break;
        if (owes[creditor] > 0) {
          const payment = Math.min(amountOwed, owes[creditor]);
          owesList.push({ debtor, creditor, payment: payment.toFixed(2) });
          resultsDiv.innerHTML += `<div>${debtor} pays ${creditor}: $${payment.toFixed(2)}</div>`;
          owes[creditor] -= payment;
          amountOwed -= payment;
        }
      }
    }
  }
  if (owesList.length === 0) {
    resultsDiv.innerHTML = '<div>All settled up! 🎉</div>';
  }
};

// --- Show Copy Button after session creation ---
function showCopyBtnAfterSessionCreate() {
  if (!copyBtn) return;
  copyBtn.style.display = 'inline-block';
  copyBtnCaption.style.display = 'inline-block';
  copyBtn.onclick = copyBtn.onclick || function() {
    const url = `${window.location.origin}${window.location.pathname}?sessionid=LOCAL`;
    navigator.clipboard.writeText(url);
    copyBtn.innerHTML = '<i class="bi bi-check2"></i> Copied!';
    setTimeout(() => {
      copyBtn.innerHTML = '<i class="bi bi-link-45deg"></i> Copy Session Link';
    }, 1500);
  };
}
// Show the button after session creation (single or multi)
document.getElementById('singleSessionName').addEventListener('blur', showCopyBtnAfterSessionCreate);
document.getElementById('multiSessionNameInput').addEventListener('blur', showCopyBtnAfterSessionCreate);

// --- Render helpers (define as no-ops if not already defined) ---
if (typeof renderSessionTabs !== 'function') {
  function renderSessionTabs() {}
}
if (typeof renderExpenseForm !== 'function') {
  function renderExpenseForm() {}
}
if (typeof renderExpenseList !== 'function') {
  function renderExpenseList() {}
}
function renderSessionTabs() {
  const sessionTabs = document.getElementById('sessionTabs');
  if (!sessionTabs) return;
  sessionTabs.innerHTML = (sessionType === 'single' ? [document.getElementById('singleSessionName').value.trim()] : sessions).map((name, idx) =>
    `<button class="btn ${idx === currentSessionIdx ? 'btn-filled active' : 'btn-outline-success'} me-2 mb-2" ${idx === currentSessionIdx ? 'aria-current="true"' : ''} onclick="switchSession(${idx})">${name}</button>`
  ).join('');
  // Always update expense form and list for the current session after rendering tabs
  renderExpenseForm();
  renderExpenseList();
}
function switchSession(idx) {
  currentSessionIdx = idx;
  // Populate singleSessionName input if single session
  if (sessionType === 'single' && sessions[0]) {
    const singleSessionNameInput = document.getElementById('singleSessionName');
    if (singleSessionNameInput) singleSessionNameInput.value = sessions[0];
  }
  renderSessionTabs();
  renderExpenseForm();
  renderExpenseList();
}
window.switchSession = switchSession;
function renderExpenseForm() {
  const paidBy = document.getElementById('expensePaidBy');
  if (!paidBy) return;
  paidBy.innerHTML = participants.map(p => `<option value="${p}">${p}</option>`).join('');
  const splitDiv = document.getElementById('splitAmongCheckboxes');
  if (!splitDiv) return;
  splitDiv.innerHTML = participants.map(p =>
    `<div class="form-check form-check-inline mb-2">
      <input class="form-check-input" type="checkbox" value="${p}" id="split_${p}" checked>
      <label class="form-check-label" for="split_${p}">${p}</label>
    </div>`
  ).join('');
  const gstInput = document.getElementById('expenseGst');
  if (gstInput && !gstInput.value) gstInput.value = '1.19';
}
function renderExpenseList() {
  const sessionTitle = sessionType === 'single' ? document.getElementById('singleSessionName').value.trim() : sessions[currentSessionIdx];
  const list = document.getElementById('expenseList');
  if (!list) return;
  const exps = expenses[sessionTitle] || [];
  list.innerHTML = exps.map((exp, idx) =>
    `<li>
      <span class="expense-name">${exp.name}</span> - $${(exp.amount * (exp.gst || 1.19)).toFixed(2)} 
      <span class="text-secondary">(Paid by ${exp.paid_by || exp.paidBy}, split among ${(exp.split_by || exp.splitAmong || []).join(', ')}, GST: ${exp.gst || 1.19})</span>
      <button class="btn btn-sm btn-outline-primary ms-2" onclick="editExpense(${idx})">Edit</button>
      <button class="btn btn-sm btn-outline-danger ms-1" onclick="removeExpense(${idx})">Remove</button>
    </li>`
  ).join('');
}

window.editExpense = function(idx) {
  const sessionTitle = sessionType === 'single' ? document.getElementById('singleSessionName').value.trim() : sessions[currentSessionIdx];
  const exps = expenses[sessionTitle] || [];
  const exp = exps[idx];
  if (!exp) return;
  // Populate form fields for editing
  document.getElementById('expenseName').value = exp.name;
  document.getElementById('expenseAmount').value = exp.amount;
  document.getElementById('expenseGst').value = exp.gst || 1.19;
  document.getElementById('expensePaidBy').value = exp.paid_by || exp.paidBy;
  // Set checkboxes for split among
  const splitBy = exp.split_by || exp.splitBy || [];
  participants.forEach(p => {
    const cb = document.getElementById('split_' + p);
    if (cb) cb.checked = splitBy.includes(p);
  });
  // Change add button to save
  const addBtn = document.getElementById('addExpenseBtn');
  addBtn.textContent = 'Save';
  addBtn.onclick = async function() {
    // Save changes
    const name = document.getElementById('expenseName').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const gst = parseFloat(document.getElementById('expenseGst').value) || 1.19;
    const paidBy = document.getElementById('expensePaidBy').value;
    const splitAmong = Array.from(document.querySelectorAll('#splitAmongCheckboxes input:checked')).map(cb => cb.value);
    if (!name || isNaN(amount) || amount <= 0 || !paidBy || splitAmong.length === 0) {
      alert('Please fill in all fields and select at least one participant to split.');
      return;
    }
    const sessionId = getSessionIdFromUrl();
    if (sessionId && exp.id) {
      try {
        // Pass id as primitive, update data as second arg
        await window.supabaseExpense.update(exp.id, {
          name,
          amount,
          gst,
          paid_by: paidBy,
          split_by: splitAmong
        });
      } catch (e) {
        alert('Failed to update expense in database.');
        console.log(e)
      }
    }
    exps[idx] = { ...exp, name, amount, gst, paid_by: paidBy, split_by: splitAmong };
    expenses[sessionTitle] = exps;
    renderExpenseList();
    saveToLocal();
    // Reset form and button
    document.getElementById('expenseName').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseGst').value = '1.19';
    addBtn.textContent = 'Add Expense';
    addBtn.onclick = originalAddExpenseHandler;
  };
};

window.removeExpense = async function(idx) {
  const sessionTitle = sessionType === 'single' ? document.getElementById('singleSessionName').value.trim() : sessions[currentSessionIdx];
  if (!expenses[sessionTitle]) return;
  const exp = expenses[sessionTitle][idx];
  const sessionId = getSessionIdFromUrl();
  if (sessionId && exp && exp.id) {
    try {
      await window.supabaseExpense.delete(exp.id); // Pass only the id, not the whole object
    } catch (e) {
      alert('Failed to delete expense from database.');
    }
  }
  expenses[sessionTitle].splice(idx, 1);
  renderExpenseList();
  saveToLocal();
};

// Store original addExpenseBtn handler for restoring after edit
const originalAddExpenseHandler = document.getElementById('addExpenseBtn').onclick;

// --- On page load, restore session if sessionid in URL or from localStorage ---
document.addEventListener('DOMContentLoaded', function() {
  const sessionId = getSessionIdFromUrl();
  if (!sessionId) {
    loadFromLocal();
    // Populate UI fields from localStorage data
    renderParticipants();
    renderMultiSessions();
    renderSessionTabs();
    renderExpenseForm();
    renderExpenseList();
    // Set session type radio
    if (sessionType === 'single') {
      document.getElementById('singleSession').checked = true;
      document.getElementById('singleSessionNameDiv').classList.remove('d-none');
      document.getElementById('multiSessionNamesDiv').classList.add('d-none');
      if (sessions[0]) document.getElementById('singleSessionName').value = sessions[0];
    } else {
      document.getElementById('multiSession').checked = true;
      document.getElementById('singleSessionNameDiv').classList.add('d-none');
      document.getElementById('multiSessionNamesDiv').classList.remove('d-none');
    }
    // Show share button if session exists
    if ((sessionType === 'single' && sessions[0]) || (sessionType === 'multi' && sessions.length > 0)) {
      showCopyBtnAfterSessionCreate();
    }
    return;
  }
  restoreSessionFromUrl();
});

document.getElementById('singleSessionName').addEventListener('blur', function() {
  // Update sessions array and re-render session tabs when user leaves the session name input
  const name = this.value.trim();
  if (name) {
    sessions = [name];
    saveToLocal();
    renderSessionTabs();
  }
});
document.getElementById('multiSessionNameInput').addEventListener('blur', function() {
  // Update sessions array and re-render session tabs when user leaves the multi-session name input
  const name = this.value.trim();
  if (name && !sessions.includes(name)) {
    sessions.push(name);
    saveToLocal();
    renderMultiSessions();
    renderSessionTabs();
    this.value = '';
  } else {
    renderMultiSessions();
    renderSessionTabs();
  }
});

document.getElementById('resetSplitterBtn').addEventListener('click', function() {
  resetSplitterState();
});

// Only logic to reset the splitter, no DOM placement
function resetSplitterState() {
  if (confirm('Are you sure you want to reset the bill splitter? This will erase all unsaved session data.')) {
    localStorage.removeItem('billSplitterSession');
    participants = [];
    sessionType = 'single';
    sessions = [];
    expenses = {};
    currentSessionIdx = 0;
    if (document.getElementById('singleSessionName')) document.getElementById('singleSessionName').value = '';
    if (document.getElementById('multiSessionNameInput')) document.getElementById('multiSessionNameInput').value = '';
    renderParticipants();
    renderMultiSessions();
    renderSessionTabs();
    renderExpenseForm();
    renderExpenseList();
    document.getElementById('singleSession').checked = true;
    document.getElementById('singleSessionNameDiv').classList.remove('d-none');
    document.getElementById('multiSessionNamesDiv').classList.add('d-none');
    if (copyBtn) copyBtn.style.display = 'none';
  }
}

// --- Add Participant Button ---
const addParticipantBtn = document.getElementById('addParticipantBtn');
addParticipantBtn.addEventListener('click', function() {
  if (participantInput.value.trim()) {
    addParticipant(participantInput.value.trim());
    participantInput.value = '';
  }
});

