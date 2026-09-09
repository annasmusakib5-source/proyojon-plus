const rateLimit = require('express-rate-limit');

/**
 * 29. Rate Limit Middleware
 * Protects against brute-force and spam requests.
 */

// Login: 5 attempts per minute per IP
const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 requests per `window` (here, per 1 minute)
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again after a minute.',
        errorCode: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Fund Transfer: 10 per minute per user
const transferLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10,
    keyGenerator: (req, res) => {
        return req.user ? req.user.id.toString() : 'anonymous'; 
    },
    message: {
        success: false,
        message: 'Too many transfer attempts. Please wait a minute.',
        errorCode: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Withdrawal: 5 per hour per user
const withdrawalLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    keyGenerator: (req, res) => {
        return req.user ? req.user.id.toString() : 'anonymous'; 
    },
    message: {
        success: false,
        message: 'Too many withdrawal requests. You can only make 5 requests per hour.',
        errorCode: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    loginLimiter,
    transferLimiter,
    withdrawalLimiter
};
