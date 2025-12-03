# Vercel Deployment Guide for Glowi.es

## Fix "Resource provisioning failed" Error

Your deployment is failing because Vercel has a **Supabase integration** enabled, but this project uses **Neon PostgreSQL**. You need to remove the Supabase integration and set up environment variables manually.

---

## Step 1: Remove Supabase Integration from Vercel

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Click on your **masochist** project
3. Go to **Settings** → **Integrations**
4. Find **Supabase** in the list
5. Click **Configure** → **Remove Integration** or **Uninstall**
6. Confirm the removal

---

## Step 2: Set Up Environment Variables in Vercel

Go to **Settings** → **Environment Variables** and add these:

| Variable Name | Value | Environments |
|--------------|-------|--------------|
| `DATABASE_URL` | `postgresql://neondb_owner:YOUR_PASSWORD@ep-morning-shadow-adw0byzy-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require` | Production, Preview, Development |
| `JWT_SECRET` | (Generate a new 64-character random string) | Production, Preview, Development |
| `SESSION_SECRET` | (Generate a new 64-character random string) | Production, Preview, Development |
| `FRONTEND_URL` | `https://og.email` or your domain | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

### Generate Secure Secrets
You can generate secure random strings using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 3: Redeploy

After removing Supabase and setting up environment variables:

1. Go to **Deployments** tab
2. Click the **...** menu on the latest failed deployment
3. Click **Redeploy**

---

## GitHub Sync Setup (from Replit)

### Option A: Connect Existing GitHub Repo
1. In Replit, click the **Git** icon in the left sidebar (branch icon)
2. Click **Connect to GitHub**
3. Authorize Replit to access your GitHub
4. Select your existing `masochist` repository
5. Pull any existing changes, then push your code

### Option B: Create New GitHub Repo
1. In Replit, click the **Git** icon in the left sidebar
2. Click **Create a Git Repo**
3. Click **Connect to GitHub**
4. Select "Create new repository"
5. Name it and click **Create**
6. Push your code

Once connected:
- Any changes you push from Replit to GitHub will automatically trigger a Vercel deployment
- Use the Git pane in Replit to commit and push changes

---

## Troubleshooting

### "Error: An error occurred. Please try again."
This login error usually means:
- Database connection failed (check `DATABASE_URL`)
- JWT secret not set (check `JWT_SECRET`)
- Missing environment variables

### Build Logs Not Loading
This happens when integrations fail before the build starts. Remove any failing integrations first.

### Connection Pooling (for Neon)
If you get connection timeouts, make sure your DATABASE_URL uses the pooler endpoint:
```
postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```
(Note the `-pooler` in the hostname)

---

## Files Changed

- `vercel.json` - Added deployment configuration for Node.js server
- `.gitignore` - Updated to exclude sensitive files

---

## Important Notes

1. **Never commit secrets** - Use environment variables in Vercel dashboard
2. **Use pooler connection** - Neon's pooler handles serverless connections better
3. **Redeploy after changes** - Environment variable changes require a new deployment
