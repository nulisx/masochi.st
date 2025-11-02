const express = require('express');
const path = require('path');

const app = express();
const PORT = 5000;

// Serve static files
app.use(express.static(__dirname));

// Route handlers for specific pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login', 'index.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register', 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});

app.get('/account', (req, res) => {
    res.sendFile(path.join(__dirname, 'account', 'account.html'));
});

app.get('/collectibles', (req, res) => {
    res.sendFile(path.join(__dirname, 'collectibles', 'index.html'));
});

app.get('/integrations', (req, res) => {
    res.sendFile(path.join(__dirname, 'integrations', 'index.html'));
});

app.get('/images', (req, res) => {
    res.sendFile(path.join(__dirname, 'images', 'index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`🌐 og.email is live!`);
});
