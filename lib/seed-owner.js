import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import { hashEmail } from './crypto-utils.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });
dotenv.config({ path: './MariaDB.env' });

const DEFAULT_OWNER = {
  username: 'r',
  password: 'ACK071675$!',
  email: 'yuriget@egirl.help',
  role: 'owner'
};

if (process.env.RUN_SEED !== 'true') {
  console.log('Skipping owner seed: set RUN_SEED=true to enable.');
  process.exit(0);
}

async function seedOwnerAccount() {
  let connection;
  try {
    const host = process.env.MARIADB_HOST || process.env.MYSQL_HOST || process.env.DB_HOST;
    const user = process.env.MARIADB_USER || process.env.MYSQL_USER || process.env.DB_USER;
    const password = process.env.MARIADB_PASSWORD || process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD;
    const database = process.env.MARIADB_DATABASE || process.env.MYSQL_DATABASE || process.env.DB_DATABASE;
    const port = parseInt(process.env.MARIADB_PORT || process.env.MYSQL_PORT || process.env.DB_PORT || 3306);

    if (!host || !user || !database) {
      throw new Error('Missing required MariaDB/MySQL environment variables (MARIADB_HOST, MARIADB_USER, MARIADB_DATABASE)');
    }

    connection = await mysql.createConnection({
      host,
      user,
      password,
      database,
      port,
      charset: 'utf8mb4'
    });

    console.log('✅ Connected to database');

    const [existingOwner] = await connection.execute(
      'SELECT * FROM users WHERE username = ?',
      [DEFAULT_OWNER.username]
    );
    
    if (existingOwner && existingOwner.length > 0) {
      console.log('✅ Default owner account already exists');
      return;
    }

    const passwordHash = await bcrypt.hash(DEFAULT_OWNER.password, 12);
    const emailHash = hashEmail(DEFAULT_OWNER.email);

    const [result] = await connection.execute(
      'INSERT INTO users (username, email, password_hash, display_name, role) VALUES (?, ?, ?, ?, ?)',
      [
        DEFAULT_OWNER.username,
        emailHash,
        passwordHash,
        DEFAULT_OWNER.username,
        DEFAULT_OWNER.role
      ]
    );

    const userId = result.insertId;

    await connection.execute(
      'INSERT INTO profiles (user_id, bio, avatar_url, theme) VALUES (?, ?, ?, ?)',
      [userId, 'Platform Owner', '', 'default']
    );

    console.log('✅ Default owner account created successfully');
    console.log(`   Username: ${DEFAULT_OWNER.username}`);
    console.log(`   Email: ${DEFAULT_OWNER.email}`);
    console.log(`   Password: ${DEFAULT_OWNER.password}`);
    console.log(`   Role: ${DEFAULT_OWNER.role}`);

  } catch (err) {
    console.error('❌ Failed to create owner account:', err);
  } finally {
    if (connection) {
      try { await connection.end(); } catch (e) { }
    }
  }
}

seedOwnerAccount();
