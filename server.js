const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(__dirname));

let db;
const isProduction = process.env.NODE_ENV === 'production';

// ---------- DATABASE SETUP ----------
if (isProduction && process.env.DATABASE_URL) {
    // Hosted DB (PostgreSQL / Supabase / Vercel)
    const { Pool } = require('pg');
    db = new Pool({ connectionString: process.env.DATABASE_URL });
    console.log('✅ Using hosted PostgreSQL database');
} else {
    // Local SQLite
    const Database = require('better-sqlite3');

    // Use absolute path in a writable directory
    const dbPath = path.join(__dirname, 'database.db');

    try {
        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
        console.log('✅ Using local SQLite database at', dbPath);
    } catch (err) {
        console.error('❌ Failed to open SQLite database:', err);
        process.exit(1);
    }
}

// Helper function to run SQL safely for both SQLite and Postgres
async function runQuery(sql, params = []) {
    if (isProduction && process.env.DATABASE_URL) {
        const client = await db.connect();
        try {
            const res = await client.query(sql, params);
            return res;
        } finally {
            client.release();
        }
    } else {
        return db.prepare(sql).run(...params);
    }
}

async function getQuery(sql, params = []) {
    if (isProduction && process.env.DATABASE_URL) {
        const client = await db.connect();
        try {
            const res = await client.query(sql, params);
            return res.rows[0];
        } finally {
            client.release();
        }
    } else {
        return db.prepare(sql).get(...params);
    }
}

async function allQuery(sql, params = []) {
    if (isProduction && process.env.DATABASE_URL) {
        const client = await db.connect();
        try {
            const res = await client.query(sql, params);
            return res.rows;
        } finally {
            client.release();
        }
    } else {
        return db.prepare(sql).all(...params);
    }
}

// ---------- DATABASE INITIALIZATION ----------
async function initializeDatabase() {
    if (!isProduction) {
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                display_name TEXT,
                custom_url TEXT UNIQUE,
                role TEXT DEFAULT 'user' CHECK(role IN ('owner', 'manager', 'admin', 'mod', 'user')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS invites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                created_by INTEGER,
                role TEXT DEFAULT 'user' CHECK(role IN ('owner', 'manager', 'admin', 'mod', 'user')),
                max_uses INTEGER DEFAULT 1,
                uses_count INTEGER DEFAULT 0,
                used INTEGER DEFAULT 0,
                used_by INTEGER,
                expires_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                used_at DATETIME,
                FOREIGN KEY (created_by) REFERENCES users(id),
                FOREIGN KEY (used_by) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                bio TEXT,
                avatar_url TEXT,
                theme TEXT DEFAULT 'default',
                custom_css TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                url TEXT NOT NULL,
                icon TEXT,
                clicks INTEGER DEFAULT 0,
                position INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS social_links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                platform TEXT NOT NULL,
                url TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                link_id INTEGER,
                event_type TEXT,
                ip_address TEXT,
                user_agent TEXT,
                referrer TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (link_id) REFERENCES links(id)
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
}

initializeDatabase().catch(console.error);

// ---------- REST OF YOUR ROUTES ----------
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

const requireRole = (minRole) => {
    return (req, res, next) => {
        if (roleHierarchy[req.user.role] < roleHierarchy[minRole]) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

app.post('/api/auth/register', [
    body('username').isLength({ min: 1, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('inviteCode').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, inviteCode } = req.body;

    try {
        const invite = db.prepare('SELECT * FROM invites WHERE code = ? AND used = 0').get(inviteCode);
        
        if (!invite) {
            return res.status(400).json({ error: 'Invalid or used invite code' });
        }

        if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Invite code expired' });
        }

        if (invite.uses_count >= invite.max_uses) {
            db.prepare('UPDATE invites SET used = 1 WHERE id = ?').run(invite.id);
            return res.status(400).json({ error: 'Invite code fully used' });
        }

        const existingUser = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, email);
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const emailHash = crypto.createHash('sha256').update(email).digest('hex');

        const result = db.prepare(`
            INSERT INTO users (username, email, password_hash, display_name, role)
            VALUES (?, ?, ?, ?, ?)
        `).run(username, emailHash, passwordHash, username, invite.role);

        const newUsesCount = invite.uses_count + 1;
        const isFullyUsed = newUsesCount >= invite.max_uses ? 1 : 0;
        
        db.prepare(`
            UPDATE invites 
            SET uses_count = ?, used = ?, used_by = ?, used_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `).run(newUsesCount, isFullyUsed, result.lastInsertRowid, invite.id);

        db.prepare(`
            INSERT INTO profiles (user_id) VALUES (?)
        `).run(result.lastInsertRowid);

        res.json({ message: 'Registration successful', userId: result.lastInsertRowid });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                display_name: user.display_name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    const user = db.prepare('SELECT id, username, email, display_name, role, created_at FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
});

app.post('/api/invites/create', authenticateToken, [
    body('role').isIn(['owner', 'manager', 'admin', 'mod', 'user']),
    body('maxUses').optional().isInt({ min: 1 }),
    body('expiresAt').optional().isISO8601()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { role, maxUses = 1, expiresAt } = req.body;
    const userRole = req.user.role;

    const canCreate = {
        owner: ['owner', 'manager', 'admin', 'mod', 'user'],
        manager: ['admin', 'mod', 'user'],
        admin: ['mod', 'user'],
        mod: ['user']
    };

    if (!canCreate[userRole] || !canCreate[userRole].includes(role)) {
        return res.status(403).json({ error: 'Cannot create invite for this role' });
    }

    try {
        const code = crypto.randomBytes(4).toString('hex');
        
        const result = db.prepare(`
            INSERT INTO invites (code, created_by, role, max_uses, expires_at)
            VALUES (?, ?, ?, ?, ?)
        `).run(code, req.user.id, role, maxUses, expiresAt || null);

        res.json({ 
            message: 'Invite created successfully',
            invite: { id: result.lastInsertRowid, code, role, maxUses }
        });
    } catch (error) {
        console.error('Invite creation error:', error);
        res.status(500).json({ error: 'Failed to create invite' });
    }
});

app.get('/api/invites', authenticateToken, (req, res) => {
    const invites = db.prepare(`
        SELECT id, code, role, max_uses, uses_count, used, expires_at, created_at
        FROM invites
        WHERE created_by = ?
        ORDER BY created_at DESC
    `).all(req.user.id);

    res.json(invites);
});

app.delete('/api/invites/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    const invite = db.prepare('SELECT * FROM invites WHERE id = ? AND created_by = ?').get(id, req.user.id);
    if (!invite) {
        return res.status(404).json({ error: 'Invite not found' });
    }

    db.prepare('DELETE FROM invites WHERE id = ?').run(id);
    res.json({ message: 'Invite deleted successfully' });
});

app.get('/api/profile/:username', (req, res) => {
    const { username } = req.params;
    
    const user = db.prepare(`
        SELECT u.id, u.username, u.display_name, u.created_at, p.bio, p.avatar_url, p.theme
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.username = ?
    `).get(username);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const links = db.prepare(`
        SELECT id, title, url, icon, clicks, position
        FROM links
        WHERE user_id = ?
        ORDER BY position ASC
    `).all(user.id);

    const socialLinks = db.prepare(`
        SELECT platform, url
        FROM social_links
        WHERE user_id = ?
    `).all(user.id);

    res.json({ user, links, socialLinks });
});

app.put('/api/profile', authenticateToken, (req, res) => {
    const { bio, avatar_url, theme, custom_css } = req.body;

    try {
        db.prepare(`
            UPDATE profiles
            SET bio = ?, avatar_url = ?, theme = ?, custom_css = ?
            WHERE user_id = ?
        `).run(bio, avatar_url, theme, custom_css, req.user.id);

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

app.get('/api/links', authenticateToken, (req, res) => {
    const links = db.prepare('SELECT * FROM links WHERE user_id = ? ORDER BY position ASC').all(req.user.id);
    res.json(links);
});

app.post('/api/links', authenticateToken, [
    body('title').notEmpty(),
    body('url').isURL()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, url, icon, position } = req.body;

    try {
        const result = db.prepare(`
            INSERT INTO links (user_id, title, url, icon, position)
            VALUES (?, ?, ?, ?, ?)
        `).run(req.user.id, title, url, icon || null, position || 0);

        res.json({ message: 'Link created successfully', linkId: result.lastInsertRowid });
    } catch (error) {
        console.error('Link creation error:', error);
        res.status(500).json({ error: 'Failed to create link' });
    }
});

app.put('/api/links/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { title, url, icon, position } = req.body;

    const link = db.prepare('SELECT * FROM links WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!link) {
        return res.status(404).json({ error: 'Link not found' });
    }

    try {
        db.prepare(`
            UPDATE links
            SET title = ?, url = ?, icon = ?, position = ?
            WHERE id = ? AND user_id = ?
        `).run(title, url, icon, position, id, req.user.id);

        res.json({ message: 'Link updated successfully' });
    } catch (error) {
        console.error('Link update error:', error);
        res.status(500).json({ error: 'Failed to update link' });
    }
});

app.delete('/api/links/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    const link = db.prepare('SELECT * FROM links WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!link) {
        return res.status(404).json({ error: 'Link not found' });
    }

    db.prepare('DELETE FROM links WHERE id = ?').run(id);
    res.json({ message: 'Link deleted successfully' });
});

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

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`🌐 og.email is live!`);
});
