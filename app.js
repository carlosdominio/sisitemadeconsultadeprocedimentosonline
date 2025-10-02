// Use a relative URL for the API. This will work both locally and on Render.
const API_URL = '/api';

// Elementos DOM
const clientSelect = document.getElementById('clientSelect');
const proceduresContainer = document.getElementById('proceduresContainer');
const proceduresList = document.getElementById('proceduresList');
const addProcedureBtn = document.getElementById('addProcedureBtn');
const editProcedureBtn = document.getElementById('editProcedureBtn');
const deleteProcedureBtn = document.getElementById('deleteProcedureBtn');
const addClientBtn = document.getElementById('addClientBtn');
const editClientBtn = document.getElementById('editClientBtn');
const providerSelect = document.getElementById('providerSelect');
const providerProceduresContainer = document.getElementById('providerProceduresContainer');
const providerProceduresList = document.getElementById('providerProceduresList');
const addProviderBtn = document.getElementById('addProviderBtn');
const editProviderBtn = document.getElementById('editProviderBtn');
const editProviderImageBtn = document.getElementById('editProviderImageBtn');
const deleteProviderBtn = document.getElementById('deleteProviderBtn');
const addProviderProcedureBtn = document.getElementById('addProviderProcedureBtn');
const editProviderProcedureBtn = document.getElementById('editProviderProcedureBtn');
const deleteProviderProcedureBtn = document.getElementById('deleteProviderProcedureBtn');
const sinistroSelect = document.getElementById('sinistroSelect');
const additionalProviderProceduresContainer = document.getElementById('additionalProviderProceduresContainer');
const additionalProviderProceduresList = document.getElementById('additionalProviderProceduresList');
const additionalProviderProceduresTitle = document.getElementById('additionalProviderProceduresTitle');
const providerProceduresTitle = document.getElementById('providerProceduresTitle');
const addAdditionalProviderProcedureBtn = document.getElementById('addAdditionalProviderProcedureBtn');
const editAdditionalProviderProcedureBtn = document.getElementById('editAdditionalProviderProcedureBtn');
const deleteAdditionalProviderProcedureBtn = document.getElementById('deleteAdditionalProviderProcedureBtn');

// --- Funções de Carregamento de Dados (Fetch) ---

async function fetchData(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        if (response.status === 204) {
            return null; 
        }
        return response.json();
    } catch (error) {
        console.error('API Error:', error);
        alert('Ocorreu um erro ao comunicar com o servidor.');
        return null;
    }
}

async function populateClients() {
    const clients = await fetchData(`${API_URL}/clients`);
    clientSelect.innerHTML = '<option value="">-- Escolha um cliente --</option>';
    if (clients) {
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            clientSelect.appendChild(option);
        });
    }
}

async function showProcedures(clientId) {
    if (!clientId) {
        proceduresContainer.style.display = 'none';
        return;
    }
    const procedures = await fetchData(`${API_URL}/clients/${clientId}/procedures`);
    proceduresList.innerHTML = '';
    if (procedures) {
        procedures.forEach((proc, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${proc.procedure_text}`;
            li.dataset.id = proc.id;
            li.dataset.index = index;

            li.addEventListener('click', () => {
                const currentlySelected = proceduresList.querySelector('.selected');
                if (currentlySelected) {
                    currentlySelected.classList.remove('selected');
                }
                li.classList.add('selected');
            });

            proceduresList.appendChild(li);
        });
        proceduresContainer.style.display = 'block';
    }
}

// --- Lógica de Eventos ---
document.addEventListener('DOMContentLoaded', () => {
    populateClients();

    clientSelect.addEventListener('change', () => {
        const clientId = clientSelect.value;
        showProcedures(clientId);
    });

    addClientBtn.addEventListener('click', async () => {
        const clientName = prompt('Digite o nome do novo cliente:');
        if (clientName) {
            const newClient = await fetchData(`${API_URL}/clients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: clientName }),
            });
            if (newClient) {
                alert('Cliente adicionado com sucesso!');
                populateClients();
            }
        }
    });

    addProcedureBtn.addEventListener('click', async () => {
        const clientId = clientSelect.value;
        if (!clientId) {
            alert('Por favor, selecione um cliente primeiro.');
            return;
        }
        const procedureText = prompt('Digite o texto do novo procedimento:');
        if (procedureText) {
            const newProcedure = await fetchData(`${API_URL}/clients/${clientId}/procedures`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ procedure_text: procedureText }),
            });
            if (newProcedure) {
                alert('Procedimento adicionado com sucesso!');
                showProcedures(clientId);
            }
        }
    });

    deleteProcedureBtn.addEventListener('click', async () => {
        const selectedProcedure = proceduresList.querySelector('.selected');
        if (!selectedProcedure) {
            alert('Por favor, selecione um procedimento para remover.');
            return;
        }

        const procedureId = selectedProcedure.dataset.id;
        const clientId = clientSelect.value;

        if (confirm('Tem certeza que deseja remover este procedimento?')) {
            await fetchData(`${API_URL}/procedures/${procedureId}`, {
                method: 'DELETE',
            });
            
            alert('Procedimento removido com sucesso!');
            showProcedures(clientId);
        }
    });
});
