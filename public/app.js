// Use a relative URL for the API. This will work both locally and on Render.
const API_URL = '/api';

// Elementos DOM
const clientSelect = document.getElementById('clientSelect');
const proceduresContainer = document.getElementById('proceduresContainer');
const proceduresList = document.getElementById('proceduresList');
const addProcedureBtn = document.getElementById('addProcedureBtn');
const editProcedureBtn = document.getElementById('editProcedureBtn');
const deleteProcedureBtn = document.getElementById('deleteProcedureBtn');
const quillEditorContainer = document.getElementById('quill-editor-container');
const editorDiv = document.getElementById('editor');
const saveQuillProcedureBtn = document.getElementById('save-quill-procedure-btn');
const cancelQuillProcedureBtn = document.getElementById('cancel-quill-procedure-btn');
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
    const currentClientId = clientSelect.value;
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
    clientSelect.value = currentClientId;
}

let providerIds = {};

async function populateProviders() {
    const currentProviderId = providerSelect.value;
    const providers = await fetchData(`${API_URL}/providers`);
    providerSelect.innerHTML = '<option value="">-- Escolha um prestador --</option>';
    providerIds = {}; // Reset the mapping
    if (providers) {
        providers.forEach(provider => {
            const option = document.createElement('option');
            option.value = provider.id;
            option.textContent = provider.name;
            providerSelect.appendChild(option);
            providerIds[provider.name] = provider.id; // Store the mapping
        });
    }

    // Check and add 'AON' and 'DEMAIS CLIENTES' if they don't exist
    const requiredProviders = ['AON', 'DEMAIS CLIENTES'];
    let providersAdded = false;
    for (const name of requiredProviders) {
        if (!providerIds[name]) {
            console.log(`Adding missing provider: ${name}`);
            await fetchData(`${API_URL}/providers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name }),
            });
            providersAdded = true;
        }
    }

    if (providersAdded) {
        // Re-populate providers if any were added
        await populateProviders();
        return; // Exit to avoid re-setting currentProviderId with old values
    }

    providerSelect.value = currentProviderId;
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

async function showAllProviderProcedures(providerId, sinistroType) {
    if (!providerId || !sinistroType) {
        additionalProviderProceduresContainer.style.display = 'none';
        providerProceduresContainer.style.display = 'none';
        return;
    }

    const allProcedures = await fetchData(`${API_URL}/providers/${providerId}/procedures/${sinistroType}`);

    let aonProcedures = [];
    let demaisClientesProcedures = [];

    if (allProcedures) {
        aonProcedures = allProcedures.filter(proc => proc.category === 'AON');
        demaisClientesProcedures = allProcedures.filter(proc => proc.category === 'DEMAIS CLIENTES');
    }

    // Populate AON procedures
    additionalProviderProceduresList.innerHTML = '';
    if (aonProcedures) {
        aonProcedures.forEach((proc, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${proc.procedure_text}`;
            li.dataset.id = proc.id;

            li.addEventListener('click', () => {
                const currentlySelected = additionalProviderProceduresList.querySelector('.selected');
                if (currentlySelected) {
                    currentlySelected.classList.remove('selected');
                }
                li.classList.add('selected');
            });

            additionalProviderProceduresList.appendChild(li);
        });
    }

    // Populate DEMAIS CLIENTES procedures
    providerProceduresList.innerHTML = '';
    if (demaisClientesProcedures) {
        demaisClientesProcedures.forEach((proc, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${proc.procedure_text}`;
            li.dataset.id = proc.id;

            li.addEventListener('click', () => {
                const currentlySelected = providerProceduresList.querySelector('.selected');
                if (currentlySelected) {
                    currentlySelected.classList.remove('selected');
                }
                li.classList.add('selected');
            });

            providerProceduresList.appendChild(li);
        });
    }

    // Update titles and display containers
    const selectedProviderName = providerSelect.options[providerSelect.selectedIndex]?.textContent || '';
    additionalProviderProceduresTitle.textContent = `Procedimentos do Prestador (${selectedProviderName}) AON - ${sinistroType}`;
    providerProceduresTitle.textContent = `Procedimentos do Prestador (${selectedProviderName}) DEMAIS CLIENTES - ${sinistroType}`;

    additionalProviderProceduresContainer.style.display = 'block';
    providerProceduresContainer.style.display = 'block';
}

// --- Lógica de Eventos ---
document.addEventListener('DOMContentLoaded', () => {
    populateClients();
    populateProviders();

    clientSelect.addEventListener('change', () => {
        const clientId = clientSelect.value;
        showProcedures(clientId);
    });

    providerSelect.addEventListener('change', () => {
        const providerId = providerSelect.value;
        const sinistroType = sinistroSelect.value;
        showAllProviderProcedures(providerId, sinistroType);
    });

    sinistroSelect.addEventListener('change', () => {
        const providerId = providerSelect.value;
        const sinistroType = sinistroSelect.value;
        showAllProviderProcedures(providerId, sinistroType);
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

    editClientBtn.addEventListener('click', async () => {
        const clientId = clientSelect.value;
        if (!clientId) {
            alert('Por favor, selecione um cliente para editar.');
            return;
        }

        const selectedOption = clientSelect.options[clientSelect.selectedIndex];
        const currentName = selectedOption.textContent;

        const newName = prompt('Edite o nome do cliente:', currentName);

        if (newName && newName.trim() !== '' && newName !== currentName) {
            await fetchData(`${API_URL}/clients/${clientId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName }),
            });
            
            alert('Nome do cliente atualizado com sucesso!');
            await populateClients();
        }
    });

    addProviderBtn.addEventListener('click', async () => {
        const providerName = prompt('Digite o nome do novo prestador:');
        if (providerName) {
            const newProvider = await fetchData(`${API_URL}/providers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: providerName }),
            });
            if (newProvider) {
                alert('Prestador adicionado com sucesso!');
                populateProviders();
            }
        }
    });

    editProviderBtn.addEventListener('click', async () => {
        const providerId = providerSelect.value;
        if (!providerId) {
            alert('Por favor, selecione um prestador para editar.');
            return;
        }

        const currentName = providerSelect.options[providerSelect.selectedIndex].textContent;
        const newName = prompt('Edite o nome do prestador:', currentName);

        if (newName && newName.trim() !== '' && newName !== currentName) {
            await fetchData(`${API_URL}/providers/${providerId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName }),
            });
            
            alert('Nome do prestador atualizado com sucesso!');
            await populateProviders();
            providerSelect.value = providerId; // Re-select the edited provider
        }
    });

    deleteProviderBtn.addEventListener('click', async () => {
        const providerId = providerSelect.value;
        if (!providerId) {
            alert('Por favor, selecione um prestador para remover.');
            return;
        }

        const providerName = providerSelect.options[providerSelect.selectedIndex].textContent;

        if (confirm(`Tem certeza que deseja remover o prestador "${providerName}" e todos os seus procedimentos?`)) {
            await fetchData(`${API_URL}/providers/${providerId}`, {
                method: 'DELETE',
            });
            
            alert('Prestador removido com sucesso!');
            populateProviders(); // Refresh the list
            providerProceduresContainer.style.display = 'none'; // Hide procedures
        }
    });

    addProviderProcedureBtn.addEventListener('click', async () => {
        const providerId = providerSelect.value;
        const sinistroType = sinistroSelect.value;
        if (!providerId || !sinistroType) {
            alert('Por favor, selecione um prestador e um tipo de sinistro primeiro.');
            return;
        }
        const procedureText = prompt('Digite o texto do novo procedimento para o prestador:');
        if (procedureText) {
            const newProcedure = await fetchData(`${API_URL}/providers/${providerId}/procedures`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sinistro_type: sinistroType, procedure_text: procedureText, category: 'DEMAIS CLIENTES' }),
            });
            if (newProcedure) {
                alert('Procedimento do prestador adicionado com sucesso!');
                showAllProviderProcedures(sinistroType);
            }
        }
    });

    deleteProviderProcedureBtn.addEventListener('click', async () => {
        const selectedProcedure = providerProceduresList.querySelector('.selected');
        if (!selectedProcedure) {
            alert('Por favor, selecione um procedimento do prestador para remover.');
            return;
        }

        const procedureId = selectedProcedure.dataset.id;
        const providerId = providerSelect.value;
        const sinistroType = sinistroSelect.value;

        if (confirm('Tem certeza que deseja remover este procedimento do prestador?')) {
            await fetchData(`${API_URL}/provider_procedures/${procedureId}`, {
                method: 'DELETE',
            });
            
            alert('Procedimento do prestador removido com sucesso!');
            showAllProviderProcedures(sinistroType);
        }
    });

    editProviderProcedureBtn.addEventListener('click', async () => {
        const selectedProcedure = providerProceduresList.querySelector('.selected');
        if (!selectedProcedure) {
            alert('Por favor, selecione um procedimento do prestador para editar.');
            return;
        }

        const procedureId = selectedProcedure.dataset.id;
        const providerId = providerSelect.value;
        const sinistroType = sinistroSelect.value;
        const currentText = selectedProcedure.textContent.split('. ')[1] || '';

        const newText = prompt('Edite o texto do procedimento do prestador:', currentText);

        if (newText !== null && newText.trim() !== '') {
            await fetchData(`${API_URL}/provider_procedures/${procedureId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ procedure_text: newText, category: 'DEMAIS CLIENTES' }),
            });
            
            alert('Procedimento do prestador atualizado com sucesso!');
            showAllProviderProcedures(sinistroType);
        }
    });

let quill;
let editingProcedureId = null; // Variável para armazenar o ID do procedimento em edição

    addProcedureBtn.addEventListener('click', async () => {
        const clientId = clientSelect.value;
        if (!clientId) {
            alert('Por favor, selecione um cliente primeiro.');
            return;
        }
        editingProcedureId = null; // Resetar para adição
        proceduresList.style.display = 'none';
        editProcedureBtn.style.display = 'none';
        deleteProcedureBtn.style.display = 'none';
        quillEditorContainer.style.display = 'block';

        if (!quill) {
            quill = new Quill(editorDiv, {
                theme: 'snow'
            });
        }
        quill.setContents([]); // Clear previous content
    });

    saveQuillProcedureBtn.addEventListener('click', async () => {
        const clientId = clientSelect.value;
        if (!clientId) {
            alert('Por favor, selecione um cliente primeiro.');
            return;
        }
        const procedureContent = quill.root.innerHTML;
        if (procedureContent && procedureContent !== '<p><br></p>') {
            let response;
            if (editingProcedureId) {
                // Atualizar procedimento existente
                response = await fetchData(`${API_URL}/procedures/${editingProcedureId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ procedure_text: procedureContent }),
                });
            } else {
                // Adicionar novo procedimento
                response = await fetchData(`${API_URL}/clients/${clientId}/procedures`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ procedure_text: procedureContent }),
                });
            }

            if (response) {
                alert(`Procedimento ${editingProcedureId ? 'atualizado' : 'adicionado'} com sucesso!`);
                quillEditorContainer.style.display = 'none';
                quill.setContents([]);
                proceduresList.style.display = 'block';
                editProcedureBtn.style.display = 'inline-block';
                deleteProcedureBtn.style.display = 'inline-block';
                showProcedures(clientId);
            }
        } else {
            alert('O procedimento não pode estar vazio.');
        }
    });

    cancelQuillProcedureBtn.addEventListener('click', () => {
        quillEditorContainer.style.display = 'none';
        quill.setContents([]);
        proceduresList.style.display = 'block';
        editProcedureBtn.style.display = 'inline-block';
        deleteProcedureBtn.style.display = 'inline-block';
        editingProcedureId = null; // Reset editing state
    });

    editProcedureBtn.addEventListener('click', async () => {
        const selectedProcedure = proceduresList.querySelector('.selected');
        if (!selectedProcedure) {
            alert('Por favor, selecione um procedimento para editar.');
            return;
        }

        editingProcedureId = selectedProcedure.dataset.id;
        const currentText = selectedProcedure.textContent.split('. ')[1] || '';

        proceduresList.style.display = 'none';
        addProcedureBtn.style.display = 'none';
        deleteProcedureBtn.style.display = 'none';
        quillEditorContainer.style.display = 'block';

        if (!quill) {
            quill = new Quill(editorDiv, {
                theme: 'snow'
            });
        }
        quill.root.innerHTML = currentText; // Load existing content
    });

    // Event listeners for AON provider procedures
    addAdditionalProviderProcedureBtn.addEventListener('click', async () => {
        const sinistroType = sinistroSelect.value;
        const aonProviderId = providerIds['AON'];

        if (!aonProviderId || !sinistroType) {
            alert('O provedor AON não foi encontrado ou nenhum tipo de sinistro foi selecionado.');
            return;
        }

        const procedureText = prompt('Digite o texto do novo procedimento para o prestador AON:');
        if (procedureText) {
            const newProcedure = await fetchData(`${API_URL}/providers/${aonProviderId}/procedures`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sinistro_type: sinistroType, procedure_text: procedureText, category: 'AON' }),
            });
            if (newProcedure) {
                alert('Procedimento do prestador AON adicionado com sucesso!');
                showAllProviderProcedures(sinistroType);
            }
        }
    });

    editAdditionalProviderProcedureBtn.addEventListener('click', async () => {
        const selectedProcedure = additionalProviderProceduresList.querySelector('.selected');
        if (!selectedProcedure) {
            alert('Por favor, selecione um procedimento do prestador AON para editar.');
            return;
        }

        const procedureId = selectedProcedure.dataset.id;
        const sinistroType = sinistroSelect.value;
        const currentText = selectedProcedure.textContent.split('. ')[1] || '';

        const newText = prompt('Edite o texto do procedimento do prestador AON:', currentText);

        if (newText !== null && newText.trim() !== '') {
            await fetchData(`${API_URL}/provider_procedures/${procedureId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ procedure_text: newText, category: 'AON' }),
            });
            
            alert('Procedimento do prestador AON atualizado com sucesso!');
            showAllProviderProcedures(sinistroType);
        }
    });

    deleteAdditionalProviderProcedureBtn.addEventListener('click', async () => {
        const selectedProcedure = additionalProviderProceduresList.querySelector('.selected');
        if (!selectedProcedure) {
            alert('Por favor, selecione um procedimento do prestador AON para remover.');
            return;
        }

        const procedureId = selectedProcedure.dataset.id;
        const sinistroType = sinistroSelect.value;

        if (confirm('Tem certeza que deseja remover este procedimento do prestador AON?')) {
            await fetchData(`${API_URL}/provider_procedures/${procedureId}`, {
                method: 'DELETE',
            });
            
            alert('Procedimento do prestador AON removido com sucesso!');
            showAllProviderProcedures(sinistroType);
        }
    });
});
