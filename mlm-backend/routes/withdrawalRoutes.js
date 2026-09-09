const express = require('express');
const router = express.Router();
const { requestWithdrawal } = require('../controllers/withdrawalController');
const { authenticateUser } = require('../middleware/auth');
const { activeCheckMiddleware } = require('../middleware/activeCheck');
const { withdrawalLimiter } = require('../middleware/rateLimit');
const { validate } = require('../middleware/validation');
const { withdrawalRequestSchema } = require('../validations/withdrawal.schema');

// POST /api/withdraw
// Requires user to be logged in, active status, rate limited to 5/hr
router.post('/', authenticateUser, activeCheckMiddleware, withdrawalLimiter, validate(withdrawalRequestSchema), requestWithdrawal);

module.exports = router;
