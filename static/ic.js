const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const db = new sqlite3.Database('database.db', (err) => {
    if (err) {
        console.error("Could not connect to database:", err);
    } else {
        db.run(`CREATE TABLE IF NOT EXISTS invites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            used INTEGER DEFAULT 0
        )`);
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
            res.json({ code: inviteCode });
        }
    });
});

app.use(express.static('static'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
