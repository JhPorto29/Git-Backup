<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Controle de Backups</title>
    <link rel="stylesheet" href="styles.css">
    <script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"></script>
    <script src="script.js" defer></script>
</head>
<body>
    <header class="banner">
        <div class="banner-content"></div>
    </header>
    <h1 id="client-name">Controle de Backups</h1>

    <div class="home-button">
        <button onclick="goHome()">Home</button>
    </div>
    <div class="transport-button">
        <button onclick="goToTransportPage()">Página de Transporte</button>
    </div>

    <form id="data-form">
        <label for="serial">ESN:</label>
        <input type="text" id="serial" name="serial" required>
        <span id="duplicate-message" class="error-message"></span>
        <button type="button" id="remove-duplicate-btn" class="remove-btn" style="display:none;" onclick="removeDuplicate()">Remover Duplicado</button>

        <label for="model">Modelo:</label>
        <input type="text" id="model" name="model" required>

        <label for="currie">Nome Courier:</label>
        <select id="currie" name="currie" required></select>

        <div class="buttons">
            <button type="submit">Adicionar ESN</button>
        </div>
    </form>

    <h2>Dados Registrados</h2>
    <div class="search-container">
        <select id="search-column">
            <option value="1">ESN</option>
            <option value="2">Modelo</option>
            <option value="3">Data</option>
            <option value="4">Nome Courier</option>
            <option value="5">Tempo no Sistema</option>
        </select>
        <input type="text" id="search-box" placeholder="Digite para pesquisar...">
    </div>

    <div id="table-container" style="height: 500px; overflow-y: auto;">
        <table id="data-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>ESN</th>
                    <th>Modelo</th>
                    <th>Data</th>
                    <th>Nome Courier</th>
                    <th>Tempo no Sistema</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                <!-- Dados serão adicionados aqui -->
            </tbody>
        </table>
    </div>

    <div class="action-buttons">
        <input type="file" id="import-file" style="display:none;">
        <button type="button" id="import-btn">Importar Excel</button>
        <button id="export-btn">Exportar para Excel</button>
    </div>
    <script>
        function goToTransportPage() {
            window.location.href = 'transport.html';
        }

        function goHome() {
            window.location.href = 'index.html';
        }

        document.addEventListener('DOMContentLoaded', function () {
            carregarDadosDoBackend();

            document.getElementById('data-form').addEventListener('submit', async function (event) {
                event.preventDefault();

                const serial = document.getElementById('serial').value.trim().toUpperCase();
                const model = document.getElementById('model').value.trim().toUpperCase();
                const currie = document.getElementById('currie').value.trim().toUpperCase();

                if (!serial || !model || !currie) {
                    alert('Preencha todos os campos antes de adicionar.');
                    return;
                }

                const newData = { serial, model, currie };

                try {
                    const response = await fetch('https://seu-servidor-url/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newData)
                    });

                    const savedData = await response.json();
                    adicionarLinhaNaTabela(savedData);
                    document.getElementById('data-form').reset();
                } catch (error) {
                    console.error('Erro ao adicionar dado:', error);
                }
            });

            document.getElementById('import-btn').addEventListener('click', function () {
                document.getElementById('import-file').click();
            });

            document.getElementById('import-file').addEventListener('change', function (event) {
                const file = event.target.files[0];
                if (!file) return;

                const reader = new FileReader();

                reader.onload = function (e) {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                        jsonData.forEach((row, index) => {
                            if (index === 0) return; // Ignora o cabeçalho
                            let [serial, model, date, currie] = row;

                            if (serial && model && date && currie) {
                                serial = String(serial).trim().toUpperCase();
                                model = String(model).trim().toUpperCase();
                                currie = String(currie).trim().toUpperCase();
                                const formattedDate = typeof date === 'number' ? excelDateToISO(date) : date;
                                adicionarLinhaNaTabela({ serial, model, date: formattedDate, currie });
                            }
                        });
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
        });

        async function carregarDadosDoBackend() {
            try {
                const response = await fetch('https://seu-servidor-url/dados');
                const dados = await response.json();

                dados.forEach(dado => {
                    adicionarLinhaNaTabela(dado);
                });
            } catch (error) {
                console.error('Erro ao carregar dados do backend:', error);
            }
        }

        function adicionarLinhaNaTabela(dado) {
            const tableBody = document.querySelector('#data-table tbody');
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${tableBody.children.length + 1}</td>
                <td>${dado.serial}</td>
                <td>${dado.model}</td>
                <td>${dado.date}</td>
                <td>${dado.currie}</td>
                <td>${dado.daysInSystem}</td>
                <td><button onclick="removeRow(this)">Remover</button></td>
            `;
            tableBody.appendChild(row);
        }

        function removeRow(button) {
            const row = button.closest('tr');
            row.parentElement.removeChild(row);
        }

        function excelDateToISO(excelDate) {
            const date = new Date((excelDate - 25569) * 86400 * 1000);
            return date.toISOString().split('T')[0];
        }
    </script>
</body>
</html>
