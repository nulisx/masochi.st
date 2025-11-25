# Vercel Environment Variables Setup & Debug Guide

## 🔍 Verify Environment Variables in Vercel

1. **Go to your Vercel project**: https://vercel.com/dashboard
2. **Navigate to Settings → Environment Variables**
3. **Add these variables** (set for Production, Preview, and Development):

### Required MariaDB/Railway Variables

```
MARIADB_HOST = containers-us-west-123.railway.app
MARIADB_PORT = 57849
MARIADB_USER = root
MARIADB_PASSWORD = ydlqKYLNMRMFdBPISKwbDEsBPyqxhQQH
MARIADB_DATABASE = railway
```

### JWT & Session Secrets

```
JWT_SECRET = 30828993a2e7957071f6686b9900af1861d8838068d7cbe07b47ab428f9e605ea62c34b7faafaaea285756ee919916937fdc72af9f7de20b4da67e9418cd3fb4
SESSION_SECRET = 1/9h3ywmZMWxwtBnDCA6cEFLlEwodcd3An5NSx4lBd2V16xL34z9vm8/30Uf+r8es1B/d0VXAmPlThGPRO/hjA==
FRONTEND_URL = https://glowi.es
```

## ⚠️ Important: Do NOT Set DATABASE_URL

If you have a `DATABASE_URL` environment variable set from a previous deployment, **delete it**. The new code will skip invalid DATABASE_URL entries and fall back to MariaDB env vars, but it's cleaner to remove it entirely.

## 🔧 Deployment Process

1. **Add all env vars listed above to Vercel** (Settings → Environment Variables)
   - Ensure each variable is set for **Production**, **Preview**, and **Development**
   - Click "Save" for each one

2. **Seed the database** (if you haven't already):
   - Go to your Railway MySQL console
   - Run the SQL from `lib/migrate-owner-account.sql`:
     ```sql
     INSERT INTO users (username, email, password_hash, display_name, role, created_at) 
     VALUES ('r', 'b76388c2e3561f4630c12ec96a32e27db6d039c9c6279838e3d4fa6acafdab04', '$2b$12$WeU26wDKXzHTAnZk7eA10uaJYFTMlkt/TsHzb89R9RW/grK8eDQGy', 'r', 'owner', NOW());
     
     INSERT INTO profiles (user_id, bio, avatar_url, theme, created_at) 
     VALUES (LAST_INSERT_ID(), 'Platform Owner', '', 'default', NOW());
     ```

3. **Trigger a redeploy**:
   - Go to Deployments tab
   - Click "Redeploy" on the latest deployment
   - Or just make a small commit and push

## 📊 Debug Vercel Logs

After deploying, check the runtime logs to verify DB connection:

1. **Go to Vercel project → Logs tab**
2. **Look for these success messages**:
   - `✅ MySQL/MariaDB connection pool initialized successfully`
   - This means the database variables were correctly loaded

3. **If you see errors**, look for:
   - `🔍 Initializing database connection...`
   - `DATABASE_URL present:` (should be `false` if you deleted it)
   - `MARIADB_HOST present:` (should be `true`)
   - `MARIADB_USER present:` (should be `true`)

## ✅ Test Login Flow

Once deployed:

1. **Go to https://glowi.es/login** (or your domain)
2. **Enter credentials**:
   - Username: `r`
   - Password: `ACK071675$!`
3. **Expected result**: Login succeeds, redirects to dashboard

## ❌ Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| "Login failed" | DB connection failed | Check that all MARIADB_* env vars are set in Vercel |
| "Invalid URL" in logs | DATABASE_URL is set to an invalid value | Delete DATABASE_URL from Vercel env vars |
| "ETIMEDOUT" on login | Railway DB host unreachable from Vercel | Check Railway DB is online; whitelist Vercel IPs if needed |
| "Authentication required" on `/ic` | User is not logged in as owner | Login with username `r` first |

## 🚀 Next Steps

- After confirming login works, test invite generation at `/ic`
- Test registration with an invite code at `/register`
- Verify the full user flow works end-to-end
