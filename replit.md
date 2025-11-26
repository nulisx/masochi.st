# Glowi.es Bio Link & File Hosting Platform

## Overview
Glowi.es is an exclusive, invite-only bio link platform combined with secure file hosting. Users can create custom profile pages with social media links and integrations, plus upload files with end-to-end encryption, password protection, and expiration dates. The platform emphasizes privacy, security, and a premium user experience.

## User Preferences
- Iterative development approach
- Ask before major changes
- Purple accent theme preference (previously green)

## System Architecture

### Dashboard Structure (NEW - November 2025)
The dashboard has been completely redesigned with a sexi.st-inspired design:
- **Location**: `/dashboard/index.html` (served at `/dash`)
- **Styling**: `/static/css/dashboard.css` (dark theme with purple accents)
- **JavaScript**: `/static/js/dashboard.js` (single-page app with dynamic page loading)

Dashboard Pages:
- Overview (Dashboard home with stats and quick access cards)
- Profile (Display name, bio, avatar management)
- Security (Password change, 2FA placeholder, privacy settings)
- Biolinks (Manage bio links with CRUD functionality)
- Files (E2EE file hosting with upload, password protection, expiration)
- Connections (Social account integrations)
- Settings (General preferences)
- Privacy (Data control settings)

### UI/UX Decisions
- Dark theme with purple accents (`#9333ea` primary, `#a855f7` secondary)
- Inter font family for clean typography
- Card-based layout with hover effects and purple glow
- Responsive sidebar navigation

### Technical Implementations
- **Frontend**: Static HTML/CSS/JavaScript with dynamic page loading
- **Backend**: Node.js with Express
- **Database**: Neon PostgreSQL with `pg` driver and connection pooling
- **Authentication**: JWT-based with bcrypt (12 rounds) for password hashing
- **File Storage**: E2E encrypted files stored locally with AES-256-GCM encryption
- **Server Configuration**: Runs on port 5000 and host 0.0.0.0

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration with invite code
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/reset/verify` - Verify recovery code
- `POST /api/auth/reset/complete` - Complete password reset

#### Profile & Links
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/avatar` - Upload avatar
- `GET /api/links` - Get user links
- `POST /api/links` - Create link
- `PUT /api/links/:id` - Update link
- `DELETE /api/links/:id` - Delete link

#### Biolink API (Public)
- `GET /api/biolink/:username` - Get public biolink data for user

#### Files (E2EE File Hosting)
- `GET /api/files` - List user files
- `POST /api/files/upload` - Upload file with optional password/expiration
- `GET /api/files/info/:code` - Get file info (public)
- `POST /api/files/download/:code` - Download file (with password if required)
- `DELETE /api/files/:code` - Delete file

#### Connections
- `GET /api/connections` - List connections
- `POST /api/connections` - Add connection
- `PUT /api/connections/:platform` - Update connection (supports both numeric ID and platform name)
- `DELETE /api/connections/:platform` - Remove connection (supports both numeric ID and platform name)

#### Updates (Site Updates)
- `GET /api/updates` - Get latest site updates
- `POST /api/updates` - Create update (admin only)
- `DELETE /api/updates/:id` - Delete update (admin only)

### Recent Changes (November 2025)
- Changed sidebar "Files" label to "Images" to match reference design
- Added username change functionality with duplicate checking via `/api/profile/username`
- Fixed 404 page to dynamically display the attempted username (e.g., "@testuser is free & available to claim!")
- Fixed connection editing API to handle both numeric IDs and platform names
- Purple theme consistently applied (#9333ea primary, #a855f7 secondary)

### URL Structure
- Biolinks: `/@username` (e.g., `glowi.es/@john`)
- File downloads: `/file/:code` (e.g., `glowi.es/file/abc123`)
- API biolink: `/api/biolink/:username`

### Database Schema
Key tables:
- `users` - User accounts with roles
- `profiles` - User profile data
- `links` - Bio links
- `files` - E2EE file storage with encryption keys
- `connections` - Social platform connections
- `invites` - Invite code management
- `recovery_codes` - Password recovery
- `password_resets` - Reset tokens

### Security Features
- JWT authentication (7-day expiration)
- bcrypt password hashing (12 rounds)
- AES-256-GCM file encryption
- Password-protected file downloads
- Rate limiting on sensitive endpoints
- Role-based access control

## File Structure
```
/dashboard         - New dashboard (single-page app)
/static/css        - All CSS including dashboard.css
/static/js         - All JS including dashboard.js
/api               - API route handlers
/lib               - Database, auth, middleware
/login             - Login pages
/register          - Registration page
/file              - File download page
/@username         - Public biolink profiles
```

## External Dependencies
- **Database**: Neon PostgreSQL
- **Deployment**: Replit (primary)
