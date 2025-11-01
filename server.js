const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = new sqlite3.Database('database.db', (err) => {
    if (err) {
        console.error("Could not connect to database:", err);
    } else {
        console.log("Connected to SQLite database");
        db.run(`CREATE TABLE IF NOT EXISTS invites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            used INTEGER DEFAULT 0
        )`, (err) => {
            if (err) {
                console.error("Error creating table:", err);
            } else {
                console.log("Invites table ready");
            }
        });
    }
});

function generateInviteCode() {
    return crypto.randomBytes(4).toString('hex');
}

app.post('/generate_invite', (req, res) => {
    const inviteCode = generateInviteCode();
    db.run('INSERT INTO invites (code) VALUES (?)', [inviteCode], function(err) {
        if (err) {
            console.error("Error inserting invite code:", err);
            res.status(500).json({ error: 'Failed to generate invite code' });
        } else {
            console.log(`Generated invite code: ${inviteCode}`);
            res.json({ code: inviteCode });
        }
    });
});

app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/images', express.static(path.join(__dirname, 'images')));

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
    res.sendFile(path.join(__dirname, 'account', 'index.html'));
});

app.get('/collectibles', (req, res) => {
    res.sendFile(path.join(__dirname, 'collectibles', 'index.html'));
});

app.get('/integrations', (req, res) => {
    res.sendFile(path.join(__dirname, 'integrations', 'index.html'));
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
});
