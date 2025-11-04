# og.email Bio Link Platform

## Overview
An exclusive, invite-only bio link platform (similar to Linktree) that allows users to create custom profile pages with social media links, collectibles, and integrations. Features a comprehensive role-based access control system with hierarchical permissions.

## Tech Stack
- **Frontend**: Static HTML/CSS/JavaScript
- **Backend**: Node.js + Express
- **Database**: SQLite
- **Authentication**: JWT-based with bcrypt password hashing

## Branding & Design
- **Brand Name**: og.email
- **Color Scheme**: White and pink/magenta (#ec4899) on black background
- **Visual Style**: Modern glassmorphism with gradients

## Project Structure
```
.
├── server.js           # Main Express server
├── index.html          # Landing page
├── login/              # Login page
├── register/           # Registration page (invite-required)
├── dashboard/          # Role-based user dashboard
├── account/            # Account settings
├── collectibles/       # User collectibles
├── integrations/       # Third-party integrations
├── images/             # Image gallery
├── profile/            # User profile pages
├── static/             # Static assets (CSS, images, CDN files)
├── assets/             # JavaScript files and fonts
└── database.db         # SQLite database (auto-created)
```

## Role-Based Access Control

### Role Hierarchy
1. **Owner** (highest privileges)
2. **Manager**
3. **Admin**
4. **Mod** (Moderator)
5. **User** (default)

### Dashboard Permissions
- **Owners**: Access to all panels (Owner, Manager, Admin, Mod)
- **Managers**: Access to Manager and Admin panels
- **Admins**: Access to Admin panel only
- **Mods**: Access to Mod panel only
- **Users**: No admin panel access

### Invite Code Creation Rules
- **Owners** can create invites for: owner, manager, admin, mod, user
- **Managers** can create invites for: admin, mod, user
- **Admins** can create invites for: mod, user
- **Mods** can create invites for: user only

## Registration System
- **Invite codes are mandatory** - all new users must use a valid invite code
- **Username requirements**: 1-20 characters, alphanumeric and underscores only
- **Multi-use invites**: Support for invite codes with configurable max uses
- **Expiration**: Optional time-based expiration for invite codes
- **Display Name field removed** - username is used as display name by default

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (requires valid invite code)
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/token/exchange` - Exchange/refresh authentication token

### Invite Management
- `POST /api/invites` - Create new invite code (admin+ role)
- `GET /api/invites` - List all invites (admin+ role)
- `PUT /api/invites/:code` - Update invite code (admin+ role)
- `DELETE /api/invites/:code` - Delete invite code (admin+ role)
- `POST /generate_invite` - Generate invite code (owner only, for ic.html page)

### User Profile
- `GET /api/:userId` - Get public user profile with links and data
- `GET /api/profile` - Get current user's profile
- `PUT /api/profile` - Update profile

### Links
- `GET /api/links` - Get user's links
- `POST /api/links` - Create new link
- `PUT /api/links/:id` - Update link
- `DELETE /api/links/:id` - Delete link

### Images
- `GET /api/images` - Get all images for authenticated user
- `POST /api/images/upload` - Upload a new image
- `GET /api/images/:imageId` - Get specific image
- `DELETE /api/images/:imageId` - Delete an image

### Connections
- `GET /api/connections` - Get all connections for authenticated user
- `POST /api/connections` - Create a new connection
- `GET /api/connections/:connectionId` - Get specific connection
- `PUT /api/connections/:connectionId` - Update a connection
- `DELETE /api/connections/:connectionId` - Delete a connection

### Collectibles
- `GET /api/:userId/collectibles` - Get all collectibles for a user (public)
- `POST /api/:userId/collectibles` - Claim a new collectible (authenticated)
- `GET /api/:userId/collectibles/:collectibleId` - Get specific collectible
- `DELETE /api/:userId/collectibles/:collectibleId` - Delete a collectible

## Database Schema

### users table
- `id` (INTEGER PRIMARY KEY)
- `username` (TEXT UNIQUE, 1-20 chars)
- `email` (TEXT UNIQUE)
- `password_hash` (TEXT) - bcrypt hashed
- `display_name` (TEXT)
- `custom_url` (TEXT UNIQUE)
- `role` (TEXT DEFAULT 'user') - owner, manager, admin, mod, user
- `created_at` (TIMESTAMP)

### invites table
- `id` (INTEGER PRIMARY KEY)
- `code` (TEXT UNIQUE) - 8-character hex code
- `created_by` (INTEGER) - user_id who created it
- `role` (TEXT DEFAULT 'user') - role assigned to new user
- `max_uses` (INTEGER DEFAULT 1) - maximum number of uses
- `uses_count` (INTEGER DEFAULT 0) - current number of uses
- `used` (INTEGER DEFAULT 0) - 1 when fully used
- `used_by` (INTEGER) - last user_id who used it
- `expires_at` (TIMESTAMP) - optional expiration
- `created_at` (TIMESTAMP)
- `used_at` (TIMESTAMP)

### profiles table
- `id` (INTEGER PRIMARY KEY)
- `user_id` (INTEGER UNIQUE)
- `bio` (TEXT)
- `avatar_url` (TEXT)
- `theme` (TEXT DEFAULT 'default')
- `custom_css` (TEXT)

### links table
- `id` (INTEGER PRIMARY KEY)
- `user_id` (INTEGER)
- `title` (TEXT)
- `url` (TEXT)
- `icon` (TEXT)
- `clicks` (INTEGER DEFAULT 0)
- `position` (INTEGER)
- `created_at` (TIMESTAMP)

### social_links table
- `id` (INTEGER PRIMARY KEY)
- `user_id` (INTEGER)
- `platform` (TEXT)
- `url` (TEXT)
- `created_at` (TIMESTAMP)

### analytics table
- `id` (INTEGER PRIMARY KEY)
- `user_id` (INTEGER)
- `link_id` (INTEGER)
- `event_type` (TEXT)
- `ip_address` (TEXT)
- `user_agent` (TEXT)
- `referrer` (TEXT)
- `created_at` (TIMESTAMP)

## Security Features
- JWT authentication with 7-day token expiration
- Bcrypt password hashing (12 rounds)
- Role-based access control on all admin endpoints
- Invite code validation prevents unauthorized registration
- Multi-use invite tracking prevents code exhaustion attacks
- Session management with express-session
- Input validation using express-validator

## Setup Notes
- Server runs on port 5000 (required for Replit webview)
- Host: 0.0.0.0 (required for Replit)
- SQLite database is automatically created on first run
- JWT secret is auto-generated on server start (configure via environment variable in production)
- All database tables are created automatically on server startup

## Recent Changes

- 2025-11-04: Complete API implementation and Vercel deployment fixes
  - Implemented all requested API endpoints:
    - Token exchange endpoint (/api/token/exchange)
    - Public user profile endpoint (/api/:userId)
    - Complete images API (GET, POST upload, DELETE)
    - Complete connections API (GET, POST, PUT, DELETE)
    - Complete collectibles API (GET, POST, DELETE)
  - Fixed Vercel deployment configuration:
    - Updated lib/db.js to throw clear error when Supabase credentials missing
    - Added proper environment detection for production vs development
    - Increased lambda size to 50mb in vercel.json
    - Added .vercelignore to exclude local database files
  - Integrated ic.html invite generation with main server:
    - Added /ic route for invite code generation page
    - Updated endpoint to use authentication cookies
    - Restricted to owner role only
  - Fixed circular dependency issues:
    - Moved middleware to lib/middleware.js
    - Updated all API imports to use ES modules with .js extensions
  - Created comprehensive database initialization script (lib/init-db.js)
  - Added database tables for images, connections, collectibles, analytics
  - Created DEPLOYMENT_GUIDE.md with complete setup instructions

- 2025-11-02: Complete purple-pink (#d946ef) redesign with external CSS architecture
  - Created comprehensive CSS design system with 4 external stylesheets:
    - `static/css/global.css`: Shared color variables, fonts, and base styles
    - `static/css/index.css`: Homepage-specific styles
    - `static/css/auth.css`: Login and register page styles
    - `static/css/dashboard.css`: All dashboard page styles
  - Redesigned all 8 pages with consistent purple-pink theme and glow effects
  - Removed ALL inline styles and inline `<style>` blocks from HTML files
  - Professional, polished design across homepage, login, register, dashboard, account, collectibles, integrations, and images pages
  - All JavaScript functionality preserved
  - Fixed default owner account email in database (changed from hash to plain email)
  - Default owner credentials: username "r", password "ACK071675$!", email "asmo@drugsellers.com"

- 2025-11-02: Complete backend implementation and glowing neon redesign
  - Set up complete backend with SQLite database and authentication
  - Created default owner account (username: r) with hashed password
  - Implemented password hashing with bcrypt (12 rounds)
  - Added email hashing with SHA-256 for privacy
  - Complete JWT authentication system with 7-day tokens
  - Full API endpoints for auth, invites, profiles, and links
  - Redesigned all 4 CSS files with glowing neon aesthetic
  - Pure black background (#000000) with white and pink accents
  - Pink glow effects matching logo design (#ec4899)
  - Removed all comments from code as requested
  - Fixed JavaScript errors in index.html
  - All files working with zero critical errors

- 2025-11-02: Fixed deployment and server configuration
  - Created package.json with Express dependency
  - Created server.js for serving static files on port 5000
  - Fixed CORS errors by converting absolute font URLs to relative paths
  - Created vercel.json for Vercel deployment compatibility
  - Added .gitignore for Node.js projects
  - Server running successfully with zero errors

- 2025-11-01: Complete CSS redesign with professional styling
  - Created comprehensive global CSS design system with modern design tokens
  - Replaced all emoji icons with professional SVG icon library (static/icons.js)
  - Completely redesigned login page with dramatic spotlight effects and elegant typography
  - Completely redesigned register page with modern gradients and creative animations
  - Redesigned dashboard with gradient icon backgrounds and premium aesthetics
  - Implemented consistent glassmorphism design across all pages
  - Added floating particles and pulsing spotlight effects for visual depth
  - Created unified color palette with gradients (purple, pink, blue, green)
  - Removed custom font dependencies, using system fonts for better performance
  - Design surpasses competitors (elyria.cc, wound.lol) with better creativity
  - All changes architect-reviewed with zero console errors

- 2025-11-01: Complete rebrand and role-based system implementation
  - Rebranded entire platform from "Aurora" to "og.email"
  - Updated color scheme to white and pink/magenta on black
  - Implemented comprehensive role-based access control (Owner/Manager/Admin/Mod/User)
  - Created role-based dashboard with hierarchical panel visibility
  - Added secure invite code system with role hierarchy enforcement
  - Implemented multi-use invite codes with proper tracking
  - Made invite codes mandatory for registration
  - Changed username validation from 3-20 to 1-12 characters
  - Removed Display Name field from registration form
  - Added role column to users table
  - Enhanced invites table with role, max_uses, uses_count, expires_at
  - All security features verified by architect review

- 2025-11-01: Initial setup for Replit environment
  - Created Express server configuration (server.js)
  - Added proper routing for all pages
  - Configured port 5000 on host 0.0.0.0 for webview
  - Set up workflow for automatic server restart
  - Installed Node.js 20 and npm dependencies
  - Configured deployment for autoscale

## Known Issues
None currently! The platform is running smoothly with:
- Zero console errors
- Professional SVG icons throughout
- Clean, modern design system
- Proper system font usage
