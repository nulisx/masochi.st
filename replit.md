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

### November 26, 2025 (Dashboard UI Rebuild)
1. **Complete Dashboard CSS Rebuild**: Updated `/static/css/dashboard-app.css` with purple theme matching alo.ne design system
   - CSS variables for consistent theming (--accent-color: #8b5cf6, --accent-hover: #7c3aed)
   - Glassmorphic effects and modern styling
   - Responsive grid layouts for stats, cards, and forms
2. **Dashboard HTML Rebuild** (`/dash/app.html`):
   - Changed keyboard shortcut from Cmd+K to Alt+K in search bar
   - Replaced circular user avatar with Bootstrap Icons person icon (bi-person)
   - All 9 Biolink tabs implemented: General, Background, Profile, Link, Badge, Layout, Effects, Embed, Config
   - Social modals with platform-specific input prefixes (e.g., discord.com/users/ for Discord)
   - Update modals for Latest Updates section with detailed changelog content
3. **Social Modal Implementation**:
   - Each social platform has: name, icon, color, prefix, placeholder, and optional title
   - Modal dynamically updates prefix and placeholder based on selected platform
   - 30 social platforms supported including Discord, Twitter, Instagram, TikTok, etc.
4. **Color Input Synchronization**: Color picker and text input stay synchronized
5. **Range Input Styling**: Range inputs update with visual progress tracking

### November 25, 2025 (Dashboard Rebuild with Local API)
1. **Complete Dashboard Rebuild**: Created new custom dashboard (`/dash/app.html`) that works with local API endpoints
   - The previous Vue.js dashboard was pre-compiled to use external API (`https://api.alo.ne`) which wasn't connected
   - New dashboard uses the local `/api/` endpoints for all functionality
2. **Dashboard Design**: Matches the design from Fix3-Fix10 images with:
   - Sidebar navigation with sections: Overview (Dashboard), Upgrades (Store), Services (Biolink, File Host, Email), Administration (Admin Panel, Mod Panel)
   - Modern dark theme with purple accents
   - Responsive layout with collapsible sidebar
3. **Admin Panel with Invite Code Management**: Built-in invite code management in the Admin Panel
   - Create invite codes with custom roles (User, Mod, Admin)
   - View all invite codes with status (Active, Used, Expired)
   - Delete invite codes
   - User management section for banning users
4. **Mod Panel with Invite Code Management**: Built-in invite code management for moderators
   - Create invite codes for new users
   - View own invite codes
   - Delete invite codes
5. **Dashboard Routes Updated**:
   - `/dash` now redirects to `/dashboard`
   - `/dashboard` serves the new custom dashboard
   - All dashboard links updated throughout the application
6. **New CSS**: Created `/static/css/dashboard-app.css` with complete styling for the new dashboard

### November 25, 2025 (Dashboard Authentication & Routing Fix)
1. **Fixed Dashboard Routing**: Authenticated users are now correctly redirected from HomeView (marketing page) to DashView (actual dashboard)
2. **Auth Check Bootstrap Script**: Added inline auth check in `dash-app/index.html` that:
   - Always checks `/api/auth/me` when sessionStorage.user is absent (handles new tabs/incognito)
   - Redirects authenticated users from public routes to `/dash/app#/dash` (dashboard)
   - Redirects unauthenticated users from protected routes to `/login`
   - Uses centralized `DASH_HOME` constant for consistent redirect targets
3. **Vue Router Routes**:
   - Public routes: `/`, `/register`, `/login`, `/loginselector`, `/tos`, `/privacy`
   - Protected routes: `/dash`, `/store`, `/mail`, `/email`, `/imap`, `/file`, `/bio`, `/bio-socials`, `/security`, `/admin`, `/mod`, `/resellers-portal`
4. **Note**: Vue.js app source code is pre-compiled; further Vue component changes require the original source code

### November 25, 2025 (Vue.js Dashboard Migration)
1. **Dashboard Route Update**: `/dash` now redirects to `/dash/app#/dash` to serve the Vue.js dashboard application
2. **Asset Path Fix**: Fixed Vue.js asset paths in `dash-app/index.html` to use `/dash/app/assets/` instead of `/dash/assets/`
3. **Invite Code Management Security**: Rewrote `/ic/index.html` to use proper session-based authentication instead of hardcoded password
   - Now checks authentication via `/api/auth/me` endpoint
   - Verifies user has admin/mod role before showing invite management UI
   - Features a modern grid layout with invite creation and listing
4. **Route Configuration**: Added explicit Express routes for Vue.js app serving and index.html handling

### November 25, 2025 (Dashboard Authentication Fix)
1. **Fixed Dashboard Login Redirect**: Resolved issue where users were redirected to old alo.ne landing page instead of modern Vue.js dashboard
2. **Branded Loading Screen**: 
   - Created `/dash/loading.html` with branded "Welcome [username] to Glowi.es" message
   - Shows privacy-focused tagline: "The privacy based luxury service"
   - Now redirects to `/dash/app#/dash` for the modern Vue.js dashboard
3. **New Authentication Flow**: 
   - Login → `/dash/loading.html` (branded loading screen) → `/dash/app#/dash` (Vue.js dashboard)
   - `/dash` route now redirects to `/dash/app#/dash` for proper Vue SPA routing
   - Added `/api/auth/me` endpoint to verify authentication via HttpOnly cookies
4. **Asset Path Fixes**:
   - Added `/assets/fonts` static route to serve custom fonts at correct path
   - Fonts (bold.woff2, regular.woff2) now served from both `/fonts/` and `/assets/fonts/`
5. **Security Improvements**:
   - Added `Secure` flag to all authentication cookies (login and logout)
   - Configured cookies with `HttpOnly; Secure; SameSite=Strict` attributes
   - Prevents cookie exposure over HTTP and mitigates CSRF attacks
6. **Registration Fix**:
   - Fixed error handling to properly display validation errors from express-validator
   - Frontend now correctly parses both single errors and validation error arrays
7. **Dashboard Features**:
   - Shows user information and role in navbar
   - Displays admin notice for owner/admin/manager roles
   - Role-based access to invite codes and admin panel
   - Links to biolink page, file storage, profile settings
8. **Default Owner Credentials** (from OWNER_SETUP.md):
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