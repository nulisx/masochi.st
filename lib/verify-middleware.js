export function verificationMiddleware(req, res, next) {
    // List of paths that bypass verification
    const bypassPaths = ['/verify', '/api/verify/browser', '/login', '/register', '/static', '/fonts', '/assets', '/api/auth/login', '/api/auth/register'];
    
    const path = req.path;
    const isBypass = bypassPaths.some(p => path.startsWith(p));
    
    if (isBypass) {
        return next();
    }
    
    // Check if browser is verified via cookie
    const isVerified = req.cookies?.browser_verified === 'true';
    
    if (!isVerified && !path.startsWith('/api')) {
        // For HTML pages, redirect to verify
        return res.redirect(`/verify?redirect=${encodeURIComponent(req.originalUrl || '/')}`);
    }
    
    if (!isVerified && path.startsWith('/api')) {
        // For API calls, return error
        return res.status(401).json({ error: 'Browser verification required' });
    }
    
    next();
}
