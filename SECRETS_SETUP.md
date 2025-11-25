# Secrets Management

## Important Security Notice

**NEVER commit secrets to version control!** All sensitive credentials must be stored in Replit Secrets or environment variable managers.

## Required Secrets for Replit Development

The following secrets are managed through Replit's Secrets tab:

### Database Connection
- `DATABASE_URL` - PostgreSQL connection string (automatically set by Replit database)
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Individual PostgreSQL credentials (automatically set by Replit)

### Authentication & Security
- `JWT_SECRET` - Secret key for JWT token signing (128-character hex string recommended)
- `SESSION_SECRET` - Secret key for session management (128-character base64 string recommended)

### Application Settings
- `FRONTEND_URL` - Public URL of your frontend (e.g., https://glowi.es)

## For Vercel/Production Deployment

Configure these same secrets in your Vercel project:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all the secrets listed above
3. Set them for Production, Preview, and Development environments

## Legacy Files Removed

The following files have been removed from version control for security:
- `MariaDB.env` → DELETED (contained hardcoded secrets)
- `MariaDB.json` → DELETED (contained hardcoded secrets)
- `PostgreSQL.env` → DELETED (contained hardcoded secrets)
- `PostgreSQL.json` → DELETED (contained hardcoded secrets)

All credentials are now managed exclusively through Replit Secrets and Vercel Environment Variables.

## Database Migration Notes

- **Development**: Uses Replit PostgreSQL database (automatically configured)
- **Production**: Uses Neon PostgreSQL database (configure DATABASE_URL in Vercel)
- All MariaDB/MySQL references have been removed from the codebase
