/**
 * 27. Active Check Middleware
 * Prevents inactive users from performing certain actions (e.g., fund transfers, earning commissions)
 */
const activeCheckMiddleware = (req, res, next) => {
    // Assuming req.user is set by authenticateUser middleware
    if (req.user && req.user.status === 'inactive') {
        return res.status(403).json({
            success: false,
            message: 'Your account is inactive. Purchase a package to activate.',
            errorCode: 'ACCOUNT_INACTIVE'
        });
    }
    
    // If user is banned, they shouldn't even pass authenticateUser, but let's be safe
    if (req.user && req.user.status === 'banned') {
        return res.status(403).json({
            success: false,
            message: 'Your account is banned.',
            errorCode: 'ACCOUNT_BANNED'
        });
    }

    next();
};

module.exports = { activeCheckMiddleware };
