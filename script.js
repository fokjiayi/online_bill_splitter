document.addEventListener('DOMContentLoaded', (event) => {
    let names = sessionStorage.getItem("names") ? sessionStorage.getItem("names") : []
    let expenses = JSON.parse(sessionStorage.getItem('expenses')) ? JSON.parse(sessionStorage.getItem('expenses')) : []
    if (expenses.length > 0) {
        updateExpenses();
    }

    const createNewExpense = document.getElementById('newExpenseBtn');
    const resetSplitter = document.getElementById('resetSplitter');
    const inputBox = document.getElementById('namesInput');
    inputBox.value = sessionStorage.getItem('names') ? JSON.parse(sessionStorage.getItem('names')) : "";

    const expenseModal = new bootstrap.Modal(document.getElementById('expenseModal'), {
        keyboard: true
    });

    const paidBySelect = document.getElementById('expensePaidBy');
    const splitByDropdown = document.getElementById('splitByDropdown');
    const addExpenseBtn = document.getElementById('addExpense');
    const deleteRecordBtns = document.querySelectorAll('button.delete');
    const settleUpBtn = document.getElementById('settleUpBtn');
    const settleUpListGrp = document.getElementById('settleUpListGrp');

    resetSplitter.addEventListener('click', () => {
        console.log("Reset splitter")
        sessionStorage.removeItem('expenses')
        sessionStorage.removeItem('names')
        setTimeout(()=>{
            location.reload();
        }, 500);
    });

    createNewExpense.addEventListener('click', () => {
        console.log(names)
        if (names.length == 0){
            alert("Please enter the names before adding an expense")
        }
        else{
            showExpenseModal();
        }
    });
    
    function showExpenseModal(expense = null){
        // if user clicks on 'add expense' button
        if (!expense){
            names = JSON.parse(sessionStorage.getItem('names'))
    
            document.getElementById('expenseName').value = "";
            document.getElementById('expenseAmount').value = "";
            document.getElementById('gstCheck').checked = false;
            document.getElementById('gstAmount').value = 1.19;

            // update the names list in the split by popup
            paidBySelect.innerHTML = `<option selected>Paid By</option>`
            splitByDropdown.innerHTML = `<li class="list-group-item">
                                            <input class="form-check-input me-1" type="checkbox" value="all">
                                            <label class="form-check-label">All (${names.length})</label>
                                        </li>`
            for (name of names) {
                paidBySelect.innerHTML += `<option value='${name}'>${name}</option>\n`
                splitByDropdown.innerHTML += `<li class="list-group-item">
                                                <input class="form-check-input me-1" type="checkbox" value="${name}">
                                                <label class="form-check-label">${name}</label>
                                            </li>`
            }
            addExpenseBtn.textContent = "Add"
        }
        // if user clicks on 'edit expense' button
        else{
            document.getElementById('expenseName').value = expense.name;
            document.getElementById('expenseAmount').value = expense.amount;
            document.getElementById('gstCheck').checked = expense.gst == 1 ? false : true;
            document.getElementById('gstAmount').value = expense.gst;
            document.getElementById('expensePaidBy').value = expense.paidBy;
            let allIsChecked = false
            namesInput = document.getElementById('namesInput').value;
            names = namesInput.replace(/\s+/g, '').split(",")
            // update the names list in the split by popup
            paidBySelect.innerHTML = `<option selected>Paid By</option>`
            if (expense.splitBy.length == names.length){
                splitByDropdown.innerHTML = `<li class="list-group-item">
                                                <input class="form-check-input me-1" type="checkbox" value="all" checked>
                                                <label class="form-check-label">All (${names.length})</label>
                                            </li>`
                allIsChecked = true
            }
            else{
                splitByDropdown.innerHTML = `<li class="list-group-item">
                                                <input class="form-check-input me-1" type="checkbox" value="all">
                                                <label class="form-check-label">All (${names.length})</label>
                                            </li>`
            }
            for (name of names) {
                if (name == expense.paidBy){
                    paidBySelect.innerHTML += `<option value='${name}' selected>${name}</option>\n`
                }
                else{
                    paidBySelect.innerHTML += `<option value='${name}'  >${name}</option>\n`
                }
                if (!allIsChecked && expense.splitBy.includes(name)){
                    splitByDropdown.innerHTML += `<li class="list-group-item">
                                                    <input class="form-check-input me-1" type="checkbox" value="${name}" checked>
                                                    <label class="form-check-label">${name}</label>
                                                </li>`
                }else{
                    splitByDropdown.innerHTML += `<li class="list-group-item">
                                                    <input class="form-check-input me-1" type="checkbox" value="${name}">
                                                    <label class="form-check-label">${name}</label>
                                                </li>`
                }
    
            }
    
            let eSplitBy = document.querySelectorAll('#splitByDropdown .form-check-input');
            const splitByArr = [];
            for (checkbox of eSplitBy){
                if (eSplitBy.length - 1 == splitByArr.length){
                    if (checkbox.value == "all"){
                        checkbox.checked = true
                        break;
                    }
                }
                else if (checkbox.value in splitByArr){
                    checkbox.checked = true
                }
            }

            addExpenseBtn.textContent = "Update"
            addExpenseBtn.value = expense.index
    
    
            // updateExpenses();
            // sessionStorage.setItem('expenses', JSON.stringify(expenses));
        }
        expenseModal.show();
    }

    const amountInput = document.getElementById('expenseAmount');

    amountInput.addEventListener('change', () => {
        console.log(amountInput.value)
        if (amountInput.value < 0){
            console.log("error shld show")
            document.getElementById('amtErrorMsg').classList.remove("d-none")
            document.getElementById('addExpense').setAttribute("disabled", true)
        }
        else{
            console.log("error not shown")

            document.getElementById('amtErrorMsg').classList.add("d-none")
            document.getElementById('addExpense').removeAttribute("disabled", true)
        }
    });

    // get the names of all involved and dynamically add the names to the lists for paidBy and splitByDropdown
    inputBox.addEventListener('input', (event) => {
        console.log('Input value:', event.target.value);
        let namesStr = event.target.value.replace(/\s+/g, '');
        names = namesStr.split(',')
        sessionStorage.setItem('names', JSON.stringify(names))

        // update the names list in the split by popup
        paidBySelect.innerHTML = `<option selected>Paid By</option>`
        splitByDropdown.innerHTML = `<li class="list-group-item">
                                        <input class="form-check-input me-1" type="checkbox" value="all">
                                        <label class="form-check-label">All (${names.length})</label>
                                    </li>`
        for (name of names) {
            paidBySelect.innerHTML += `<option value='${name}'>${name}</option>\n`
            splitByDropdown.innerHTML += `<li class="list-group-item">
                                            <input class="form-check-input me-1" type="checkbox" value="${name}">
                                            <label class="form-check-label">${name}</label>
                                        </li>`
        }
    });

    // create new expense and add them to the table / card  
    addExpenseBtn.addEventListener('click', (event) => {
        let eName = document.getElementById('expenseName').value;
        let eAmt = document.getElementById('expenseAmount').value;
        let eGstCheck = document.getElementById('gstCheck').checked;
        let eGstAmt = document.getElementById('gstAmount').value;
        let ePaidBy = document.getElementById('expensePaidBy').value;
        let eSplitBy = document.querySelectorAll('#splitByDropdown .form-check-input');
        const splitByArr = [];
        for (checkbox of eSplitBy){
            if (checkbox.checked && checkbox.value == "all") {
                splitByArr.push(...names);
                break;
            }
            else if(checkbox.checked){
                splitByArr.push(checkbox.value);
            }
        }
        let oneExpense = {
            "index": expenses.length,
            "name": eName,
            "amount": eAmt,
            "gst": eGstCheck ? eGstAmt : 1,
            "paidBy": ePaidBy,
            "splitBy": splitByArr
        }
        if (addExpenseBtn.textContent == "Add"){
            expenses.push(oneExpense);
        }
        else{
            expenses = JSON.parse(sessionStorage.getItem('expenses'));
            for (let i=0; i<expenses.length; i++){
                if (expenses[i].index == addExpenseBtn.value){
                    expenses[i] = oneExpense
                }
            }
        }
        sessionStorage.setItem('expenses', JSON.stringify(expenses));
        updateExpenses();

        console.log(`${eName}, ${eAmt}, ${eGstAmt}, ${ePaidBy}, ${splitByArr.join(', ')}`)
        document.getElementById('expenseName').value = ""
        document.getElementById('expenseAmount').value = ""
        ePaidBy = "Paid By"
        settleUpListGrp.innerHTML = ""
        expenseModal.hide();
    });

    // get the names of all involved and dynamically add the names to the lists for paidBy and splitByDropdown
    settleUpBtn.addEventListener('click', (event) => {
        // console.log('Input value:', event.target);
        let debt = settleDebts();

    });

    // for when the user creates a new expense or whem the page is refreshed
    function updateExpenses(oneExpense = null){
        expenses = JSON.parse(sessionStorage.getItem('expenses'));
        let expensesTable = document.getElementById('expensesTable');
        let expensesCards = document.getElementById('expensesCards');
        if (oneExpense){
            // if a new expense is passed in then just add on to the table
            expensesTable.innerHTML += `<tr>
                                            <th scope="row">${oneExpense["name"]}</th>
                                            <td>${oneExpense["amount"]}</td>
                                            <td>${oneExpense["gst"]}</td>
                                            <td>${oneExpense["paidBy"]}</td>
                                            <td>${oneExpense["splitBy"]}</td>
                                            <td><button type="button" class="btn btn-secondary col ms-2 edit" value="${oneExpense["index"]}"><i class="bi-pencil-square"></i></button></td>
                                            <td><button type="button" class="btn btn-danger col ms-2 delete" value="${oneExpense["index"]}"><i class="bi-x"></i></button></td>
                                        </tr>`

            expensesCards.innerHTML += `<div class="card w-100 mb-2" style="width: 18rem;">
                                            <div class="card-body">
                                                <h5 class="card-title d-flex">
                                                    <span class="flex-fill">${oneExpense["name"]}</span>
                                                    <button type="button" class="btn btn-secondary ms-2 edit" value="${oneExpense["index"]}"><i class="bi-pencil-square"></i></button>
                                                    <button type="button" class="btn btn-danger ms-2 delete" value="${oneExpense["index"]}"><i class="bi-x"></i></button>
                                                </h5>
                                                <div class="card-text">
                                                        <div class="mb-2">
                                                            <label for="expenseAmtMobile" class="form-label">Amount</label>
                                                            <input type="text" class="form-control" id="expenseAmtMobile" disabled value="${oneExpense["amount"]}">
                                                        </div>
                                                        <div class="mb-2">
                                                            <label for="expenseGstMobile" class="form-label">Include GST</label>
                                                            <input type="text" class="form-control" id="expenseNameMobile" disabled value="${oneExpense["gst"]}">
                                                        </div>
                                                        <div class="mb-2">
                                                            <label for="paidByMobile" class="form-label">Paid By</label>
                                                            <input type="text" class="form-control" id="paidByMobile" disabled value="${oneExpense["paidBy"]}">
                                                        </div>
                                                        <div class="mb-2">
                                                            <label for="splitByMobile" class="form-label">Split Between</label>
                                                            <input type="text" class="form-control" id="splitByMobile" disabled value="${oneExpense["splitBy"]}">
                                                        </div>
                                                </div>
                                            </div>
                                        </div>`
    }
        else{
            expensesTable.innerHTML = ""
            expensesCards.innerHTML = ""
            // if its a refresh, populate table with data
            for (expense of expenses){
                console.log(expense)
                expensesTable.innerHTML += `<tr>
                                                <th>${expense["name"]}</th>
                                                <td>${expense["amount"]}</td>
                                                <td>${expense["gst"]}</td>
                                                <td>${expense["paidBy"]}</td>
                                                <td>${expense["splitBy"]}</td>
                                                <td><button type="button" class="btn btn-secondary col ms-2 edit" value="${expense["index"]}"><i class="bi-pencil-square"></i></button></td>
                                                <td><button type="button" class="btn btn-danger col ms-2 delete" value="${expense["index"]}"><i class="bi-x"></i></button></td>
                                            </tr>`
                expensesCards.innerHTML += `<div class="card w-100 mb-3" style="width: 18rem;">
                                                <div class="card-body">
                                                    <h5 class="card-title d-flex">
                                                        <span class="flex-fill">${expense["name"]}</span>
                                                        <button type="button" class="btn btn-secondary ms-2 edit" value="${expense["index"]}"><i class="bi-pencil-square"></i></button>
                                                        <button type="button" class="btn btn-danger ms-2 delete" value="${expense["index"]}"><i class="bi-x"></i></button>
                                                    </h5>
                                                    <div class="card-text">
                                                        <div class="mb-2">
                                                            <label for="expenseAmtMobile" class="form-label">Amount</label>
                                                            <input type="text" class="form-control" id="expenseAmtMobile" disabled value="${expense["amount"]}">
                                                        </div>
                                                        <div class="mb-2">
                                                            <label for="expenseGstMobile" class="form-label">Amount</label>
                                                            <input type="text" class="form-control" id="expenseGstMobile" disabled value="${expense["gst"]}">
                                                        </div>
                                                        <div class="mb-2">
                                                            <label for="paidByMobile" class="form-label">Paid By</label>
                                                            <input type="text" class="form-control" id="paidByMobile" disabled value="${expense["paidBy"]}">
                                                        </div>
                                                        <div class="mb-2">
                                                            <label for="splitByMobile" class="form-label">Split Between</label>
                                                            <input type="text" class="form-control" id="splitByMobile" disabled value="${expense["splitBy"]}">
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>`
            }
        }
        addDeleteEventListeners();
        addEditEventListeners();

    }

    
    function addDeleteEventListeners() {
        const deleteButtons = document.querySelectorAll('.delete');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const indexToDelete = parseInt(event.target.closest('button').value);
                deleteExpense(indexToDelete);
            });
        });
    }

    function deleteExpense(index) {
        expenses = expenses.filter(expense => expense.index !== index);
        sessionStorage.setItem('expenses', JSON.stringify(expenses));
        updateExpenses();
    }

    function addEditEventListeners() {
        const editButtons = document.querySelectorAll('.edit');
        editButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const indexToEdit = parseInt(event.target.closest('button').value);
                editExpense(indexToEdit);
            });
        });
    }

    function editExpense(index) {
        expenseModal.show();
        expense = expenses.filter(expense => expense.index == index)[0];
        showExpenseModal(expense)
    }

    function settleDebts() {
        console.log(expenses)
        const transactions = expenses;
        const balances = {};

        // Calculate balances
        transactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount) * parseFloat(transaction.gst);
            const splitBy = transaction.splitBy;
            const paidBy = transaction.paidBy;
            
            if (splitBy.includes("all")) {
                const uniqueParticipants = new Set();
                transactions.forEach(t => {
                    uniqueParticipants.add(t.paidBy);
                    t.splitBy.forEach(p => {
                        if (p !== "all") {
                            uniqueParticipants.add(p);
                        }
                    });
                });
                splitBy.splice(splitBy.indexOf("all"), 1, ...uniqueParticipants);
            }

            const share = amount / splitBy.length;

            // Update balances for the payer
            if (!balances[paidBy]) {
                balances[paidBy] = 0;
            }
            balances[paidBy] += amount;

            // Update balances for the split participants
            splitBy.forEach(person => {
                if (!balances[person]) {
                    balances[person] = 0;
                }
                balances[person] -= share;
            });
        });

        // Determine who owes whom
        const owes = {};
        for (let person in balances) {
            if (balances[person] > 0) {
                owes[person] = balances[person];
            }
        }

        const owesList = [];
        settleUpListGrp.innerHTML = ""
        for (let debtor in balances) {
            if (balances[debtor] < 0) {
                let amountOwed = -balances[debtor];
                for (let creditor in owes) {
                    if (amountOwed === 0) break;
                    if (owes[creditor] > 0) {
                        const payment = Math.min(amountOwed, owes[creditor]);
                        oneOwe = {
                            "debtor":debtor,
                            "creditor":creditor,
                            "payment":payment.toFixed(2)
                        }
                        console.log(`${debtor} pays ${creditor}: $${payment.toFixed(2)}`)
                        settleUpListGrp.innerHTML += `<li class="list-group-item p-3">${debtor} pays ${creditor}: $${payment.toFixed(2)}</li>`
                        // owesList.push(`${debtor} owes ${creditor}: $${payment.toFixed(2)}`);
                        owesList.push(oneOwe);
                        owes[creditor] -= payment;
                        amountOwed -= payment;
                    }
                }
            }
        }
        document.getElementById('settle-up-table').scrollIntoView({ behavior: 'smooth' });
    } 
});