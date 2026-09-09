const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { getClubStatus } = require('../controllers/clubController');

// GET /api/clubs
// Fetch all 7 clubs and user's eligibility status
router.get('/', authenticateUser, getClubStatus);

module.exports = router;
