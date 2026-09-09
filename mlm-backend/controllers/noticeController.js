const db = require('../config/db');

// ========================
// PUBLIC ENDPOINTS
// ========================

/**
 * GET /api/notices
 * Public: Get active notices
 */
const getActiveNotices = async (req, res) => {
    try {
        const [notices] = await db.execute(
            'SELECT * FROM notices WHERE is_active = 1 ORDER BY created_at DESC LIMIT 20'
        );
        return res.status(200).json({ success: true, data: notices });
    } catch (error) {
        console.error('Get Notices Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch notices.' });
    }
};

/**
 * GET /api/notices/ticker
 * Public: Get ticker-only notices for the top bar
 */
const getTickerNotices = async (req, res) => {
    try {
        const [notices] = await db.execute(
            'SELECT id, title FROM notices WHERE is_active = 1 AND is_ticker = 1 ORDER BY created_at DESC LIMIT 10'
        );
        return res.status(200).json({ success: true, data: notices });
    } catch (error) {
        console.error('Get Ticker Notices Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch ticker notices.' });
    }
};

/**
 * GET /api/gallery
 * Public: Get active gallery images
 */
const getGalleryImages = async (req, res) => {
    try {
        const { category } = req.query;
        let query = 'SELECT * FROM gallery_images WHERE is_active = 1';
        const params = [];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ' ORDER BY sort_order ASC, created_at DESC';

        const [images] = await db.execute(query, params);
        return res.status(200).json({ success: true, data: images });
    } catch (error) {
        console.error('Get Gallery Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch gallery images.' });
    }
};

// ========================
// ADMIN ENDPOINTS
// ========================

/**
 * GET /api/admin/notices
 * Admin: List all notices (including inactive)
 */
const adminGetAllNotices = async (req, res) => {
    try {
        const [notices] = await db.execute(
            'SELECT * FROM notices ORDER BY created_at DESC'
        );
        return res.status(200).json({ success: true, data: notices });
    } catch (error) {
        console.error('Admin Get Notices Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch notices.' });
    }
};

/**
 * POST /api/admin/notices
 * Admin: Create a notice
 */
const createNotice = async (req, res) => {
    try {
        const { title, content, is_ticker } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, message: 'Title is required.' });
        }

        const [result] = await db.execute(
            `INSERT INTO notices (title, content, is_active, is_ticker, created_at, updated_at) VALUES (?, ?, 1, ?, NOW(3), NOW(3))`,
            [title, content || null, is_ticker ? 1 : 0]
        );

        return res.status(201).json({
            success: true,
            message: 'Notice created successfully.',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Create Notice Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create notice.' });
    }
};

/**
 * PUT /api/admin/notices/:id
 * Admin: Update a notice
 */
const updateNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, is_active, is_ticker } = req.body;

        const [existing] = await db.execute('SELECT * FROM notices WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Notice not found.' });
        }

        const notice = existing[0];

        await db.execute(
            `UPDATE notices SET title = ?, content = ?, is_active = ?, is_ticker = ?, updated_at = NOW(3) WHERE id = ?`,
            [
                title || notice.title,
                content !== undefined ? content : notice.content,
                is_active !== undefined ? (is_active ? 1 : 0) : notice.is_active,
                is_ticker !== undefined ? (is_ticker ? 1 : 0) : notice.is_ticker,
                id
            ]
        );

        return res.status(200).json({ success: true, message: 'Notice updated successfully.' });
    } catch (error) {
        console.error('Update Notice Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update notice.' });
    }
};

/**
 * DELETE /api/admin/notices/:id
 * Admin: Delete a notice
 */
const deleteNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const [existing] = await db.execute('SELECT id FROM notices WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Notice not found.' });
        }
        await db.execute('DELETE FROM notices WHERE id = ?', [id]);
        return res.status(200).json({ success: true, message: 'Notice deleted successfully.' });
    } catch (error) {
        console.error('Delete Notice Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete notice.' });
    }
};

/**
 * GET /api/admin/gallery
 * Admin: List all gallery images
 */
const adminGetAllGalleryImages = async (req, res) => {
    try {
        const [images] = await db.execute(
            'SELECT * FROM gallery_images ORDER BY sort_order ASC, created_at DESC'
        );
        return res.status(200).json({ success: true, data: images });
    } catch (error) {
        console.error('Admin Get Gallery Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch gallery images.' });
    }
};

/**
 * POST /api/admin/gallery
 * Admin: Add a gallery image
 */
const createGalleryImage = async (req, res) => {
    try {
        const { title, image_url, category, sort_order } = req.body;

        if (!title || !image_url) {
            return res.status(400).json({ success: false, message: 'Title and image URL are required.' });
        }

        const [result] = await db.execute(
            `INSERT INTO gallery_images (title, image_url, category, sort_order, is_active, created_at) VALUES (?, ?, ?, ?, 1, NOW(3))`,
            [title, image_url, category || null, parseInt(sort_order || 0)]
        );

        return res.status(201).json({
            success: true,
            message: 'Gallery image added successfully.',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Create Gallery Image Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to add gallery image.' });
    }
};

/**
 * DELETE /api/admin/gallery/:id
 * Admin: Delete a gallery image
 */
const deleteGalleryImage = async (req, res) => {
    try {
        const { id } = req.params;
        const [existing] = await db.execute('SELECT id FROM gallery_images WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Gallery image not found.' });
        }
        await db.execute('DELETE FROM gallery_images WHERE id = ?', [id]);
        return res.status(200).json({ success: true, message: 'Gallery image deleted successfully.' });
    } catch (error) {
        console.error('Delete Gallery Image Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete gallery image.' });
    }
};

module.exports = {
    getActiveNotices,
    getTickerNotices,
    getGalleryImages,
    adminGetAllNotices,
    createNotice,
    updateNotice,
    deleteNotice,
    adminGetAllGalleryImages,
    createGalleryImage,
    deleteGalleryImage
};
