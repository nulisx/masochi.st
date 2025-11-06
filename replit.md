# Drugs.RIP Bio Link Platform

## Overview
Drugs.RIP is an exclusive, invite-only bio link platform, similar to Linktree, enabling users to create custom profile pages. These pages can feature social media links, digital collectibles, and various integrations. The platform is designed with a comprehensive, hierarchical role-based access control system to manage user privileges. The business vision is to provide a minimalist, highly customizable, and secure bio link service that stands out through its refined design and robust feature set, targeting users who value aesthetics and controlled access.

## User Preferences
I want iterative development.
I want to be asked before you make major changes.

## System Architecture

### UI/UX Decisions
The platform features an ultra-minimal, clean design inspired by elyria.cc with advanced CSS animations and effects. The color scheme uses a pure black (#000000) background with white text and vibrant green (#10b981) accents. Typography is set at a 13px base font size, emphasizing a "less is more" philosophy with maximum whitespace and professional animations. The hero badge features advanced particle animations, glowing effects, and gradient rotations. Subtle hover states, glassmorphic effects, and a grain texture overlay are used for depth.

### Technical Implementations
- **Frontend**: Static HTML/CSS/JavaScript.
- **Backend**: Node.js with Express.
- **Database**: MariaDB (mysql2 driver with connection pooling).
- **Authentication**: JWT-based with bcrypt (12 rounds) for password hashing and SHA-256 for email hashing.
- **Server Configuration**: Runs on port 5000 and host 0.0.0.0 for Replit compatibility.

### Feature Specifications
- **Role-Based Access Control**:
    - **Roles**: Owner, Manager, Admin, Mod, User (hierarchical privileges).
    - **Dashboard Permissions**: Owners have full access; Managers access Manager/Admin panels; Admins access Admin panel; Mods access Mod panel; Users have no admin panel access.
    - **Invite Code Creation**: Owners can create invites for all roles; Managers for Admin, Mod, User; Admins for Mod, User; Mods for User only.
- **Registration System**:
    - Invite codes are mandatory for all registrations.
    - Username requirements: 1-20 alphanumeric characters and underscores.
    - Support for multi-use and time-expiring invite codes.
    - Username serves as the default display name.
    - Recovery codes (32-character hex) are generated during registration for password reset.
- **Password Reset System**:
    - Self-service password reset using email and recovery code.
    - Two-step verification flow: verify recovery code → set new password.
    - Recovery codes are bcrypt-hashed and one-time use (consumed after verification).
    - Rate limiting: 5 attempts per 15 minutes per email/IP combination.
    - Reset tokens expire after 10 minutes.
    - Normalized error messages prevent email enumeration.
- **API Endpoints**:
    - **Authentication**: Register, Login, Logout, Token Exchange, Password Reset (Verify & Complete).
    - **Invite Management**: Create, List, Update, Delete invite codes.
    - **User Profile**: Get public profile, Get/Update current user's profile.
    - **Links**: Get, Create, Update, Delete user links.
    - **Images**: Get, Upload, Delete user images.
    - **Connections**: Get, Create, Update, Delete user connections.
    - **Collectibles**: Get user collectibles, Claim, Delete specific collectibles.

### System Design Choices
- **Database Schema**:
    - `users`: Stores user credentials, role, and custom URL.
    - `invites`: Manages invite codes, their creator, assigned role, usage limits, and expiration.
    - `profiles`: Stores user bio, avatar, theme, and custom CSS.
    - `links`: Stores user's custom links with click tracking.
    - `social_links`: Stores external social media links.
    - `analytics`: Tracks link clicks and user events.
    - `recovery_codes`: Stores bcrypt-hashed recovery codes with attempt tracking and consumption timestamps.
    - `password_resets`: Manages password reset tokens with expiration and usage tracking.
- **Security**: JWT authentication (7-day expiration), bcrypt password hashing (12 rounds), role-based access control, invite code validation, multi-use invite tracking, session management, input validation via express-validator, rate limiting for password resets, one-time recovery codes, and normalized error responses to prevent enumeration attacks.

## Recent Changes (November 6, 2025)
1. **Database Migration**: Migrated from SQLite/Supabase to MariaDB using mysql2 with connection pooling
2. **Vercel Routing Fix**: Added explicit routes for /about, /pricing, /privacy, and /ic pages to prevent 404 errors on production
3. **IC Page Styling**: Created static/css/ic.css matching the site's glassmorphic design patterns with animations
4. **Environment Variables**: Now using MARIADB_HOST, MARIADB_USER, MARIADB_PASSWORD, MARIADB_DATABASE, MARIADB_PORT for database connection

## External Dependencies
- **Database**:
    - **MariaDB**: Primary database with mysql2 driver for connection pooling and async/await support
- **Deployment**:
    - **Vercel**: Platform for production deployment.