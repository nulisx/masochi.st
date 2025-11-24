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
- **Database**: Replit PostgreSQL (Neon-backed) with pg driver and connection pooling.
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

### November 24, 2025
1. **PostgreSQL Migration**: Migrated from external MariaDB to Replit's built-in PostgreSQL (Neon-backed) for improved reliability and Replit integration
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
    - **Replit PostgreSQL**: Primary database (Neon-backed) with pg driver for connection pooling and async/await support
- **Deployment**:
    - **Vercel**: Platform for production deployment with Speed Insights integration
- **Monitoring**:
    - **Vercel Speed Insights**: Real-time performance monitoring from actual users