const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');
const { authenticateUser } = require('../middleware/auth');

// GET /api/dashboard
// Accessible via app.use('/api', dashboardRoutes) or app.use('/api/dashboard', dashboardRoutes)
router.get('/dashboard', authenticateUser, getDashboard);
router.get('/', authenticateUser, getDashboard);

module.exports = router;
