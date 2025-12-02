CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(255),
  custom_url VARCHAR(255) UNIQUE,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id BIGINT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invites (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(255) UNIQUE NOT NULL,
  created_by BIGINT,
  role VARCHAR(50) DEFAULT 'user',
  max_uses INT DEFAULT 1,
  uses_count INT DEFAULT 0,
  used INT DEFAULT 0,
  used_by BIGINT,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (used_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  theme VARCHAR(50) DEFAULT 'default',
  custom_css TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS links (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  icon VARCHAR(255),
  clicks INT DEFAULT 0,
  position INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS social_links (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  platform VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS images (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  size INT,
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS connections (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  platform VARCHAR(50) NOT NULL,
  username VARCHAR(255),
  profile_url TEXT,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS collectibles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  rarity VARCHAR(50),
  claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS analytics (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recovery_codes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  code_hash TEXT NOT NULL,
  consumed_at TIMESTAMP NULL,
  attempts INT DEFAULT 0,
  last_attempt_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_resets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS files (
  id BIGSERIAL PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS page_visits (
  id BIGSERIAL PRIMARY KEY,
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
  id BIGSERIAL PRIMARY KEY,
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
  id BIGSERIAL PRIMARY KEY,
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS email_accounts (
  id BIGSERIAL PRIMARY KEY,
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
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL,
  message_id VARCHAR(255) UNIQUE NOT NULL,
  from_address VARCHAR(255) NOT NULL,
  to_address TEXT NOT NULL,
  cc_address TEXT,
  bcc_address TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  attachments JSONB,
  message_size INT,
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  folder VARCHAR(50) DEFAULT 'inbox',
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES email_accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_collectibles_user_id ON collectibles(user_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_expires_at ON files(expires_at);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_visits_user_id ON page_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON page_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_visits_country ON page_visits(country_code);
CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON link_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_clicks_user_id ON link_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON link_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_summary_user_date ON analytics_summary(user_id, date);
CREATE INDEX IF NOT EXISTS idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_account_id ON email_messages(account_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_received_at ON email_messages(received_at);
CREATE INDEX IF NOT EXISTS idx_email_messages_folder ON email_messages(folder);

CREATE TABLE IF NOT EXISTS biolinks_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  layout VARCHAR(50) DEFAULT 'modern',
  bg_video TEXT,
  bg_image TEXT,
  bg_effects VARCHAR(50) DEFAULT 'none',
  bg_effects_color VARCHAR(7) DEFAULT '#1a1a1c',
  bg_effects_opacity INT DEFAULT 100,
  profile_text_color VARCHAR(7) DEFAULT '#dededd',
  profile_separator_color VARCHAR(7) DEFAULT '#000000',
  profile_avatar_url TEXT,
  profile_avatar_border BOOLEAN DEFAULT TRUE,
  profile_avatar_border_width INT DEFAULT 2,
  profile_avatar_border_color VARCHAR(7) DEFAULT '#000000',
  profile_view_count BOOLEAN DEFAULT TRUE,
  profile_view_count_icon_color VARCHAR(7) DEFAULT '#f6f5f4',
  profile_bg_color VARCHAR(7) DEFAULT '#0a0a0a',
  profile_bg_opacity INT DEFAULT 100,
  link_border BOOLEAN DEFAULT TRUE,
  link_border_width INT DEFAULT 0,
  link_border_color VARCHAR(7) DEFAULT '#000000',
  link_border_radius INT DEFAULT 50,
  link_text_color VARCHAR(7) DEFAULT '#6e3e3e',
  link_text_hover_color VARCHAR(7) DEFAULT '#000000',
  link_icon_color VARCHAR(7) DEFAULT '#f6f5f4',
  link_icon_hover_color VARCHAR(7) DEFAULT '#000000',
  link_icon_opacity INT DEFAULT 100,
  link_icon_bg_color VARCHAR(7) DEFAULT '#1e1e1e',
  link_icon_hover_bg_color VARCHAR(7) DEFAULT '#1e1e1e',
  link_icon_hover_bg_opacity INT DEFAULT 100,
  link_icon_glow BOOLEAN DEFAULT TRUE,
  link_icon_glow_size INT DEFAULT 0,
  link_icon_glow_color VARCHAR(7) DEFAULT '#000000',
  link_icon_hover_glow_size INT DEFAULT 0,
  link_icon_hover_glow_color VARCHAR(7) DEFAULT '#000000',
  link_icon_hover_zoom_animation BOOLEAN DEFAULT FALSE,
  link_icon_hover_animation_type VARCHAR(50) DEFAULT 'none',
  badge_show_hide BOOLEAN DEFAULT TRUE,
  badge_border BOOLEAN DEFAULT TRUE,
  badge_border_width INT DEFAULT 0,
  badge_border_color VARCHAR(7) DEFAULT '#000000',
  badge_border_radius INT DEFAULT 50,
  badge_hover_border_color VARCHAR(7) DEFAULT '#000000',
  badge_hover_border_width INT DEFAULT 0,
  badge_hover_border_radius INT DEFAULT 50,
  badge_text_color VARCHAR(7) DEFAULT '#000000',
  badge_text_hover_color VARCHAR(7) DEFAULT '#000000',
  badge_icon_color VARCHAR(7) DEFAULT '#f6f5f4',
  badge_icon_hover_color VARCHAR(7) DEFAULT '#000000',
  badge_icon_opacity INT DEFAULT 100,
  badge_icon_background_color VARCHAR(7) DEFAULT '#1e1e1e',
  badge_icon_hover_background_color VARCHAR(7) DEFAULT '#1e1e1e',
  badge_icon_hover_bg_opacity INT DEFAULT 100,
  badge_icon_glow BOOLEAN DEFAULT TRUE,
  badge_icon_glow_size INT DEFAULT 0,
  badge_icon_glow_color VARCHAR(7) DEFAULT '#000000',
  badge_icon_hover_glow_size INT DEFAULT 0,
  badge_icon_hover_glow_color VARCHAR(7) DEFAULT '#000000',
  badge_icon_hover_zoom_animation BOOLEAN DEFAULT FALSE,
  badge_icon_hover_animation_type VARCHAR(50),
  effects_nickname_effects VARCHAR(50) DEFAULT 'none',
  effects_description_effects VARCHAR(50) DEFAULT 'none',
  effects_title_effects VARCHAR(50) DEFAULT 'none',
  effects_sparkles TEXT,
  effects_text_effects TEXT,
  effects_bg_color_click VARCHAR(7) DEFAULT '#0a0a0a',
  effects_bg_color_opacity INT DEFAULT 95,
  effects_username_glow BOOLEAN DEFAULT TRUE,
  effects_username_glow_size INT DEFAULT 0,
  effects_click_to_enter BOOLEAN DEFAULT FALSE,
  effects_click_to_enter_text TEXT,
  effects_click_to_enter_text_hover_color VARCHAR(7) DEFAULT '#000000',
  effects_click_to_enter_bg_color_opacity INT DEFAULT 95,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_biolinks_settings_user_id ON biolinks_settings(user_id);
