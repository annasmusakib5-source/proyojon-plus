const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { activeCheckMiddleware } = require('../middleware/activeCheck');
const { transferFunds, getWallet } = require('../controllers/walletController');
const { validate } = require('../middleware/validation');
const { transferSchema } = require('../validations/wallet.schema');
const { transferLimiter } = require('../middleware/rateLimit');

// POST /api/wallet/transfer
// ID-to-ID fund transfer
router.post('/transfer', authenticateUser, activeCheckMiddleware, transferLimiter, validate(transferSchema), transferFunds);

// GET /api/wallet
// Fetch all 9 wallet fields and club memberships
router.get('/', authenticateUser, getWallet);

module.exports = router;
