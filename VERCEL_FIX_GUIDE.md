# How to Fix Vercel Deployment Errors

## The Problem

Your Vercel deployment is **building successfully** but crashes at **runtime** with:
```
500: INTERNAL_SERVER_ERROR
Code: FUNCTION_INVOCATION_FAILED
```

This happens because the serverless function crashes when someone visits your site. The root cause is **missing environment variables**.

## The Solution

The deployment needs Supabase database credentials to work in production. Follow these steps:

### Step 1: Set Up Supabase Database

1. Go to [Supabase](https://supabase.com) and create a project (if you haven't already)
2. Go to your Supabase project's SQL Editor
3. Copy the contents of `supabase-setup.sql` from this repository
4. Paste it into the SQL Editor and click "Run"
5. This will create all tables and the default owner account

### Step 2: Get Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **service_role key** (NOT the anon key - click "Reveal" to see it)

### Step 3: Generate JWT Secret

Run this command in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output - this is your JWT secret.

### Step 4: Configure Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these three variables:

   **Variable 1:**
   - Name: `SUPABASE_URL`
   - Value: Your Supabase Project URL
   - Environment: ✅ Production, ✅ Preview, ✅ Development

   **Variable 2:**
   - Name: `SUPABASE_KEY`
   - Value: Your Supabase service_role key
   - Environment: ✅ Production, ✅ Preview, ✅ Development

   **Variable 3:**
   - Name: `JWT_SECRET`
   - Value: The hex string you generated
   - Environment: ✅ Production, ✅ Preview, ✅ Development

4. Click **Save** for each variable

### Step 5: Redeploy

1. Go to **Deployments** tab in Vercel
2. Click the **...** menu on your latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

### Step 6: Test Your Site

1. Visit your deployed site (drugs.rip)
2. Go to `/login`
3. Login with the default owner account:
   - Username: `r`
   - Password: `ACK071675$!`
4. You should be logged in successfully!

## Security Features

✅ **Passwords**: Bcrypt hashed (12 rounds) - impossible to reverse-engineer  
✅ **Emails**: SHA-256 hashed - prevents email harvesting if database is breached  
✅ **JWT Tokens**: Signed with secret key - prevents token forgery  
✅ **Default Owner Account**: Created securely with hashed credentials  

## Why This Works

- **Development (Replit)**: Uses SQLite database file (`database.db`)
- **Production (Vercel)**: Uses Supabase PostgreSQL database
- The code automatically detects the environment and switches databases
- Without Supabase credentials, production has no database → crashes
- With credentials set, production works perfectly!

## Troubleshooting

**Still getting 500 errors after setting variables?**
1. Make sure you ran the `supabase-setup.sql` script in Supabase
2. Verify you're using the `service_role` key, NOT the `anon` key
3. Check that all 3 environment variables are set
4. Try redeploying (not just waiting for auto-deploy)

**Can't login with default owner account?**
1. Verify the SQL script ran successfully in Supabase
2. Check the `users` table in Supabase - you should see username `r`
3. Make sure you're using the exact password: `ACK071675$!`

**How to check if environment variables are set?**
1. Go to Vercel → Settings → Environment Variables
2. You should see 3 variables listed
3. If they're missing, add them and redeploy

## What Changed?

1. **Added email hashing**: Emails are now SHA-256 hashed in database for security
2. **Updated database layer**: Properly handles Supabase in production vs SQLite in development
3. **Added default owner seeding**: Automatic creation of owner account with secure hashed credentials
4. **Fixed error handling**: Clear error messages when database isn't configured
5. **Created setup scripts**: Easy database initialization for both environments

## Default Owner Credentials

**Username**: `r`  
**Password**: `ACK071675$!`  
**Email**: `asmo@drugsellers.com`  
**Role**: `owner`

(All credentials are securely hashed in the database)
