const db = require('../config/db');

/**
 * POST /api/dealer/apply
 * Protected: Submit a dealer application
 */
const applyForDealer = async (req, res) => {
    try {
        const userId = req.user.id;
        const { shopName, shopAddress, district, division, nidNumber } = req.body;

        if (!shopName || !shopAddress || !district) {
            return res.status(400).json({ success: false, message: 'Shop name, address, and district are required.' });
        }

        // Check if user already has a pending or approved application
        const [existing] = await db.execute(
            "SELECT id, status FROM dealer_applications WHERE user_id = ? AND status IN ('pending', 'approved') LIMIT 1",
            [userId]
        );

        if (existing.length > 0) {
            if (existing[0].status === 'approved') {
                return res.status(400).json({ success: false, message: 'You are already an approved dealer.' });
            }
            return res.status(400).json({ success: false, message: 'You already have a pending application.' });
        }

        // Check if user is already a dealer
        const [user] = await db.execute('SELECT is_dealer FROM users WHERE id = ?', [userId]);
        if (user.length > 0 && user[0].is_dealer) {
            return res.status(400).json({ success: false, message: 'You are already registered as a dealer.' });
        }

        await db.execute(
            `INSERT INTO dealer_applications (user_id, shop_name, shop_address, district, division, nid_number, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW(3), NOW(3))`,
            [userId, shopName, shopAddress, district, division || null, nidNumber || null]
        );

        return res.status(201).json({
            success: true,
            message: 'Dealer application submitted successfully! Admin will review your application.'
        });
    } catch (error) {
        console.error('Dealer Apply Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to submit dealer application.' });
    }
};

/**
 * GET /api/dealer/status
 * Protected: Check current user's dealer application status
 */
const getMyDealerStatus = async (req, res) => {
    try {
        const userId = req.user.id;

        const [applications] = await db.execute(
            'SELECT * FROM dealer_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        const [user] = await db.execute('SELECT is_dealer FROM users WHERE id = ?', [userId]);

        return res.status(200).json({
            success: true,
            data: {
                isDealer: user.length > 0 ? !!user[0].is_dealer : false,
                latestApplication: applications.length > 0 ? applications[0] : null
            }
        });
    } catch (error) {
        console.error('Get Dealer Status Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch dealer status.' });
    }
};

// ========================
// ADMIN DEALER MANAGEMENT
// ========================

/**
 * GET /api/admin/dealer-applications
 * Admin: List all dealer applications
 */
const adminGetDealerApplications = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = `SELECT da.*, u.phone as user_phone 
                      FROM dealer_applications da 
                      JOIN users u ON da.user_id = u.id 
                      WHERE 1=1`;
        const params = [];

        if (status) {
            query += ' AND da.status = ?';
            params.push(status);
        }

        const countQuery = query.replace(/SELECT da\.\*, u\.phone as user_phone/, 'SELECT COUNT(*) as total');
        const [countResult] = await db.execute(countQuery, params);
        const total = countResult[0].total;

        query += ' ORDER BY da.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [applications] = await db.execute(query, params);

        return res.status(200).json({
            success: true,
            data: applications,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        console.error('Admin Get Dealer Applications Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch dealer applications.' });
    }
};

/**
 * PUT /api/admin/dealer-applications/:id/approve
 * Admin: Approve a dealer application
 */
const approveDealerApplication = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { id } = req.params;
        const { admin_note } = req.body;

        await connection.beginTransaction();

        const [applications] = await connection.execute(
            'SELECT * FROM dealer_applications WHERE id = ? FOR UPDATE', [id]
        );

        if (applications.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ success: false, message: 'Application not found.' });
        }

        const app = applications[0];

        if (app.status !== 'pending') {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ success: false, message: `Application is already ${app.status}.` });
        }

        // Update application status
        await connection.execute(
            `UPDATE dealer_applications SET status = 'approved', admin_note = ?, updated_at = NOW(3) WHERE id = ?`,
            [admin_note || null, id]
        );

        // Mark user as dealer
        await connection.execute(
            'UPDATE users SET is_dealer = 1, updated_at = NOW(3) WHERE id = ?',
            [app.user_id]
        );

        await connection.commit();
        connection.release();

        return res.status(200).json({
            success: true,
            message: `Dealer application #${id} approved. User ID ${app.user_id} is now a dealer.`
        });
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Approve Dealer Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to approve dealer application.' });
    }
};

/**
 * PUT /api/admin/dealer-applications/:id/reject
 * Admin: Reject a dealer application
 */
const rejectDealerApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_note } = req.body;

        const [applications] = await db.execute(
            'SELECT * FROM dealer_applications WHERE id = ?', [id]
        );

        if (applications.length === 0) {
            return res.status(404).json({ success: false, message: 'Application not found.' });
        }

        if (applications[0].status !== 'pending') {
            return res.status(400).json({ success: false, message: `Application is already ${applications[0].status}.` });
        }

        await db.execute(
            `UPDATE dealer_applications SET status = 'rejected', admin_note = ?, updated_at = NOW(3) WHERE id = ?`,
            [admin_note || 'Application rejected by admin.', id]
        );

        return res.status(200).json({
            success: true,
            message: `Dealer application #${id} rejected.`
        });
    } catch (error) {
        console.error('Reject Dealer Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to reject dealer application.' });
    }
};

module.exports = {
    applyForDealer,
    getMyDealerStatus,
    adminGetDealerApplications,
    approveDealerApplication,
    rejectDealerApplication
};
