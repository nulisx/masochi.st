-- Drugs.RIP Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor to set up the production database

-- ============================================
-- TABLES
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS invites (
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
CREATE TABLE IF NOT EXISTS profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  avatar_url TEXT,
  theme TEXT DEFAULT 'default',
  custom_css TEXT
);

-- Links table
CREATE TABLE IF NOT EXISTS links (
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
CREATE TABLE IF NOT EXISTS social_links (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Images table
CREATE TABLE IF NOT EXISTS images (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connections table
CREATE TABLE IF NOT EXISTS connections (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  username TEXT,
  profile_url TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collectibles table
CREATE TABLE IF NOT EXISTS collectibles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  rarity TEXT,
  claimed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES (for performance)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_collectibles_user_id ON collectibles(user_id);

-- ============================================
-- DEFAULT OWNER ACCOUNT
-- ============================================
-- NOTE: Email is SHA-256 hashed, Password is bcrypt hashed
-- Original credentials:
--   Username: r
--   Email: asmo@drugsellers.com
--   Password: ACK071675$!
--   Role: owner

INSERT INTO users (username, email, password_hash, display_name, role)
VALUES (
  'r',
  'a9bf23d4a2b48e5051f8f15fd3d701429a55e3167a393630b09fa9ff45a7a796',
  '$2b$12$/NInxgbAx80TewPHr8L8oOzs0xU2VMXGXs/.Z8xbBeiyHm.CK3xOy',
  'r',
  'owner'
) ON CONFLICT (username) DO NOTHING;

-- Create profile for owner
INSERT INTO profiles (user_id, bio, avatar_url, theme)
SELECT id, 'Platform Owner', '', 'default'
FROM users
WHERE username = 'r'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- SECURITY POLICIES (Supabase Row Level Security)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collectibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Users: Service role can do everything (for backend API)
CREATE POLICY "Service role full access" ON users
  FOR ALL
  USING (auth.role() = 'service_role');

-- Profiles: Public can read, users can update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Links: Public can read, users can manage their own
CREATE POLICY "Public links are viewable by everyone" ON links
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own links" ON links
  FOR ALL
  USING (auth.uid()::text = user_id::text);

-- Service role policies for other tables (backend manages these)
CREATE POLICY "Service role full access invites" ON invites
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access images" ON images
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access connections" ON connections
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access collectibles" ON collectibles
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access analytics" ON analytics
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Default owner account has been created with:
--   Username: r
--   Email: asmo@drugsellers.com (hashed as: a9bf23d4a2b48e5051f8f15fd3d701429a55e3167a393630b09fa9ff45a7a796)
--   Password: ACK071675$! (bcrypt hashed)
--   Role: owner
--
-- Next steps:
-- 1. Set environment variables in Vercel:
--    - SUPABASE_URL: Your Supabase project URL
--    - SUPABASE_KEY: Your Supabase service_role key (NOT anon key)
--    - JWT_SECRET: Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
-- 2. Deploy to Vercel - the deployment will now work!
