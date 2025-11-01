const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const crypto = require('crypto');
const cors = require('cors');

const app = express();

function getOrCreateSecret(name, filePath) {
    if (process.env[name]) {
        return process.env[name];
    }

    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8').trim();
    }

    const secret = crypto.randomBytes(64).toString('hex');
    fs.writeFileSync(filePath, secret, 'utf8');
    console.warn(`⚠️  ${name} not found in environment. Generated and saved to ${filePath}`);
    console.warn(`   For production, set ${name} environment variable.`);
    return secret;
}

const JWT_SECRET = getOrCreateSecret('JWT_SECRET', '.jwt_secret');
const SESSION_SECRET = getOrCreateSecret('SESSION_SECRET', '.session_secret');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    store: new SQLiteStore({ db: 'sessions.db' }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) cb(null, true);
        else cb(new Error('Only images allowed'));
    }
});

const db = new sqlite3.Database('database.db', (err) => {
    if (err) {
        console.error("Could not connect to database:", err);
    } else {
        console.log("Connected to SQLite database");
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT,
            bio TEXT,
            avatar_url TEXT,
            theme TEXT DEFAULT 'aurora',
            custom_url TEXT UNIQUE,
            verified INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error("Error creating users table:", err);
            else console.log("Users table ready");
        });

        db.run(`CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT,
            description TEXT,
            background_style TEXT DEFAULT 'gradient',
            primary_color TEXT DEFAULT '#6366f1',
            secondary_color TEXT DEFAULT '#8b5cf6',
            layout TEXT DEFAULT 'modern',
            show_avatar INTEGER DEFAULT 1,
            show_bio INTEGER DEFAULT 1,
            analytics_enabled INTEGER DEFAULT 1,
            seo_title TEXT,
            seo_description TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`, (err) => {
            if (err) console.error("Error creating profiles table:", err);
            else console.log("Profiles table ready");
        });

        db.run(`CREATE TABLE IF NOT EXISTS links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            url TEXT NOT NULL,
            description TEXT,
            icon TEXT,
            position INTEGER DEFAULT 0,
            clicks INTEGER DEFAULT 0,
            active INTEGER DEFAULT 1,
            scheduled_start DATETIME,
            scheduled_end DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`, (err) => {
            if (err) console.error("Error creating links table:", err);
            else console.log("Links table ready");
        });

        db.run(`CREATE TABLE IF NOT EXISTS social_links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            platform TEXT NOT NULL,
            username TEXT NOT NULL,
            url TEXT NOT NULL,
            display_order INTEGER DEFAULT 0,
            visible INTEGER DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`, (err) => {
            if (err) console.error("Error creating social_links table:", err);
            else console.log("Social links table ready");
        });

        db.run(`CREATE TABLE IF NOT EXISTS analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            link_id INTEGER,
            event_type TEXT NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            referrer TEXT,
            country TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (link_id) REFERENCES links (id) ON DELETE SET NULL
        )`, (err) => {
            if (err) console.error("Error creating analytics table:", err);
            else console.log("Analytics table ready");
        });

        db.run(`CREATE TABLE IF NOT EXISTS invites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            created_by INTEGER,
            used_by INTEGER,
            used INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            used_at DATETIME,
            FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
            FOREIGN KEY (used_by) REFERENCES users (id) ON DELETE SET NULL
        )`, (err) => {
            if (err) console.error("Error creating invites table:", err);
            else console.log("Invites table ready");
        });
    });
}

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.session.token;
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

app.post('/api/auth/register', [
    body('username').isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('inviteCode').optional().isString()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, inviteCode, displayName } = req.body;

    try {
        if (inviteCode) {
            const invite = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM invites WHERE code = ? AND used = 0', [inviteCode], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!invite) {
                return res.status(400).json({ error: 'Invalid or used invite code' });
            }
        }

        const existingUser = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const customUrl = username.toLowerCase();

        db.run(
            'INSERT INTO users (username, email, password_hash, display_name, custom_url) VALUES (?, ?, ?, ?, ?)',
            [username, email, passwordHash, displayName || username, customUrl],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to create user' });
                }

                const userId = this.lastID;

                db.run('INSERT INTO profiles (user_id) VALUES (?)', [userId]);

                if (inviteCode) {
                    db.run('UPDATE invites SET used = 1, used_by = ?, used_at = CURRENT_TIMESTAMP WHERE code = ?',
                        [userId, inviteCode]);
                }

                const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
                req.session.token = token;
                req.session.userId = userId;

                res.json({
                    success: true,
                    token,
                    user: { id: userId, username, email, customUrl }
                });
            }
        );
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

app.post('/api/auth/login', [
    body('identifier').notEmpty(),
    body('password').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, password } = req.body;

    try {
        const user = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM users WHERE username = ? OR email = ?',
                [identifier, identifier],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        req.session.token = token;
        req.session.userId = user.id;

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.display_name,
                customUrl: user.custom_url
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.json({ success: true });
    });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
    db.get(
        'SELECT id, username, email, display_name, bio, avatar_url, theme, custom_url, verified FROM users WHERE id = ?',
        [req.userId],
        (err, user) => {
            if (err || !user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ user });
        }
    );
});

app.get('/api/profile/:username', (req, res) => {
    const { username } = req.params;

    db.get(
        `SELECT u.*, p.* FROM users u 
         LEFT JOIN profiles p ON u.id = p.user_id 
         WHERE u.username = ? OR u.custom_url = ?`,
        [username, username],
        (err, profile) => {
            if (err || !profile) {
                return res.status(404).json({ error: 'Profile not found' });
            }

            db.all(
                'SELECT * FROM links WHERE user_id = ? AND active = 1 ORDER BY position ASC',
                [profile.id],
                (err, links) => {
                    db.all(
                        'SELECT * FROM social_links WHERE user_id = ? AND visible = 1 ORDER BY display_order ASC',
                        [profile.id],
                        (err, socials) => {
                            res.json({
                                profile: {
                                    username: profile.username,
                                    displayName: profile.display_name,
                                    bio: profile.bio,
                                    avatarUrl: profile.avatar_url,
                                    theme: profile.theme,
                                    customUrl: profile.custom_url,
                                    backgroundStyle: profile.background_style,
                                    primaryColor: profile.primary_color,
                                    secondaryColor: profile.secondary_color,
                                    layout: profile.layout
                                },
                                links: links || [],
                                socials: socials || []
                            });
                        }
                    );
                }
            );
        }
    );
});

app.put('/api/profile', authMiddleware, [
    body('displayName').optional().isLength({ min: 1, max: 50 }),
    body('bio').optional().isLength({ max: 500 }),
    body('theme').optional().isIn(['aurora', 'cosmic', 'ocean', 'sunset', 'forest', 'neon']),
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { displayName, bio, theme, primaryColor, secondaryColor } = req.body;

    db.run(
        'UPDATE users SET display_name = COALESCE(?, display_name), bio = COALESCE(?, bio), theme = COALESCE(?, theme), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [displayName, bio, theme, req.userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to update profile' });
            }

            if (primaryColor || secondaryColor) {
                db.run(
                    'UPDATE profiles SET primary_color = COALESCE(?, primary_color), secondary_color = COALESCE(?, secondary_color) WHERE user_id = ?',
                    [primaryColor, secondaryColor, req.userId]
                );
            }

            res.json({ success: true });
        }
    );
});

app.post('/api/links', authMiddleware, [
    body('title').isLength({ min: 1, max: 100 }),
    body('url').isURL(),
    body('description').optional().isLength({ max: 200 })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, url, description, icon } = req.body;

    db.get('SELECT COUNT(*) as count FROM links WHERE user_id = ?', [req.userId], (err, row) => {
        const position = row ? row.count : 0;

        db.run(
            'INSERT INTO links (user_id, title, url, description, icon, position) VALUES (?, ?, ?, ?, ?, ?)',
            [req.userId, title, url, description, icon, position],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to create link' });
                }
                res.json({ success: true, linkId: this.lastID });
            }
        );
    });
});

app.get('/api/links', authMiddleware, (req, res) => {
    db.all(
        'SELECT * FROM links WHERE user_id = ? ORDER BY position ASC',
        [req.userId],
        (err, links) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch links' });
            }
            res.json({ links });
        }
    );
});

app.put('/api/links/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const { title, url, description, icon, active } = req.body;

    db.run(
        'UPDATE links SET title = COALESCE(?, title), url = COALESCE(?, url), description = COALESCE(?, description), icon = COALESCE(?, icon), active = COALESCE(?, active) WHERE id = ? AND user_id = ?',
        [title, url, description, icon, active, id, req.userId],
        function(err) {
            if (err || this.changes === 0) {
                return res.status(404).json({ error: 'Link not found or unauthorized' });
            }
            res.json({ success: true });
        }
    );
});

app.delete('/api/links/:id', authMiddleware, (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM links WHERE id = ? AND user_id = ?', [id, req.userId], function(err) {
        if (err || this.changes === 0) {
            return res.status(404).json({ error: 'Link not found or unauthorized' });
        }
        res.json({ success: true });
    });
});

app.post('/api/track/:linkId', (req, res) => {
    const { linkId } = req.params;
    const ip = req.ip;
    const userAgent = req.get('user-agent');
    const referrer = req.get('referrer');

    db.get('SELECT user_id FROM links WHERE id = ?', [linkId], (err, link) => {
        if (!link) return res.status(404).json({ error: 'Link not found' });

        db.run('UPDATE links SET clicks = clicks + 1 WHERE id = ?', [linkId]);

        db.run(
            'INSERT INTO analytics (user_id, link_id, event_type, ip_address, user_agent, referrer) VALUES (?, ?, ?, ?, ?, ?)',
            [link.user_id, linkId, 'click', ip, userAgent, referrer]
        );

        res.json({ success: true });
    });
});

app.post('/api/admin/generate-invite', authMiddleware, (req, res) => {
    const inviteCode = crypto.randomBytes(4).toString('hex');
    db.run(
        'INSERT INTO invites (code, created_by) VALUES (?, ?)',
        [inviteCode, req.userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to generate invite code' });
            }
            res.json({ code: inviteCode });
        }
    );
});

app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

app.get('/:username', (req, res) => {
    db.get(
        'SELECT id FROM users WHERE username = ? OR custom_url = ?',
        [req.params.username, req.params.username],
        (err, user) => {
            if (user) {
                res.sendFile(path.join(__dirname, 'profile', 'index.html'));
            } else {
                res.status(404).sendFile(path.join(__dirname, '404.html'));
            }
        }
    );
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`🔐 JWT Secret: ${JWT_SECRET.substring(0, 16)}...`);
});
