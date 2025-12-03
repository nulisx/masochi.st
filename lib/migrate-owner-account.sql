-- Migration: Create Default Owner Account
-- 
-- This script creates the default owner user account and profile.
-- Username: r
-- Email: qq@fbi.one
-- Password: ACK071675$!
--
-- Run this in your database console if the seed script cannot run
-- (e.g., due to network restrictions).

-- Step 1: Insert the owner user
-- (The password hash and email hash are pre-computed)
INSERT INTO users (username, email, password_hash, display_name, role, created_at) 
VALUES ('r', 'b76388c2e3561f4630c12ec96a32e27db6d039c9c6279838e3d4fa6acafdab04', '$2b$12$WeU26wDKXzHTAnZk7eA10uaJYFTMlkt/TsHzb89R9RW/grK8eDQGy', 'r', 'owner', NOW());

-- Step 2: Insert the owner profile (using the ID from Step 1)
-- If your database supports LAST_INSERT_ID():
INSERT INTO profiles (user_id, bio, avatar_url, theme, created_at) 
VALUES (LAST_INSERT_ID(), 'Platform Owner', '', 'default', NOW());

-- NOTE: If LAST_INSERT_ID() does not work in your DB console,
-- manually set the user_id to 1 (or the actual ID from Step 1):
-- INSERT INTO profiles (user_id, bio, avatar_url, theme, created_at) 
-- VALUES (1, 'Platform Owner', '', 'default', NOW());
