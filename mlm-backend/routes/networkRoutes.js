const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { getNetwork } = require('../controllers/networkController');

// GET /api/network?level=1
// Fetch user's generation network (up to level 5)
router.get('/', authenticateUser, getNetwork);

module.exports = router;
