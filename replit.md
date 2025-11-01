# Masochi.st Remake

## Overview
A bio link profile website (similar to Linktree) that allows users to create custom profile pages with social media links, collectibles, and integrations. This is a remake of the original masochi.st website.

## Tech Stack
- **Frontend**: Static HTML/CSS/JavaScript
- **Backend**: Node.js + Express
- **Database**: SQLite
- **External Dependencies**: fights.cfd API for authentication

## Project Structure
```
.
├── server.js           # Main Express server
├── index.html          # Landing page
├── login/              # Login page
├── register/           # Registration page
├── dashboard/          # User dashboard
├── account/            # Account settings
├── collectibles/       # User collectibles
├── integrations/       # Third-party integrations
├── images/             # Image gallery
├── static/             # Static assets (CSS, images, CDN files)
├── assets/             # JavaScript files and fonts
└── database.db         # SQLite database (auto-created)
```

## API Endpoints
- `POST /generate_invite` - Generates a new invite code

## Database Schema
### invites table
- `id` (INTEGER PRIMARY KEY)
- `code` (TEXT UNIQUE) - Invite code
- `used` (INTEGER DEFAULT 0) - Whether code has been used

## Setup Notes
- Server runs on port 5000 (required for Replit webview)
- Host: 0.0.0.0 (required for Replit)
- SQLite database is automatically created on first run
- External authentication handled by fights.cfd API

## Recent Changes
- 2025-11-01: Initial setup for Replit environment
  - Created Express server configuration (server.js)
  - Added proper routing for all pages (/, /login, /register, /dashboard, /account, /collectibles, /integrations)
  - Configured port 5000 on host 0.0.0.0 for webview
  - Set up workflow for automatic server restart
  - Installed Node.js 20 and npm dependencies (express, sqlite3)
  - Configured deployment for autoscale
  - All pages tested and verified working
  
## Known Issues
- Font files referenced from external domain (og.email) cause CORS errors - these are cosmetic only and don't affect functionality
- JavaScript animation timing issue on landing page (doesn't affect user experience)
- Authentication relies on external API (fights.cfd) which may not be available
