#!/usr/bin/env node
import { allRows, getQuery, runQuery } from '../lib/db.js';

async function backfill() {
  console.log('Starting profile backfill...');
  try {
    const users = await allRows('users');
    let created = 0;
    for (const u of users) {
      const existing = await getQuery('profiles', 'user_id', u.id);
      if (!existing) {
        await runQuery('profiles', {
          user_id: u.id,
          bio: '',
          avatar_url: '',
          theme: 'default'
        });
        created += 1;
        console.log(`Created profile for user id=${u.id} (${u.username || u.email || 'unknown'})`);
      }
    }
    console.log(`Backfill completed. Profiles created: ${created}`);
    process.exit(0);
  } catch (err) {
    console.error('Backfill error:', err);
    process.exit(2);
  }
}

backfill();
