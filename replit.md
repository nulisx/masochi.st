# [Glowi.es](https://glowi.es) Bio Link Platform Service

## Overview
Glowi.es is an exclusive, invite-only bio link platform, similar to Linktree, enabling users to create custom profile pages. These pages can feature social media links, digital collectibles, and various integrations. The platform is designed with a comprehensive, hierarchical role-based access control system to manage user privileges. The business vision is to provide a minimalist, highly customizable, and secure bio link service that stands out through its refined design and robust feature set, targeting users who value aesthetics and controlled access.

## User Preferences
I want iterative development.
I want to be asked before you make major changes.

## System Architecture

### UI/UX Decisions
The platform features an ultra-minimal, clean design inspired by elyria.cc with advanced CSS animations and effects. The color scheme uses a pure black (#000000) background with white text and vibrant green (#10b981) accents. Typography is set at a 13px base font size, emphasizing a "less is more" philosophy with maximum whitespace and professional animations. The hero badge features advanced particle animations, glowing effects, and gradient rotations. Subtle hover states, glassmorphic effects, and a grain texture overlay are used for depth.

### Technical Implementations
- **Frontend**: Static HTML/CSS/JavaScript.
- **Backend**: Node.js with Express.
- **Database**: Neon PostgreSQL with pg driver and connection pooling.
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

## Recent Changes

### November 25, 2025 (Vue.js Dashboard Migration)
1. **Dashboard Route Update**: `/dash` now redirects to `/dash/app` to serve the Vue.js dashboard application
2. **Asset Path Fix**: Fixed Vue.js asset paths in `dash-app/index.html` to use `/dash/app/assets/` instead of `/dash/assets/`
3. **Invite Code Management Security**: Rewrote `/ic/index.html` to use proper session-based authentication instead of hardcoded password
   - Now checks authentication via `/api/auth/me` endpoint
   - Verifies user has admin/mod role before showing invite management UI
   - Features a modern grid layout with invite creation and listing
4. **Route Configuration**: Added explicit Express routes for Vue.js app serving and index.html handling
5. **Note**: Vue.js app source code is pre-compiled; further Vue component changes require the original source code

### November 25, 2025 (Dashboard Authentication Fix)
1. **Fixed Dashboard Login Loop**: Resolved issue where users were redirected to old alo.ne login page instead of dashboard
2. **Branded Loading Screen**: 
   - Created `/dash/loading.html` with branded "Welcome [username] to Glowi.es" message
   - Shows privacy-focused tagline: "The privacy based luxury service"
   - Automatically fetches user info and redirects to dashboard after 1.5 seconds
3. **New Authentication Flow**: 
   - Login → `/dash/loading.html` (branded loading screen) → `/dash` (actual dashboard)
   - `/dash` now serves the actual dashboard at `dashboard.html`
   - Added `/api/auth/me` endpoint to verify authentication via HttpOnly cookies
   - Moved old Vue SPA dashboard to `/dash/app` for potential future use
4. **Security Improvements**:
   - Added `Secure` flag to all authentication cookies (login and logout)
   - Configured cookies with `HttpOnly; Secure; SameSite=Strict` attributes
   - Prevents cookie exposure over HTTP and mitigates CSRF attacks
5. **Registration Fix**:
   - Fixed error handling to properly display validation errors from express-validator
   - Frontend now correctly parses both single errors and validation error arrays
6. **Dashboard Features**:
   - Shows user information and role in navbar
   - Displays admin notice for owner/admin/manager roles
   - Role-based access to invite codes and admin panel
   - Links to biolink page, file storage, profile settings
7. **Default Owner Credentials** (from OWNER_SETUP.md):
   - Username: `r`
   - Password: `ACK071675$!`
   - Email: `yuriget@egirl.help`
   - Role: `owner`

### November 25, 2025 (Replit Migration - Earlier)
1. **Replit PostgreSQL Database**: Created Replit PostgreSQL database for development environment
2. **Environment File Rename**: Renamed MariaDB.env/MariaDB.json to PostgreSQL.env/PostgreSQL.json to reflect current database technology
3. **Seed Script Update**: Rewrote lib/seed-owner.js to use PostgreSQL with pg driver instead of MySQL
4. **Environment Cleanup**: Removed unused MARIADB_* and SUPABASE_* environment variables from configuration files
5. **Documentation Update**: Updated OWNER_SETUP.md to reflect PostgreSQL usage and Replit database setup
6. **File Cleanup**: Deleted obsolete mariadb-setup.sql file
7. **Owner Account**: Verified owner account exists (username: r, email: yuriget@egirl.help)

### November 25, 2025 (Earlier)
1. **Neon Database Migration**: Migrated to Neon PostgreSQL for production-grade managed database service
2. **Database Library Cleanup**: Removed all MySQL/MariaDB code and dependencies, now exclusively using PostgreSQL
3. **Vercel Deployment Fix**: Fixed api/index.cjs to use async handler pattern and guarded app.listen() to prevent execution in serverless environment
4. **Code Quality**: Removed all comments from codebase for clean, production-ready code

### November 24, 2025
1. **PostgreSQL Migration**: Migrated from external MariaDB to PostgreSQL for improved reliability
2. **Database Library Rewrite**: Completely rewrote lib/db.js to use PostgreSQL with pg driver
   - Fixed allQuery to support operators (>=, <=, >, <) and full-table reads with null column/value
   - Fixed getQuery to throw errors instead of silently returning null
   - Improved customQuery parameter replacement for PostgreSQL
3. **Owner Account Setup**: Created owner account (username: r, email: yuriget@egirl.help, password: ACK071675$!)
4. **Default Invite Codes**: Created GLOWI-ADMIN-001 (admin role, 100 uses) and GLOWI-USER-001 (user role, 1000 uses)
5. **Invite Page Fix**: Removed redundant Cookie header from invite code generator page
6. **Authentication Enhancement**: Verified authentication works with both username and email login via email hash lookup
7. **Code Quality**: All application code is comment-free for cleaner, production-ready codebase
8. **Environment**: DATABASE_URL configured for PostgreSQL connection, JWT_SECRET properly secured

### November 17, 2025
1. **Vercel Speed Insights Integration**: Added @vercel/speed-insights package and integrated speed insights script across all main HTML pages (index, login, register, dashboard) for real-time performance monitoring
2. **Vercel Configuration Updates**: 
   - Added dashfiles assets routing to serve compiled Vue.js dashboard components
   - Added explicit Cache-Control headers (no-cache) to prevent caching issues
   - Added dashboard routes (/dash, /dash/*) for proper routing
   - Added node_modules/@vercel/speed-insights routing for speed insights assets
3. **Dashboard Routing Fix**: Fixed critical bug where server.js routes were pointing to `/dashboard/` folder instead of actual `/dash/` folder, causing 404 errors on all dashboard pages
4. **IC Page Route Fix**: Corrected /ic route to point to ic/ic.html instead of ic/index.html
5. **Vue.js Dashboard Integration**: Created dash/index-new.html that integrates compiled Vue.js assets from dashfiles folder for modernized dashboard experience

### November 6, 2025
1. **Vercel Routing Fix**: Added explicit routes for /about, /pricing, /privacy, and /ic pages to prevent 404 errors on production
2. **IC Page Styling**: Created static/css/ic.css matching the site's glassmorphic design patterns with animations

## External Dependencies
- **Database**:
    - **Neon PostgreSQL**: Production database with pg driver for connection pooling and async/await support
- **Deployment**:
    - **Vercel**: Platform for production deployment with Speed Insights integration
- **Monitoring**:
    - **Vercel Speed Insights**: Real-time performance monitoring from actual users