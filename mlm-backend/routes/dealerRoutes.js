const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const {
    applyForDealer,
    getMyDealerStatus
} = require('../controllers/dealerController');

// ========================
// Protected Dealer Routes (User)
// ========================

// POST /api/dealer/apply - Submit dealer application
router.post('/apply', authenticateUser, applyForDealer);

// GET /api/dealer/status - Check my dealer status
router.get('/status', authenticateUser, getMyDealerStatus);

module.exports = router;
