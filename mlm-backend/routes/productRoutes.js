const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const {
    getAllProducts,
    getProductBySlug,
    getFeaturedProducts,
    getCategories
} = require('../controllers/productController');

// ========================
// Public Product Routes
// ========================

// GET /api/products/featured - Must be before /:slug to avoid conflict
router.get('/featured', getFeaturedProducts);

// GET /api/products/categories
router.get('/categories', getCategories);

// GET /api/products - List all active products (with filters)
router.get('/', getAllProducts);

// GET /api/products/:slug - Single product by slug
router.get('/:slug', getProductBySlug);

module.exports = router;
