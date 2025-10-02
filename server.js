const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para servir arquivos estáticos (index.html, app.js, styles.css)
app.use(express.static(__dirname));

// Rotas da API (simuladas por enquanto)
app.get('/api/clients', (req, res) => {
    res.json([]);
});

app.get('/api/clients/:clientId/procedures', (req, res) => {
    res.json([]);
});

app.get('/api/providers', (req, res) => {
    res.json([]);
});

app.get('/api/providers/:providerId/procedures/:sinistroType', (req, res) => {
    res.json([]);
});

// Rota principal para servir o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
