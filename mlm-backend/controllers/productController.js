const db = require('../config/db');

/**
 * GET /api/products
 * Public: List all active products with optional category filter and search
 */
const getAllProducts = async (req, res) => {
    try {
        const { category, search, featured, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        let query = 'SELECT * FROM products WHERE status = ?';
        const params = ['active'];

        if (category && category !== 'all') {
            query += ' AND category = ?';
            params.push(category);
        }

        if (search) {
            query += ' AND (name LIKE ? OR description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (featured === 'true') {
            query += ' AND is_featured = 1';
        }

        // Get total count for pagination
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countResult] = await db.execute(countQuery, params);
        const total = countResult[0].total;

        query += ' ORDER BY is_featured DESC, created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [products] = await db.execute(query, params);

        return res.status(200).json({
            success: true,
            data: products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get Products Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch products.' });
    }
};

/**
 * GET /api/products/:slug
 * Public: Get single product by slug
 */
const getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const [products] = await db.execute(
            'SELECT * FROM products WHERE slug = ? AND status = ?',
            [slug, 'active']
        );

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        return res.status(200).json({ success: true, data: products[0] });
    } catch (error) {
        console.error('Get Product Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch product.' });
    }
};

/**
 * GET /api/products/featured
 * Public: Get featured products for homepage
 */
const getFeaturedProducts = async (req, res) => {
    try {
        const [products] = await db.execute(
            'SELECT * FROM products WHERE status = ? AND is_featured = 1 ORDER BY created_at DESC LIMIT 8',
            ['active']
        );

        return res.status(200).json({ success: true, data: products });
    } catch (error) {
        console.error('Get Featured Products Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch featured products.' });
    }
};

/**
 * GET /api/products/categories
 * Public: Get list of product categories with count
 */
const getCategories = async (req, res) => {
    try {
        const [categories] = await db.execute(
            `SELECT category, COUNT(*) as count 
             FROM products WHERE status = 'active' 
             GROUP BY category ORDER BY count DESC`
        );

        return res.status(200).json({ success: true, data: categories });
    } catch (error) {
        console.error('Get Categories Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
    }
};

// ========================
// ADMIN ENDPOINTS
// ========================

/**
 * GET /api/admin/products
 * Admin: List all products (including inactive)
 */
const adminGetAllProducts = async (req, res) => {
    try {
        const { status, category, page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countResult] = await db.execute(countQuery, params);
        const total = countResult[0].total;

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [products] = await db.execute(query, params);

        return res.status(200).json({
            success: true,
            data: products,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        console.error('Admin Get Products Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch products.' });
    }
};

/**
 * POST /api/admin/products
 * Admin: Create new product
 */
const createProduct = async (req, res) => {
    try {
        const { name, category, price, pv_value, dealer_commission_percentage, description, image_url, stock, is_featured } = req.body;

        if (!name || !price || pv_value === undefined) {
            return res.status(400).json({ success: false, message: 'Name, price, and PV value are required.' });
        }

        // Generate slug from name
        let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Ensure unique slug
        const [existing] = await db.execute('SELECT id FROM products WHERE slug = ?', [slug]);
        if (existing.length > 0) {
            slug = `${slug}-${Date.now()}`;
        }

        const [result] = await db.execute(
            `INSERT INTO products (name, slug, category, price, pv_value, dealer_commission_percentage, description, image_url, stock, is_featured, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(3), NOW(3))`,
            [
                name,
                slug,
                category || 'other',
                parseFloat(price),
                parseFloat(pv_value),
                parseFloat(dealer_commission_percentage || 5.00),
                description || null,
                image_url || null,
                parseInt(stock || 0),
                is_featured ? 1 : 0
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Product created successfully.',
            data: { id: result.insertId, slug }
        });
    } catch (error) {
        console.error('Create Product Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create product.' });
    }
};

/**
 * PUT /api/admin/products/:id
 * Admin: Update product
 */
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, price, pv_value, dealer_commission_percentage, description, image_url, stock, is_featured, status } = req.body;

        const [existing] = await db.execute('SELECT * FROM products WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        const product = existing[0];

        // Regenerate slug if name changed
        let slug = product.slug;
        if (name && name !== product.name) {
            slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const [slugExists] = await db.execute('SELECT id FROM products WHERE slug = ? AND id != ?', [slug, id]);
            if (slugExists.length > 0) {
                slug = `${slug}-${Date.now()}`;
            }
        }

        await db.execute(
            `UPDATE products SET 
                name = ?, slug = ?, category = ?, price = ?, pv_value = ?, 
                dealer_commission_percentage = ?, description = ?, image_url = ?, 
                stock = ?, is_featured = ?, status = ?, updated_at = NOW(3)
             WHERE id = ?`,
            [
                name || product.name,
                slug,
                category || product.category,
                parseFloat(price || product.price),
                parseFloat(pv_value !== undefined ? pv_value : product.pv_value),
                parseFloat(dealer_commission_percentage || product.dealer_commission_percentage),
                description !== undefined ? description : product.description,
                image_url !== undefined ? image_url : product.image_url,
                parseInt(stock !== undefined ? stock : product.stock),
                is_featured !== undefined ? (is_featured ? 1 : 0) : product.is_featured,
                status || product.status,
                id
            ]
        );

        return res.status(200).json({ success: true, message: 'Product updated successfully.' });
    } catch (error) {
        console.error('Update Product Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update product.' });
    }
};

/**
 * DELETE /api/admin/products/:id
 * Admin: Delete (soft) product by setting status to inactive
 */
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.execute('SELECT id FROM products WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        await db.execute("UPDATE products SET status = 'inactive', updated_at = NOW(3) WHERE id = ?", [id]);

        return res.status(200).json({ success: true, message: 'Product deleted (deactivated) successfully.' });
    } catch (error) {
        console.error('Delete Product Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete product.' });
    }
};

module.exports = {
    getAllProducts,
    getProductBySlug,
    getFeaturedProducts,
    getCategories,
    adminGetAllProducts,
    createProduct,
    updateProduct,
    deleteProduct
};
