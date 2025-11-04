const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(__dirname));

const isProduction = process.env.NODE_ENV === 'production';
let db;

if (isProduction) {
    const supabaseUrl = 'https://zngfwjhxqrgoikvmwtfx.supabase.co';
    const supabaseKey = process.env.SUPABASE_KEY;
    db = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Using Supabase hosted database');
} else {
    const Database = require('better-sqlite3');
    const dbPath = path.join(__dirname, 'database.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    console.log('✅ Using local SQLite database at', dbPath);

    // Initialize tables for local development
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT,
            custom_url TEXT UNIQUE,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            bio TEXT,
            avatar_url TEXT,
            theme TEXT DEFAULT 'default',
            custom_css TEXT
        );
        CREATE TABLE IF NOT EXISTS links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            url TEXT NOT NULL,
            icon TEXT,
            clicks INTEGER DEFAULT 0,
            position INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS invites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            created_by INTEGER,
            role TEXT DEFAULT 'user',
            max_uses INTEGER DEFAULT 1,
            uses_count INTEGER DEFAULT 0,
            used INTEGER DEFAULT 0,
            used_by INTEGER,
            expires_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            used_at DATETIME
        );
    `);

    const existingOwner = db.prepare('SELECT * FROM users WHERE username = ?').get('r');
    if (!existingOwner) {
        const passwordHash = bcrypt.hashSync('ACK071675$!', 12);
        db.prepare(`
            INSERT INTO users (username, email, password_hash, display_name, role)
            VALUES (?, ?, ?, ?, ?)
        `).run('r', 'asmo@drugsellers.com', passwordHash, 'r', 'owner');
        console.log('✅ Default owner account created');
    }
}

// ---------- Abstracted DB functions ----------
async function runQuery(table, values) {
    if (isProduction) {
        const { data, error } = await db.from(table).insert(values).select();
        if (error) throw error;
        return data[0];
    } else {
        const keys = Object.keys(values);
        const vals = Object.values(values);
        const placeholders = keys.map(() => '?').join(',');
        const stmt = db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`);
        return stmt.run(...vals);
    }
}

async function getQuery(table, column, value) {
    if (isProduction) {
        const { data, error } = await db.from(table).select('*').eq(column, value).single();
        if (error) return null;
        return data;
    } else {
        return db.prepare(`SELECT * FROM ${table} WHERE ${column} = ?`).get(value);
    }
}

async function allQuery(table, column, value) {
    if (isProduction) {
        const { data, error } = await db.from(table).select('*').eq(column, value);
        if (error) return [];
        return data;
    } else {
        return db.prepare(`SELECT * FROM ${table} WHERE ${column} = ?`).all(value);
    }
}

// ---------- Auth middleware ----------
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

const roleHierarchy = { owner: 5, manager: 4, admin: 3, mod: 2, user: 1 };
const requireRole = (minRole) => (req, res, next) => {
    if (roleHierarchy[req.user.role] < roleHierarchy[minRole]) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
};

// ---------- Routes ----------

// Register
app.post('/api/auth/register', [
    body('username').isLength({ min: 1, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('inviteCode').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, email, password, inviteCode } = req.body;

    try {
        const invite = await getQuery('invites', 'code', inviteCode);
        if (!invite || invite.used) return res.status(400).json({ error: 'Invalid or used invite code' });

        const passwordHash = await bcrypt.hash(password, 12);
        const newUser = await runQuery('users', { username, email, password_hash: passwordHash, display_name: username, role: invite.role });

        await runQuery('profiles', { user_id: isProduction ? newUser.id : newUser.lastInsertRowid });

        res.json({ message: 'Registration successful', userId: isProduction ? newUser.id : newUser.lastInsertRowid });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Add login, profile, links, invites routes here using getQuery/runQuery/allQuery same way

// Frontend routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login', 'index.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'register', 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'dashboard', 'index.html')));
app.get('/account', (req, res) => res.sendFile(path.join(__dirname, 'account', 'account.html')));
app.get('/collectibles', (req, res) => res.sendFile(path.join(__dirname, 'collectibles', 'index.html')));
app.get('/integrations', (req, res) => res.sendFile(path.join(__dirname, 'integrations', 'index.html')));
app.get('/images', (req, res) => res.sendFile(path.join(__dirname, 'images', 'index.html')));

app.use((req, res) => res.status(404).sendFile(path.join(__dirname, '404.html')));

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on http://0.0.0.0:${PORT}`));
