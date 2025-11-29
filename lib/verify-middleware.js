export function verificationMiddleware(req, res, next) {
    
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
    
    
    const isVerified = req.cookies?.browser_verified === 'true';
    
    
    if (isVerified) {
        return next();
    }
    
    
    if (path.startsWith('/api')) {
        return res.status(401).json({ error: 'Browser verification required', requiresVerification: true });
    }
    
    
    next();
}
