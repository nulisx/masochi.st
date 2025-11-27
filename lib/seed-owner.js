import bcrypt from 'bcrypt';
import pg from 'pg';
import { hashEmail } from './crypto-utils.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });
dotenv.config({ path: './PostgreSQL.env' });

const DEFAULT_OWNER = {
  username: 'r',
  password: 'ACK071675$!',
  email: 'qq@fbi.one',
  role: 'owner'
};

if (process.env.RUN_SEED !== 'true') {
  console.log('Skipping owner seed: set RUN_SEED=true to enable.');
  process.exit(0);
}

async function seedOwnerAccount() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');

    const existingOwner = await client.query(
      'SELECT * FROM users WHERE username = $1',
      [DEFAULT_OWNER.username]
    );
    
    if (existingOwner.rows.length > 0) {
      console.log('✅ Default owner account already exists');
      return;
    }

    const passwordHash = await bcrypt.hash(DEFAULT_OWNER.password, 12);
    const emailHash = hashEmail(DEFAULT_OWNER.email);

    const result = await client.query(
      'INSERT INTO users (username, email, password_hash, display_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [
        DEFAULT_OWNER.username,
        emailHash,
        passwordHash,
        DEFAULT_OWNER.username,
        DEFAULT_OWNER.role
      ]
    );

    const userId = result.rows[0].id;

    await client.query(
      'INSERT INTO profiles (user_id, bio, avatar_url, theme) VALUES ($1, $2, $3, $4)',
      [userId, 'Platform Owner', '', 'default']
    );

    console.log('✅ Default owner account created successfully');
    console.log(`   Username: ${DEFAULT_OWNER.username}`);
    console.log(`   Email: ${DEFAULT_OWNER.email}`);
    console.log(`   Password: ${DEFAULT_OWNER.password}`);
    console.log(`   Role: ${DEFAULT_OWNER.role}`);

  } catch (err) {
    console.error('❌ Failed to create owner account:', err);
    throw err;
  } finally {
    await client.end();
  }
}

seedOwnerAccount()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
