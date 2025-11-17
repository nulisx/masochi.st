-- Comprehensive Database Migration for Glowi.es Platform
-- Adds: Default owner account, File hosting, Analytics, and Email service tables

-- ============================================================================
-- FILE HOSTING TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS files (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  password_hash TEXT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  is_private BOOLEAN DEFAULT FALSE,
  download_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  bandwidth_used BIGINT DEFAULT 0,
  expires_at TIMESTAMP NULL,
  virus_scanned BOOLEAN DEFAULT FALSE,
  virus_scan_result VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_expires_at ON files(expires_at);
CREATE INDEX idx_files_created_at ON files(created_at);

-- ============================================================================
-- ANALYTICS TABLES (Enhanced)
-- ============================================================================

CREATE TABLE IF NOT EXISTS page_visits (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NULL,
  visitor_id VARCHAR(255),
  page_url TEXT NOT NULL,
  referrer TEXT,
  ip_address VARCHAR(45),
  country VARCHAR(100),
  country_code VARCHAR(10),
  city VARCHAR(100),
  region VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  user_agent TEXT,
  device_type VARCHAR(50),
  device_brand VARCHAR(100),
  device_model VARCHAR(100),
  browser VARCHAR(100),
  browser_version VARCHAR(50),
  os VARCHAR(100),
  os_version VARCHAR(50),
  screen_resolution VARCHAR(20),
  viewport_size VARCHAR(20),
  language VARCHAR(10),
  timezone VARCHAR(50),
  session_duration INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS link_clicks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  link_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  visitor_id VARCHAR(255),
  ip_address VARCHAR(45),
  country VARCHAR(100),
  country_code VARCHAR(10),
  city VARCHAR(100),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  referrer TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS analytics_summary (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  date DATE NOT NULL,
  total_visits INT DEFAULT 0,
  unique_visits INT DEFAULT 0,
  total_clicks INT DEFAULT 0,
  unique_clicks INT DEFAULT 0,
  top_country VARCHAR(100),
  top_device_type VARCHAR(50),
  top_browser VARCHAR(100),
  top_referrer TEXT,
  avg_session_duration INT DEFAULT 0,
  bounce_rate DECIMAL(5, 2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_date (user_id, date)
);

CREATE INDEX idx_visits_user_id ON page_visits(user_id);
CREATE INDEX idx_visits_created_at ON page_visits(created_at);
CREATE INDEX idx_visits_country ON page_visits(country_code);
CREATE INDEX idx_clicks_link_id ON link_clicks(link_id);
CREATE INDEX idx_clicks_user_id ON link_clicks(user_id);
CREATE INDEX idx_clicks_created_at ON link_clicks(created_at);
CREATE INDEX idx_summary_user_date ON analytics_summary(user_id, date);

-- ============================================================================
-- EMAIL SERVICE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_accounts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  email_address VARCHAR(255) UNIQUE NOT NULL,
  domain VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT DEFAULT 2147483648,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS email_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  account_id BIGINT NOT NULL,
  message_id VARCHAR(255) UNIQUE NOT NULL,
  from_address VARCHAR(255) NOT NULL,
  to_address TEXT NOT NULL,
  cc_address TEXT,
  bcc_address TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  attachments JSON,
  message_size INT,
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  folder VARCHAR(50) DEFAULT 'inbox',
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES email_accounts(id) ON DELETE CASCADE
);

CREATE INDEX idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX idx_email_messages_account_id ON email_messages(account_id);
CREATE INDEX idx_email_messages_received_at ON email_messages(received_at);
CREATE INDEX idx_email_messages_folder ON email_messages(folder);

-- ============================================================================
-- UPDATE USERS TABLE FOR OPTIONAL EMAIL
-- ============================================================================

ALTER TABLE users MODIFY email VARCHAR(255) NULL;

-- ============================================================================
-- DEFAULT OWNER ACCOUNT (username: r, email: qq@fbi.one, password: ACK071675$!)
-- ============================================================================

-- Insert default owner account
INSERT IGNORE INTO users (username, email, password_hash, display_name, role)
VALUES (
  'r',
  'qq@fbi.one',
  '$2b$12$DEFAULTHASHREPLACETHISWITHACTUAL',
  'r',
  'owner'
);

-- Create profile for owner
INSERT IGNORE INTO profiles (user_id, bio, avatar_url, theme)
SELECT id, 'Platform Owner', '', 'default'
FROM users
WHERE username = 'r'
LIMIT 1;

-- ============================================================================
-- COMPLETED
-- ============================================================================
