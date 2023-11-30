document.addEventListener('DOMContentLoaded', () => {
    // Check if there are saved items in local storage
    const savedItems = JSON.parse(localStorage.getItem('receiptItems')) || [];

    // Render the receipt on page load
    renderReceipt(savedItems);
    fetchReceiptItems();
});



function fetchReceiptItems() {
    fetch('http://localhost:3000/receiptItems')
        .then(response => response.json())
        .then(items => renderReceipt(items))
        .catch(error => console.error('Error fetching receipt items:', error));
}

function saveReceiptItems(items) {
    fetch('http://localhost:3000/receiptItems', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(items),
    })
        .then(response => response.json())
        .then(() => console.log('Receipt items saved successfully'))
        .catch(error => console.error('Error saving receipt items:', error));
}

function renderReceipt(items) {
    const receiptDiv = document.getElementById('receipt');
    receiptDiv.innerHTML = '';

    if (items.length === 0) {
        receiptDiv.innerHTML = '<p>Brak pozycji na paragonie.</p>';
        return;
    }

    const table = document.createElement('table');
    table.innerHTML = `
    <tr>
      <th>Nazwa</th>
      <th>Cena jednostkowa</th>
      <th>Ilość</th>
      <th>Łączna cena</th>
      <th>Akcje</th>
    </tr>
  `;

    items.forEach(item => {
        const row = table.insertRow();
        row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.price}</td>
      <td>${item.quantity}</td>
      <td>${(item.price * item.quantity).toFixed(2)}</td>
      <td>
        <button onclick="editItemDialog(${items.indexOf(item)})">Edytuj</button>
        <button onclick="removeItem(${items.indexOf(item)})">Usuń</button>
      </td>
    `;
    });

    receiptDiv.appendChild(table);
}

function openDialog() {
    const itemForm = document.getElementById('itemForm');
    itemForm.reset();
    document.getElementById('itemDialog').showModal();
}

function addItem() {
    const itemName = document.getElementById('itemName').value;
    const itemPrice = parseFloat(document.getElementById('itemPrice').value);
    const itemQuantity = parseInt(document.getElementById('itemQuantity').value);

    if (!itemName || isNaN(itemPrice) || isNaN(itemQuantity) || itemPrice < 0 || itemQuantity < 1) {
        alert('Proszę uzupełnić poprawnie wszystkie pola.');
        return;
    }

    const newItem = { name: itemName, price: itemPrice, quantity: itemQuantity };

    // Fetch current items from the server
    fetch('http://localhost:3000/receiptItems')
        .then(response => response.json())
        .then(savedItems => {
            savedItems.push(newItem);

            // Save to localStorage
            localStorage.setItem('receiptItems', JSON.stringify(savedItems));

            // Save to the server using POST request
            fetch('http://localhost:3000/receiptItems', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newItem),
            })
                .then(response => response.json())
                .then(() => {
                    // Render the updated receipt
                    renderReceipt(savedItems);

                    // Close the dialog
                    document.getElementById('itemDialog').close();
                })
                .catch(error => console.error('Error adding item:', error));
        })
        .catch(error => console.error('Error fetching receipt items:', error));
}


function editItemDialog(index) {
    const savedItems = JSON.parse(localStorage.getItem('receiptItems')) || [];
    const item = savedItems[index];

    document.getElementById('itemName').value = item.name;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemQuantity').value = item.quantity;

    // Save the index of the item being edited for later use
    document.getElementById('itemForm').dataset.editIndex = index;

    document.getElementById('itemDialog').showModal();
}

function editItem() {
    const itemName = document.getElementById('itemName').value;
    const itemPrice = parseFloat(document.getElementById('itemPrice').value);
    const itemQuantity = parseInt(document.getElementById('itemQuantity').value);
    const editIndex = parseInt(document.getElementById('itemForm').dataset.editIndex);

    if (!itemName || isNaN(itemPrice) || isNaN(itemQuantity) || itemPrice < 0 || itemQuantity < 1) {
        alert('Proszę uzupełnić poprawnie wszystkie pola.');
        return;
    }

    const savedItems = JSON.parse(localStorage.getItem('receiptItems')) || [];
    savedItems[editIndex] = {name: itemName, price: itemPrice, quantity: itemQuantity};
    localStorage.setItem('receiptItems', JSON.stringify(savedItems));

    renderReceipt(savedItems);
    document.getElementById('itemDialog').close();
}

function cancelEdit() {
    document.getElementById('itemForm').reset();
    document.getElementById('itemForm').removeAttribute('data-edit-index');
    document.getElementById('itemDialog').close();
}

function removeItem(index) {
    const confirmDelete = confirm('Czy na pewno chcesz usunąć tę pozycję z paragonu?');
    if (confirmDelete) {
        // Fetch current items from the server
        fetch('http://localhost:3000/receiptItems')
            .then(response => response.json())
            .then(savedItems => {
                savedItems.splice(index, 1);

                // Save to localStorage
                localStorage.setItem('receiptItems', JSON.stringify(savedItems));

                // Save to the server
                saveReceiptItems(savedItems);

                // Render the updated receipt
                renderReceipt(savedItems);
            })
            .catch(error => console.error('Error removing item:', error));
    }
}
