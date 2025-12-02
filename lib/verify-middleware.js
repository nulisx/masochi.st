export function verificationMiddleware(req, res, next) {
    
    const bypassPaths = [
        '/verify', 
        '/api/verify/browser', 
        '/login', 
        '/register', 
        '/static', 
        '/fonts', 
        '/assets',
        '/api/auth/',
        '/api/profile',
        '/api/links',
        '/api/connections',
        '/api/files',
        '/api/updates',
        '/api/invites',
        '/api/biolink/',
        '/api/bio/',
        '/about',
        '/pricing',
        '/privacy',
        '/dash',
        '/dashboard',
        '/faq',
        '/lbfaq',
        '/@'
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
    
    const hasToken = req.cookies?.token;
    if (hasToken) {
        return next();
    }
    
    if (path.startsWith('/api')) {
        return res.status(401).json({ error: 'Browser verification required', requiresVerification: true });
    }
    
    next();
}
