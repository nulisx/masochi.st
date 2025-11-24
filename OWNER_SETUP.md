# Owner Account Setup Guide

## Quick Start

To create the default owner account in your database, follow these steps:

### Option 1: Use the Seed Script (Recommended)

If your database allows connections from your environment:

```bash
RUN_SEED=true node lib/seed-owner.js
node scripts/backfill-profiles.js
git push  # Trigger Vercel redeploy
```

This will create the owner user and backfill profiles for all existing users.

### Option 2: Manual SQL (If Seeding Fails Due to Network Restrictions)

If you get "Access denied" or connection errors when running the seed script:

1. **Log into your database console** (e.g., via your hosting provider's web UI)
2. **Run the SQL migration** from `lib/migrate-owner-account.sql`:

```sql
-- Create owner user
INSERT INTO users (username, email, password_hash, display_name, role, created_at) 
VALUES ('r', 'b76388c2e3561f4630c12ec96a32e27db6d039c9c6279838e3d4fa6acafdab04', '$2b$12$WeU26wDKXzHTAnZk7eA10uaJYFTMlkt/TsHzb89R9RW/grK8eDQGy', 'r', 'owner', NOW());

-- Create owner profile
INSERT INTO profiles (user_id, bio, avatar_url, theme, created_at) 
VALUES (LAST_INSERT_ID(), 'Platform Owner', '', 'default', NOW());
```

3. **If `LAST_INSERT_ID()` doesn't work**, manually replace it with the user ID (usually `1`):

```sql
INSERT INTO profiles (user_id, bio, avatar_url, theme, created_at) 
VALUES (1, 'Platform Owner', '', 'default', NOW());
```

## Credentials

- **Username**: `r`
- **Email**: `yuriget@egirl.help`
- **Password**: `ACK071675$!`
- **Role**: `owner`

## After Setup

1. Verify the account was created by checking the `users` table:
   ```sql
   SELECT id, username, email, role FROM users WHERE username = 'r';
   ```

2. Push to GitHub to trigger Vercel redeploy:
   ```bash
   git push
   ```

3. Test the login:
   - Go to `https://glowi.es/login` (or your domain)
   - Enter username: `r`
   - Enter password: `ACK071675$!`

4. Once logged in as owner, test invite generation at `/ic`

## Troubleshooting

- **"Username already exists"** — The owner account is already created. You can login directly.
- **"Authentication required" on `/ic`** — You need to be logged in as the owner (`r`) to generate invites.
- **Database connection errors** — Ensure `MariaDB.env` (or your new MySQL `.env`) has correct credentials.
