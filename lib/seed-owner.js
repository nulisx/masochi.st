import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { hashEmail } from './crypto-utils.js';

const db = new Database('database.db');

const DEFAULT_OWNER = {
  username: 'r',
  password: 'ACK071675$!',
  email: 'asmo@drugsellers.com',
  role: 'owner'
};

async function seedOwnerAccount() {
  try {
    const existingOwner = db.prepare('SELECT * FROM users WHERE username = ?').get(DEFAULT_OWNER.username);
    
    if (existingOwner) {
      console.log('✅ Default owner account already exists');
      return;
    }

    const passwordHash = await bcrypt.hash(DEFAULT_OWNER.password, 12);
    const emailHash = hashEmail(DEFAULT_OWNER.email);

    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, display_name, role)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      DEFAULT_OWNER.username,
      emailHash,
      passwordHash,
      DEFAULT_OWNER.username,
      DEFAULT_OWNER.role
    );

    const userId = result.lastInsertRowid;

    db.prepare(`
      INSERT INTO profiles (user_id, bio, avatar_url, theme)
      VALUES (?, ?, ?, ?)
    `).run(userId, 'Platform Owner', '', 'default');

    console.log('✅ Default owner account created successfully');
    console.log(`   Username: ${DEFAULT_OWNER.username}`);
    console.log(`   Email: ${DEFAULT_OWNER.email}`);
    console.log(`   Password: ${DEFAULT_OWNER.password}`);
    console.log(`   Role: ${DEFAULT_OWNER.role}`);

  } catch (err) {
    console.error('❌ Failed to create owner account:', err);
    throw err;
  } finally {
    db.close();
  }
}

seedOwnerAccount();
