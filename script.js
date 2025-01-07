document.addEventListener('DOMContentLoaded', function () {
    const clientNameElement = document.getElementById('client-name');
    const clientName = new URLSearchParams(window.location.search).get('client') || 'Cliente Padrão';
    clientNameElement.textContent = `Controle de Backups - ${clientName}`;

    // Carregar dados do servidor ao carregar a página
    loadDataFromServer();

    document.getElementById('data-form').addEventListener('submit', async function (event) {
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

        // Adicionar na tabela
        addNewEntry(serial, model, date, currie);

        // Salvar no servidor
        await saveDataToServer(serial, model, date, currie);

        document.getElementById('data-form').reset();
        sortTableByColumn(1);
        updateTimeColumn();
    });

    document.getElementById('import-btn').addEventListener('click', function () {
        document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', async function (event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                for (const [index, row] of jsonData.entries()) {
                    if (index === 0) continue; // Ignora o cabeçalho
                    const [serial, model, date, currie] = row.map(item => String(item).trim().toUpperCase());
                    if (serial && model && date && currie) {
                        const formattedDate = typeof date === 'number' ? excelDateToISO(date) : date;
                        addNewEntry(serial, model, formattedDate, currie);
                        await saveDataToServer(serial, model, formattedDate, currie);
                    }
                }
                updateTimeColumn();
            } catch (error) {
                console.error("Erro ao processar a planilha:", error);
            }
        };
        reader.readAsArrayBuffer(file);
    });

    document.getElementById('export-btn').addEventListener('click', function () {
        const table = document.getElementById('data-table');
        const wb = XLSX.utils.table_to_book(table, { sheet: "Dados" });
        XLSX.writeFile(wb, 'dados.xlsx');
    });

    async function loadDataFromServer() {
        try {
            const response = await fetch('http://localhost:3000/api/backups');
            if (!response.ok) throw new Error('Erro ao carregar os dados do servidor.');
            const backups = await response.json();
            backups.forEach(entry => addNewEntry(entry.serial, entry.model, entry.date, entry.currie));
            updateTimeColumn();
        } catch (error) {
            console.error('Erro ao carregar dados do servidor:', error);
        }
    }

    async function saveDataToServer(serial, model, date, currie) {
        try {
            const response = await fetch('http://localhost:3000/api/backups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serial, model, date, currie }),
            });
            if (!response.ok) throw new Error('Erro ao salvar os dados no servidor.');
        } catch (error) {
            console.error('Erro ao salvar os dados no servidor:', error);
        }
    }

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
        row.innerHTML = `
            <td>${tableBody.children.length + 1}</td>
            <td>${serial}</td>
            <td>${model}</td>
            <td>${formatDate(date)}</td>
            <td>${currie}</td>
            <td></td>
            <td><button onclick="removeRow(this)">Remover</button></td>
        `;
        tableBody.appendChild(row);
    }

    function formatDate(date) {
        return date.split('-').reverse().join('/');
    }

    function excelDateToISO(excelDate) {
        const date = new Date((excelDate - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
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

    function updateTimeColumn() {
        const rows = document.querySelectorAll('#data-table tbody tr');
        rows.forEach(row => {
            const dateCell = row.cells[3];
            const timeCell = row.cells[5];
            const entryDate = new Date(dateCell.textContent.split('/').reverse().join('-'));
            const daysInSystem = calculateDaysInSystem(entryDate);
            const daysColor = getDaysColor(daysInSystem);

            timeCell.textContent = `${daysInSystem} dias`;
            timeCell.style.color = daysColor;
        });
    }

    function calculateDaysInSystem(date) {
        const currentDate = new Date();
        const entryDate = new Date(date);
        return Math.floor((currentDate - entryDate) / (1000 * 60 * 60 * 24));
    }

    function getDaysColor(days) {
        if (days <= 30) return 'green';
        else if (days <= 60) return 'orange';
        else return 'red';
    }
});
