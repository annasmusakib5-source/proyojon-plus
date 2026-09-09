const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * authenticateUser
 * - Verifies the Bearer JWT token from the Authorization header.
 * - Decodes user id, phone, and role, attaches to req.user.
 * - Confirms user still exists and is not banned in the database.
 * - Use this to protect any private route (withdrawals, wallet, packages, etc.)
 */
const authenticateUser = async (req, res, next) => {
    // 1. Try to read from cookie first, then fallback to Authorization header
    let token = req.cookies?.access_token;
    
    if (!token && req.headers['authorization']) {
        const authHeader = req.headers['authorization'];
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided. Please login first.'
        });
    }

    try {
        // 1. Verify and decode token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'proyojon_plus_secret_key');

        // 2. Confirm user still exists and check their current status in DB
        // This prevents a banned/deleted user from using an old valid token
        const [users] = await db.execute(
            'SELECT id, phone, role, status FROM users WHERE id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists. Please register again.'
            });
        }

        const user = users[0];

        // 3. Block banned users
        if (user.status === 'banned') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been banned. Please contact Admin.'
            });
        }

        // 4. Attach full user context to req.user
        req.user = {
            id: user.id,
            phone: user.phone,
            role: user.role,
            status: user.status
        };

        next();

    } catch (error) {
        // Handle specific JWT errors with clear messages
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Session has expired. Please login again.'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please login again.'
            });
        }

        // Generic server error
        console.error('Auth Middleware Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Authentication failed due to a server error.'
        });
    }
};

/**
 * authorizeAdmin
 * - Must be used AFTER authenticateUser.
 * - Ensures only users with role='admin' can access the route.
 * - Use this to protect admin-only routes.
 *
 * Usage: router.get('/admin/users', authenticateUser, authorizeAdmin, controller)
 */
const authorizeAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
};

module.exports = { authenticateUser, authorizeAdmin };
