# OG.Email API Fixes & Deployment Guide

## Summary of Changes

All requested API endpoints have been implemented and the Vercel deployment configuration has been fixed to prevent the `FUNCTION_INVOCATION_FAILED` errors.

### ✅ New API Endpoints Implemented

#### Token Management
- **POST `/api/token/exchange`** - Exchange/refresh authentication token

#### User Profile
- **GET `/api/:userId`** - Get public user profile with links

#### Images
- **GET `/api/images`** - Get all images for authenticated user
- **POST `/api/images/upload`** - Upload a new image
- **GET `/api/images/:imageId`** - Get specific image
- **DELETE `/api/images/:imageId`** - Delete an image

#### Connections
- **GET `/api/connections`** - Get all connections for authenticated user
- **POST `/api/connections`** - Create a new connection
- **GET `/api/connections/:connectionId`** - Get specific connection
- **PUT `/api/connections/:connectionId`** - Update a connection
- **DELETE `/api/connections/:connectionId`** - Delete a connection

#### Collectibles
- **GET `/api/:userId/collectibles`** - Get all collectibles for a user (public)
- **POST `/api/:userId/collectibles`** - Claim a new collectible (authenticated)
- **GET `/api/:userId/collectibles/:collectibleId`** - Get specific collectible
- **DELETE `/api/:userId/collectibles/:collectibleId`** - Delete a collectible

#### Invite Generation (ic.html)
- **GET `/ic`** - Invite code generation page
- **POST `/generate_invite`** - Generate invite code (owner role only)

### 🗄️ Database Updates

Created initialization script (`lib/init-db.js`) with all required tables:
- `users` - User accounts
- `invites` - Invite codes
- `profiles` - User profiles
- `links` - Bio links
- `social_links` - Social media links
- `images` - User uploaded images
- `connections` - Third-party connections
- `collectibles` - User collectibles
- `analytics` - Event tracking

To initialize the database locally, run:
```bash
node lib/init-db.js
```

### 🔧 Vercel Deployment Fixes

#### What Was Fixed:
1. **Database Configuration**: Updated `lib/db.js` to properly handle production vs development environments
   - Throws clear error if Supabase credentials are missing (prevents silent crashes)
   - Uses Supabase in production/Vercel environments
   - Uses SQLite locally for development

2. **Vercel Configuration**: Updated `vercel.json`
   - Increased lambda size to 50mb
   - Added routing for `/ic/` assets
   - Set NODE_ENV to production

3. **Module Imports**: Fixed circular dependency issues
   - Moved authentication middleware to `lib/middleware.js`
   - Updated all API imports to use proper ES module syntax with `.js` extensions

4. **Package Configuration**: Added `"type": "module"` to `package.json` for ES modules support

## 🚀 Required Vercel Environment Variables

To deploy successfully to Vercel, you **MUST** set these environment variables in your Vercel project settings:

### Required Variables:

1. **SUPABASE_URL**
   - Your Supabase project URL
   - Example: `https://xxxxx.supabase.co`
   - Get it from: Supabase Dashboard → Settings → API

2. **SUPABASE_KEY**
   - Your Supabase anon/service key
   - Get it from: Supabase Dashboard → Settings → API → anon public key (or service_role for backend)

3. **JWT_SECRET**
   - A secure random string for signing JWT tokens
   - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   - **CRITICAL**: Must be the same across all deployments to maintain user sessions

### How to Set Environment Variables in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - Name: `SUPABASE_URL`
   - Value: Your Supabase URL
   - Environment: Production, Preview, Development (select all)
   - Click **Save**
4. Repeat for `SUPABASE_KEY` and `JWT_SECRET`
5. Redeploy your application

## 📊 Supabase Database Setup

You need to create the same database schema in Supabase that exists locally. Run these SQL commands in Supabase SQL Editor:

```sql
-- Users table
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  custom_url TEXT UNIQUE,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invites table
CREATE TABLE invites (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  created_by BIGINT REFERENCES users(id),
  role TEXT DEFAULT 'user',
  max_uses INTEGER DEFAULT 1,
  uses_count INTEGER DEFAULT 0,
  used INTEGER DEFAULT 0,
  used_by BIGINT REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

-- Profiles table
CREATE TABLE profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  avatar_url TEXT,
  theme TEXT DEFAULT 'default',
  custom_css TEXT
);

-- Links table
CREATE TABLE links (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  clicks INTEGER DEFAULT 0,
  position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social Links table
CREATE TABLE social_links (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Images table
CREATE TABLE images (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connections table
CREATE TABLE connections (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  username TEXT,
  profile_url TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collectibles table
CREATE TABLE collectibles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  rarity TEXT,
  claimed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics table
CREATE TABLE analytics (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🧪 Testing Locally

The server is currently running on `http://0.0.0.0:5000`

To test the new endpoints:

1. Register a user at `/register`
2. Login at `/login`
3. Use the authentication cookie to access protected endpoints
4. Test APIs using tools like Postman or curl

## 📝 What You Need to Do Next

1. **Set up Supabase**:
   - Create a Supabase project if you haven't already
   - Run the SQL schema creation commands above
   - Copy your Supabase URL and Key

2. **Configure Vercel Environment Variables**:
   - Add `SUPABASE_URL`
   - Add `SUPABASE_KEY`
   - Add `JWT_SECRET`

3. **Deploy**:
   - Push your code to GitHub
   - Vercel will auto-deploy
   - Check deployment logs to verify no errors

4. **Verify**:
   - Test your live site at og.email
   - Try registering a user
   - Test API endpoints

## 🔒 Security Notes

- All API endpoints requiring authentication check for valid JWT tokens
- Passwords are hashed with bcrypt (12 rounds)
- JWT tokens expire after 7 days
- Role-based access control is implemented for invite generation
- Database credentials are never exposed in code

## 🐛 Troubleshooting

**Issue**: Vercel deployment still showing 500 errors
- **Solution**: Verify all environment variables are set correctly in Vercel

**Issue**: "FATAL: Missing SUPABASE_URL or SUPABASE_KEY"
- **Solution**: Add these environment variables to your Vercel project

**Issue**: Users getting logged out randomly in production
- **Solution**: Make sure JWT_SECRET is set in Vercel (not using random fallback)

**Issue**: Database queries failing
- **Solution**: Verify Supabase tables are created with the correct schema
