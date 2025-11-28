export function verificationMiddleware(req, res, next) {
    // List of paths that bypass verification
    const bypassPaths = [
        '/verify', 
        '/api/verify/browser', 
        '/login', 
        '/register', 
        '/static', 
        '/fonts', 
        '/assets',
        '/api/auth/login', 
        '/api/auth/register',
        '/api/auth/logout',
        '/about',
        '/pricing',
        '/privacy'
    ];
    
    const path = req.path;
    const isBypass = bypassPaths.some(p => path.startsWith(p));
    
    if (isBypass) {
        return next();
    }
    
    // Check if browser is verified via cookie
    const isVerified = req.cookies?.browser_verified === 'true';
    
    // If already verified or authenticated, proceed
    if (isVerified) {
        return next();
    }
    
    // For API calls without verification, return error
    if (path.startsWith('/api')) {
        return res.status(401).json({ error: 'Browser verification required', requiresVerification: true });
    }
    
    // For HTML pages, allow them to load - the modal will be injected client-side
    next();
}
