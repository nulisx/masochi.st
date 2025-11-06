import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { generateRecoveryCode } from './crypto-utils.js';

const db = new Database('database.db');

console.log('🔄 Generating recovery codes for existing users...');

try {
  const users = db.prepare('SELECT id, username FROM users').all();
  
  for (const user of users) {
    const existingCode = db.prepare('SELECT id FROM recovery_codes WHERE user_id = ?').get(user.id);
    
    if (!existingCode) {
      const recoveryCode = generateRecoveryCode();
      const codeHash = await bcrypt.hash(recoveryCode, 12);
      
      db.prepare('INSERT INTO recovery_codes (user_id, code_hash) VALUES (?, ?)').run(user.id, codeHash);
      
      console.log(`✅ Generated recovery code for user: ${user.username}`);
    } else {
      console.log(`ℹ️  User ${user.username} already has a recovery code`);
    }
  }
  
  console.log('✅ Migration completed successfully');
} catch (err) {
  console.error('❌ Migration failed:', err);
} finally {
  db.close();
}
