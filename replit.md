# Glowi.es Bio Link Platform Service

## Overview
Glowi.es is an exclusive, invite-only bio link platform, akin to Linktree, designed for users to create custom profile pages. These pages can feature social media links, digital collectibles, and various integrations. The platform emphasizes a minimalist, highly customizable, and secure experience, distinguished by its refined design and robust feature set. Its core purpose is to provide controlled access and aesthetic appeal to users who value a premium online presence.

## User Preferences
I want iterative development.
I want to be asked before you make major changes.

## System Architecture

### UI/UX Decisions
The platform features an ultra-minimal, clean design inspired by elyria.cc, incorporating advanced CSS animations and effects. The color scheme is pure black (`#000000`) with white text and vibrant green (`#10b981`) accents. Typography is set at a 13px base, emphasizing a "less is more" philosophy with maximal whitespace and professional animations. The hero badge includes particle animations, glowing effects, and gradient rotations. Subtle hover states, glassmorphic effects, and a grain texture overlay enhance depth.

### Technical Implementations
- **Frontend**: Static HTML/CSS/JavaScript.
- **Backend**: Node.js with Express.
- **Database**: Neon PostgreSQL with `pg` driver and connection pooling.
- **Authentication**: JWT-based with bcrypt (12 rounds) for password hashing and SHA-256 for email hashing.
- **Server Configuration**: Runs on port 5000 and host 0.0.0.0 for Replit compatibility.

### Feature Specifications
- **Role-Based Access Control**: Hierarchical roles (Owner, Manager, Admin, Mod, User) with distinct dashboard and invite creation privileges.
- **Registration System**: Mandatory invite codes, username validation (1-20 alphanumeric characters and underscores), multi-use and time-expiring invite support, and 32-character hex recovery code generation for password reset.
- **Password Reset System**: Self-service via email and one-time recovery codes, with two-step verification, bcrypt-hashed recovery codes, rate limiting (5 attempts/15 min), 10-minute reset token expiry, and normalized error messages.
- **API Endpoints**: Comprehensive endpoints for Authentication (Register, Login, Logout, Token Exchange, Password Reset), Invite Management (Create, List, Update, Delete), User Profile (Get, Update), Links (Get, Create, Update, Delete), Images (Get, Upload, Delete), Connections (Get, Create, Update, Delete), and Collectibles (Get, Claim, Delete).

### System Design Choices
- **Database Schema**: Includes tables for `users`, `invites`, `profiles`, `links`, `social_links`, `analytics`, `recovery_codes`, and `password_resets` to manage user data, access, and site functionality.
- **Security**: JWT authentication (7-day expiration), bcrypt password hashing, role-based access control, invite code validation, session management, `express-validator` for input validation, rate limiting, one-time recovery codes, and normalized error responses.

## External Dependencies
- **Database**:
    - **Neon PostgreSQL**: Used for the production database, employing the `pg` driver for connection pooling.
- **Deployment**:
    - **Vercel**: Utilized for production deployment, including integration with Vercel Speed Insights.
- **Monitoring**:
    - **Vercel Speed Insights**: Integrated for real-time performance monitoring.