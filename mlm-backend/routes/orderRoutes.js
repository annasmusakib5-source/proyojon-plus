const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const {
    createOrder,
    getMyOrders,
    getOrderById
} = require('../controllers/orderController');

// ========================
// Protected Order Routes (User)
// ========================

// POST /api/orders - Create a new order
router.post('/', authenticateUser, createOrder);

// GET /api/orders - Get my order history
router.get('/', authenticateUser, getMyOrders);

// GET /api/orders/:id - Get single order details
router.get('/:id', authenticateUser, getOrderById);

module.exports = router;
