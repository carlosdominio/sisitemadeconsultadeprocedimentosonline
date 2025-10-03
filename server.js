const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON no corpo das requisições
app.use(express.json());

// Configuração do Pool de Conexões com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});




// --- ROTAS DA API ---

// CLIENTS
app.get('/api/clients', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clients ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

app.post('/api/clients', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'O nome do cliente é obrigatório' });
    }
    try {
        const result = await pool.query('INSERT INTO clients (name) VALUES ($1) RETURNING *', [name]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao adicionar cliente' });
    }
});

app.patch('/api/clients/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'O nome do cliente é obrigatório' });
    }
    try {
        const result = await pool.query(
            'UPDATE clients SET name = $1 WHERE id = $2 RETURNING *',
            [name, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao editar cliente' });
    }
});

// PROVIDERS
app.get('/api/providers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM providers ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar prestadores' });
  }
});

app.post('/api/providers', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'O nome do prestador é obrigatório' });
    }
    try {
        const result = await pool.query('INSERT INTO providers (name) VALUES ($1) RETURNING *', [name]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao adicionar prestador' });
    }
});

app.delete('/api/providers/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM providers WHERE id = $1', [id]);
        res.status(204).send(); // 204 No Content
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover prestador' });
    }
});

app.patch('/api/providers/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'O nome do prestador é obrigatório' });
    }
    try {
        const result = await pool.query(
            'UPDATE providers SET name = $1 WHERE id = $2 RETURNING *',
            [name, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Prestador não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao editar prestador' });
    }
});

// PROVIDER PROCEDURES
app.get('/api/providers/:providerId/procedures/:sinistroType', async (req, res) => {
    const { providerId, sinistroType } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM provider_procedures WHERE provider_id = $1 AND sinistro_type = $2 ORDER BY id',
            [providerId, sinistroType]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar procedimentos do prestador' });
    }
});

app.post('/api/providers/:providerId/procedures', async (req, res) => {
    const { providerId } = req.params;
    const { sinistro_type, procedure_text, category } = req.body;
    if (!sinistro_type || !procedure_text || !category) {
        return res.status(400).json({ error: 'Tipo de sinistro, texto do procedimento e categoria são obrigatórios' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO provider_procedures (provider_id, sinistro_type, procedure_text, category) VALUES ($1, $2, $3, $4) RETURNING *',
            [providerId, sinistro_type, procedure_text, category]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao adicionar procedimento do prestador' });
    }
});

app.delete('/api/provider_procedures/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM provider_procedures WHERE id = $1', [id]);
        res.status(204).send(); // 204 No Content
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover procedimento do prestador' });
    }
});

app.patch('/api/provider_procedures/:id', async (req, res) => {
    const { id } = req.params;
    const { procedure_text, category } = req.body;
    if (!procedure_text || !category) {
        return res.status(400).json({ error: 'O texto do procedimento e a categoria são obrigatórios' });
    }
    try {
        const result = await pool.query(
            'UPDATE provider_procedures SET procedure_text = $1, category = $2 WHERE id = $3 RETURNING *',
            [procedure_text, category, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Procedimento do prestador não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao editar procedimento do prestador' });
    }
});

app.get('/api/all-provider-procedures/:sinistroType', async (req, res) => {
    const { sinistroType } = req.params;
    try {
        // Find provider IDs
        const aonProvider = await pool.query('SELECT id FROM providers WHERE name = $1', ['AON']);
        const demaisProvider = await pool.query('SELECT id FROM providers WHERE name = $1', ['DEMAIS CLIENTES']);

        const aonProviderId = aonProvider.rows[0]?.id;
        const demaisProviderId = demaisProvider.rows[0]?.id;

        // Fetch procedures
        const aonProcedures = aonProviderId ? await pool.query(
            'SELECT * FROM provider_procedures WHERE provider_id = $1 AND sinistro_type = $2 ORDER BY id',
            [aonProviderId, sinistroType]
        ) : { rows: [] };

        const demaisProcedures = demaisProviderId ? await pool.query(
            'SELECT * FROM provider_procedures WHERE provider_id = $1 AND sinistro_type = $2 ORDER BY id',
            [demaisProviderId, sinistroType]
        ) : { rows: [] };

        res.json({
            aon: aonProcedures.rows,
            demais_clientes: demaisProcedures.rows,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar todos os procedimentos do prestador' });
    }
});

app.get('/api/all-provider-procedures/:sinistroType', async (req, res) => {
    const { sinistroType } = req.params;
    try {
        // Find provider IDs
        const aonProvider = await pool.query('SELECT id FROM providers WHERE name = $1', ['AON']);
        const demaisProvider = await pool.query('SELECT id FROM providers WHERE name = $1', ['DEMAIS CLIENTES']);

        const aonProviderId = aonProvider.rows[0]?.id;
        const demaisProviderId = demaisProvider.rows[0]?.id;

        // Fetch procedures
        const aonProcedures = aonProviderId ? await pool.query(
            'SELECT * FROM provider_procedures WHERE provider_id = $1 AND sinistro_type = $2 ORDER BY id',
            [aonProviderId, sinistroType]
        ) : { rows: [] };

        const demaisProcedures = demaisProviderId ? await pool.query(
            'SELECT * FROM provider_procedures WHERE provider_id = $1 AND sinistro_type = $2 ORDER BY id',
            [demaisProviderId, sinistroType]
        ) : { rows: [] };

        res.json({
            aon: aonProcedures.rows,
            demais_clientes: demaisProcedures.rows,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar todos os procedimentos do prestador' });
    }
});

// CLIENT PROCEDURES
app.get('/api/clients/:clientId/procedures', async (req, res) => {
    const { clientId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM procedures WHERE client_id = $1 ORDER BY id', [clientId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar procedimentos' });
    }
});

app.post('/api/clients/:clientId/procedures', async (req, res) => {
    const { clientId } = req.params;
    const { procedure_text } = req.body;
    if (!procedure_text) {
        return res.status(400).json({ error: 'O texto do procedimento é obrigatório' });
    }
    try {
        const result = await pool.query('INSERT INTO procedures (client_id, procedure_text) VALUES ($1, $2) RETURNING *', [clientId, procedure_text]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao adicionar procedimento' });
    }
});

app.delete('/api/procedures/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM procedures WHERE id = $1', [id]);
        res.status(204).send(); // 204 No Content
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover procedimento' });
    }
});

app.patch('/api/procedures/:id', async (req, res) => {
    const { id } = req.params;
    const { procedure_text } = req.body;
    if (!procedure_text) {
        return res.status(400).json({ error: 'O texto do procedimento é obrigatório' });
    }
    try {
        const result = await pool.query(
            'UPDATE procedures SET procedure_text = $1 WHERE id = $2 RETURNING *',
            [procedure_text, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Procedimento não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao editar procedimento' });
    }
});

// --- SERVIR ARQUIVOS ESTÁTICOS ---
app.use(express.static(path.join(__dirname, 'public')));



// Inicia o servidor e cria as tabelas
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});