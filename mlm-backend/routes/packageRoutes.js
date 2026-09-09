const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { purchasePackage, cancelGoldPackage, getUserPackages } = require('../controllers/packageController');
const { validate } = require('../middleware/validation');
const { purchaseSchema } = require('../validations/package.schema');

// POST /api/packages/purchase
// Purchases a new package and activates commission flow
router.post('/purchase', authenticateUser, validate(purchaseSchema), purchasePackage);

// POST /api/packages/:id/cancel
// Cancels an active Gold package (pays off due account)
router.post('/:id/cancel', authenticateUser, cancelGoldPackage);

// GET /api/packages
// View logged-in user's packages
router.get('/', authenticateUser, getUserPackages);

module.exports = router;
