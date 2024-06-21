document.addEventListener('DOMContentLoaded', (event) => {
    let names = []
    let expenses = JSON.parse(sessionStorage.getItem('expenses')) ? JSON.parse(sessionStorage.getItem('expenses')) : []
    if (expenses.length > 0) {
        updateExpenses();
    }

    const inputBox = document.getElementById('namesInput');
    const paidBySelect = document.getElementById('expensePaidBy');
    const splitByDropdown = document.getElementById('splitByDropdown');
    const addExpenseBtn = document.getElementById('addExpense');
    const deleteRecordBtns = document.querySelectorAll('button.delete');
    const settleUpBtn = document.getElementById('settleUpBtn');
    const settleUpListGrp = document.getElementById('settleUpListGrp');

    // get the names of all involved and dynamically add the names to the lists for paidBy and splitByDropdown
    inputBox.addEventListener('input', (event) => {
        console.log('Input value:', event.target.value);
        let namesStr = event.target.value.replace(/\s+/g, '');
        names = namesStr.split(',')

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
        console.log("clicked add expense")
        let eName = document.getElementById('expenseName').value;
        let eAmt = document.getElementById('expenseAmount').value;
        let ePaidBy = document.getElementById('expensePaidBy').value;
        let eSplitBy = document.querySelectorAll('#splitByDropdown .form-check-input');
        const splitByArr = [];
        for (checkbox of eSplitBy){
            if (checkbox.checked && checkbox.value == "all") {
                splitByArr.push(checkbox.value);
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
            "paidBy": ePaidBy,
            "splitBy": splitByArr
        }
        expenses.push(oneExpense);
        sessionStorage.setItem('expenses', JSON.stringify(expenses));
        updateExpenses(oneExpense);
        console.log(`${eName}, ${eAmt}, ${ePaidBy}, ${splitByArr.join(', ')}`)
    });

    deleteRecordBtns.forEach(button => {
        button.addEventListener('click', (event) => {
            // You can get the button that was clicked using event.target
            const buttonClicked = event.target;
            console.log(event.target.value)

            // Perform the desired action, here we just log the button's text content
            // output.innerHTML = `You clicked: ${buttonClicked.textContent}`;
        });
    });

    // get the names of all involved and dynamically add the names to the lists for paidBy and splitByDropdown
    settleUpBtn.addEventListener('click', (event) => {
        console.log('Input value:', event.target);
        let debt = settleDebts();

    });

    function updateExpenses(oneExpense = null){
        let expensesTable = document.getElementById('expensesTable');
        if (oneExpense){
            // if a new expense is passed in then just add on to the table
            expensesTable.innerHTML += `<tr>
                                            <th scope="row">${oneExpense["name"]}</th>
                                            <td>${oneExpense["amount"]}</td>
                                            <td>${oneExpense["paidBy"]}</td>
                                            <td>${oneExpense["splitBy"]}</td>
                                            <td><button type="button" class="btn btn-danger col ms-2 delete" value="${oneExpense["index"]}"><i class="bi-x"></i></button></td>
                                        </tr>`
        }
        else{
            // if its a refresh, populate table with data
            for (expense of expenses){
                expensesTable.innerHTML += `<tr>
                                                <th>${expense["name"]}</th>
                                                <td>${expense["amount"]}</td>
                                                <td>${expense["paidBy"]}</td>
                                                <td>${expense["splitBy"]}</td>
                                                <td><button type="button" class="btn btn-danger col ms-2 delete" value="${expense["index"]}"><i class="bi-x"></i></button></td>
                                            </tr>`
            }
        }

    }

    function settleDebts() {
        const transactions = expenses;
        const balances = {};

        // Calculate balances
        transactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount);
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
                        settleUpListGrp.innerHTML += `<li class="list-group-item p-3">${debtor} pays ${creditor}: $${payment.toFixed(2)}</li>`
                        // owesList.push(`${debtor} owes ${creditor}: $${payment.toFixed(2)}`);
                        owesList.push(oneOwe);
                        owes[creditor] -= payment;
                        amountOwed -= payment;
                    }
                }
            }
        }

        return owesList;
    } 
});