const express = require('express');
const router = express.Router();
const { registerUser, loginUser, forgotPassword, refreshToken, logoutUser } = require('../controllers/authController');
const { validate } = require('../middleware/validation');
const { registerSchema, loginSchema } = require('../validations/auth.schema');
const { loginLimiter } = require('../middleware/rateLimit');

// POST /api/auth/register
router.post('/auth/register', validate(registerSchema), registerUser);

// POST /api/auth/login
router.post('/auth/login', loginLimiter, validate(loginSchema), loginUser);

// GET /api/auth/forgot-password
router.get('/auth/forgot-password', forgotPassword);

// POST /api/auth/refresh
router.post('/auth/refresh', refreshToken);

// POST /api/auth/logout
router.post('/auth/logout', logoutUser);

module.exports = router;
