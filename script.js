document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const client = urlParams.get('client');
    document.getElementById('client-name').textContent = `Controle de Backups - ${client || 'Cliente Padrão'}`;

    document.getElementById('data-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const serial = document.getElementById('serial').value.trim().toUpperCase();
        const model = document.getElementById('model').value.trim().toUpperCase();
        const date = new Date().toISOString().split('T')[0];
        const currie = document.getElementById('currie').value.trim().toUpperCase();

        if (!serial || !model || !currie) {
            alert('Preencha todos os campos antes de adicionar.');
            return;
        }

        const duplicateRow = isDuplicateSerial(serial);
        if (duplicateRow) {
            if (confirm("ESN já registrado! Deseja remover o ESN existente?")) {
                removeRow(duplicateRow);
            } else {
                document.getElementById('serial').style.borderColor = "red";
                return;
            }
        }

        document.getElementById('serial').style.borderColor = "";
        addNewEntry(serial, model, date, currie);
        document.getElementById('data-form').reset();
        sortTableByColumn(1);
        updateTimeColumn();
    });

    function isDuplicateSerial(serial) {
        const rows = document.querySelectorAll('#data-table tbody tr');
        for (const row of rows) {
            if (row.cells[1].textContent === serial) return row;
        }
        return null;
    }

    function addNewEntry(serial, model, date, currie) {
        const tableBody = document.querySelector('#data-table tbody');
        const row = document.createElement('tr');
        const formattedDate = formatDate(date);

        row.innerHTML = `
            <td>${tableBody.children.length + 1}</td>
            <td>${serial}</td>
            <td>${model}</td>
            <td>${formattedDate}</td>
            <td>${currie}</td>
            <td></td>
            <td><button onclick="removeRow(this)">Remover</button></td>
        `;
        tableBody.appendChild(row);
        addCourierToSelect(currie);
    }

    function formatDate(date) {
        return date.split('-').reverse().join('/');
    }

    function removeRow(button) {
        const row = button.closest('tr');
        row.parentElement.removeChild(row);
        updateTimeColumn();
    }

    function sortTableByColumn(columnIndex) {
        const rows = Array.from(document.querySelectorAll('#data-table tbody tr'));
        rows.sort((a, b) => a.cells[columnIndex].textContent.localeCompare(b.cells[columnIndex].textContent));
        const tableBody = document.querySelector('#data-table tbody');
        rows.forEach(row => tableBody.appendChild(row));
    }

    function addCourierToSelect(currie) {
        const select = document.getElementById('currie');
        if (![...select.options].some(option => option.value === currie)) {
            const option = document.createElement('option');
            option.value = currie;
            option.textContent = currie;
            select.appendChild(option);
        }
    }

    document.getElementById('search-box').addEventListener('input', function () {
        const input = this.value.trim().toUpperCase();
        const table = document.getElementById('data-table');
        const rows = table.querySelectorAll('tbody tr');
        const column = parseInt(document.getElementById('search-column').value);

        rows.forEach(row => {
            const cell = row.cells[column];
            if (cell) {
                const txtValue = cell.textContent || cell.innerText;
                row.style.display = txtValue.toUpperCase().includes(input) ? "" : "none";
            }
        });
    });
});
