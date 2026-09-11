const bcrypt = require('bcrypt');
const db = require('../config/db');

/**
 * PUT /api/admin/users/:id/reset-password
 * Protected: authenticateUser + authorizeAdmin
 * PRD §1: Admin manually resets a user's password (no OTP/email system).
 */
const resetUserPassword = async (req, res) => {
    const targetUserId = req.params.id;
    const { new_password } = req.body;
    const adminId = req.user.id;

    // --- Validation ---
    if (!new_password) {
        return res.status(400).json({
            success: false,
            message: 'new_password is required.'
        });
    }

    if (new_password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters long.'
        });
    }

    const connection = await db.getConnection();

    try {
        // 1. Check if target user exists
        const [users] = await connection.execute(
            'SELECT id, phone FROM users WHERE id = ?',
            [targetUserId]
        );

        if (users.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: 'User not found with the given ID.'
            });
        }

        const targetUser = users[0];

        // 2. Hash the new password
        const hashedPassword = await bcrypt.hash(new_password, 12);

        // --- BEGIN TRANSACTION ---
        await connection.beginTransaction();

        // 3. Update user's password
        await connection.execute(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
            [hashedPassword, targetUserId]
        );

        // 4. Log the action in user_activity_logs
        await connection.execute(
            `INSERT INTO user_activity_logs (user_id, action, ip_address, description, created_at) 
             VALUES (?, 'PASSWORD_RESET', ?, ?, NOW())`,
            [
                targetUserId,
                req.ip || 'unknown',
                `Password reset by Admin (ID: ${adminId}) for User ${targetUser.phone}`
            ]
        );

        // --- COMMIT ---
        await connection.commit();
        connection.release();

        return res.status(200).json({
            success: true,
            message: `Password successfully reset for User ID ${targetUserId} (${targetUser.phone}).`
        });

    } catch (error) {
        await connection.rollback();
        connection.release();

        console.error('Admin Reset Password Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred while resetting the password.'
        });
    }
};



/**
 * GET /api/admin/users/:id/audit
 * Protected: authenticateUser + authorizeAdmin
 * PRD §5: User Audit Log (merges activities, transactions, and withdrawals)
 */
const getUserAuditLog = async (req, res) => {
    const targetUserId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    try {
        // We will fetch all events for the user and merge them in JS (since they come from different schemas)
        // Note: For a very large scale app, a UNION query or specialized audit table is better, 
        // but for now, we can fetch them individually and sort.
        
        // 1. Fetch user_activity_logs
        const [activities] = await db.execute(
            `SELECT 'ACTIVITY' as event_type, action as title, description, created_at 
             FROM user_activity_logs WHERE user_id = ?`,
            [targetUserId]
        );

        // 2. Fetch transactions
        const [transactions] = await db.execute(
            `SELECT 'TRANSACTION' as event_type, 
             CONCAT(type, ' (', category, ')') as title, 
             CONCAT('Amount: ', amount, ', Wallet: ', wallet_field, '. ', description) as description, 
             created_at 
             FROM transactions WHERE user_id = ?`,
            [targetUserId]
        );

        // 3. Fetch withdrawals
        const [withdrawals] = await db.execute(
            `SELECT 'WITHDRAWAL' as event_type, 
             CONCAT('Withdrawal - ', status) as title, 
             CONCAT('Amount: ', amount, ', Net Payable: ', net_payable, ', Method: ', method) as description, 
             created_at 
             FROM withdrawals WHERE user_id = ?`,
            [targetUserId]
        );

        // Merge all arrays
        const allEvents = [...activities, ...transactions, ...withdrawals];

        // Sort descending by created_at
        allEvents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Paginate in memory
        const total = allEvents.length;
        const paginatedEvents = allEvents.slice(offset, offset + limit);

        return res.status(200).json({
            success: true,
            message: `Audit log retrieved for User ID ${targetUserId}`,
            data: paginatedEvents,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Audit Log Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred while retrieving the audit log.'
        });
    }
};



// ==========================================
// PROMPT 19: USER MANAGEMENT
// ==========================================

/**
 * GET /api/admin/users
 * List all users with filters and pagination
 */
const getAllUsers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { status, search } = req.query;

    try {
        let whereClauses = [];
        let queryParams = [];

        if (status) {
            whereClauses.push('u.status = ?');
            queryParams.push(status);
        }

        if (search) {
            whereClauses.push('u.phone LIKE ?');
            queryParams.push(`%${search}%`);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const [users] = await db.execute(
            `SELECT u.id, u.name, u.username, u.phone, u.role, u.is_dealer, u.status, u.sponsor_id, u.last_active_at, u.created_at,
                    u.accumulated_pv, u.sp, u.gp,
                    s.username as sponsor_username, s.name as sponsor_name, s.phone as sponsor_phone
             FROM users u
             LEFT JOIN users s ON u.sponsor_id = s.id
             ${whereString} 
             ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
            [...queryParams, limit.toString(), offset.toString()]
        );

        const [countResult] = await db.execute(
            `SELECT count(u.id) as total FROM users u ${whereString}`,
            queryParams
        );
        const total = countResult[0].total;

        return res.status(200).json({
            success: true,
            data: users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get All Users Error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /api/admin/users/:id
 * Get single user profile + wallet details
 */
const getUserDetails = async (req, res) => {
    const targetUserId = req.params.id;

    try {
        const [users] = await db.execute(
            'SELECT id, phone, role, is_dealer, status, sponsor_id, last_active_at, created_at FROM users WHERE id = ?',
            [targetUserId]
        );

        if (users.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

        const [wallets] = await db.execute('SELECT * FROM wallets WHERE user_id = ?', [targetUserId]);

        return res.status(200).json({
            success: true,
            data: {
                user: users[0],
                wallet: wallets[0] || null
            }
        });
    } catch (error) {
        console.error('Get User Details Error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * PUT /api/admin/users/:id/ban
 */
const banUser = async (req, res) => {
    const targetUserId = req.params.id;
    const adminId = req.user.id;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await connection.execute('UPDATE users SET status = "banned" WHERE id = ?', [targetUserId]);

        await connection.execute(
            `INSERT INTO user_activity_logs (user_id, action, ip_address, description, created_at) VALUES (?, 'USER_BANNED', ?, ?, NOW())`,
            [targetUserId, req.ip || 'unknown', `Banned by Admin ID: ${adminId}`]
        );

        await connection.commit();
        connection.release();

        return res.status(200).json({ success: true, message: 'User banned successfully' });
    } catch (error) {
        await connection.rollback();
        connection.release();
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * PUT /api/admin/users/:id/unban
 * Simplification: sets status to 'active' or 'inactive'. We'll assume 'active' if they have an active package, otherwise 'inactive'.
 */
const unbanUser = async (req, res) => {
    const targetUserId = req.params.id;
    const adminId = req.user.id;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [packages] = await connection.execute(
            "SELECT count(id) as cnt FROM user_packages WHERE user_id = ? AND status = 'active'",
            [targetUserId]
        );
        const newStatus = packages[0].cnt > 0 ? 'active' : 'inactive';

        await connection.execute('UPDATE users SET status = ? WHERE id = ?', [newStatus, targetUserId]);

        await connection.execute(
            `INSERT INTO user_activity_logs (user_id, action, ip_address, description, created_at) VALUES (?, 'USER_UNBANNED', ?, ?, NOW())`,
            [targetUserId, req.ip || 'unknown', `Unbanned by Admin ID: ${adminId}. Status set to ${newStatus}`]
        );

        await connection.commit();
        connection.release();

        return res.status(200).json({ success: true, message: `User unbanned and set to ${newStatus}` });
    } catch (error) {
        await connection.rollback();
        connection.release();
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * PUT /api/admin/users/:id/status
 * Generic status update: active | inactive | banned
 */
const updateUserStatus = async (req, res) => {
    const targetUserId = req.params.id;
    const adminId = req.user.id;
    const { status } = req.body;

    const validStatuses = ['active', 'inactive', 'banned'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Status must be one of: ${validStatuses.join(', ')}`
        });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Verify user exists
        const [users] = await connection.execute(
            'SELECT id, phone FROM users WHERE id = ?',
            [targetUserId]
        );
        if (users.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await connection.execute(
            'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, targetUserId]
        );

        await connection.execute(
            `INSERT INTO user_activity_logs (user_id, action, ip_address, description, created_at)
             VALUES (?, 'STATUS_CHANGE', ?, ?, NOW())`,
            [targetUserId, req.ip || 'unknown', `Status changed to "${status}" by Admin ID: ${adminId}`]
        );

        await connection.commit();
        connection.release();

        return res.status(200).json({
            success: true,
            message: `User #${targetUserId} status updated to "${status}" successfully.`
        });
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('UpdateUserStatus Error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ==========================================
// PROMPT 20: WITHDRAWAL MANAGEMENT
// ==========================================

/**
 * GET /api/admin/withdrawals
 */
const getWithdrawals = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { status } = req.query;

    try {
        let whereStr = '';
        let queryParams = [];
        if (status) {
            whereStr = 'WHERE w.status = ?';
            queryParams.push(status);
        }

        const [withdrawals] = await db.execute(
            `SELECT w.*, u.phone 
             FROM withdrawals w 
             JOIN users u ON w.user_id = u.id 
             ${whereStr} 
             ORDER BY w.created_at DESC LIMIT ? OFFSET ?`,
            [...queryParams, limit.toString(), offset.toString()]
        );

        const [countRes] = await db.execute(`SELECT count(id) as total FROM withdrawals w ${whereStr}`, queryParams);

        return res.status(200).json({
            success: true,
            data: withdrawals,
            pagination: { total: countRes[0].total, page, limit }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * PUT /api/admin/withdrawals/:id/approve
 */
const approveWithdrawal = async (req, res) => {
    const withdrawalId = req.params.id;
    const adminId = req.user.id;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.execute('SELECT user_id, status FROM withdrawals WHERE id = ? FOR UPDATE', [withdrawalId]);
        if (rows.length === 0) throw new Error('Withdrawal not found');
        if (rows[0].status !== 'pending') throw new Error('Withdrawal is not pending');

        await connection.execute(
            'UPDATE withdrawals SET status = "approved", processed_at = NOW() WHERE id = ?',
            [withdrawalId]
        );

        await connection.execute(
            `INSERT INTO user_activity_logs (user_id, action, ip_address, description, created_at) VALUES (?, 'WITHDRAWAL_APPROVED', ?, ?, NOW())`,
            [rows[0].user_id, req.ip || 'unknown', `Withdrawal ${withdrawalId} approved by Admin ${adminId}`]
        );

        await connection.commit();
        connection.release();
        return res.status(200).json({ success: true, message: 'Withdrawal approved' });
    } catch (error) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ success: false, message: error.message || 'Server error' });
    }
};

/**
 * PUT /api/admin/withdrawals/:id/reject
 */
const rejectWithdrawal = async (req, res) => {
    const withdrawalId = req.params.id;
    const adminId = req.user.id;
    const { admin_note } = req.body;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.execute(
            'SELECT user_id, amount, status FROM withdrawals WHERE id = ? FOR UPDATE', 
            [withdrawalId]
        );
        if (rows.length === 0) throw new Error('Withdrawal not found');
        if (rows[0].status !== 'pending') throw new Error('Withdrawal is not pending');

        const userId = rows[0].user_id;
        const amountToRefund = parseFloat(rows[0].amount);

        // Update withdrawal
        await connection.execute(
            'UPDATE withdrawals SET status = "rejected", admin_note = ?, processed_at = NOW() WHERE id = ?',
            [admin_note || 'No reason provided', withdrawalId]
        );

        // Refund wallet
        await connection.execute(
            'UPDATE wallets SET current_balance = current_balance + ? WHERE user_id = ?',
            [amountToRefund, userId]
        );

        // Log transaction refund
        await connection.execute(
            `INSERT INTO transactions (user_id, amount, type, category, description, wallet_field, reference_id, created_at)
             VALUES (?, ?, 'credit', 'deposit', ?, 'current_balance', ?, NOW())`,
            [userId, amountToRefund, `Refund for rejected withdrawal request`, withdrawalId]
        );

        // Log activity
        await connection.execute(
            `INSERT INTO user_activity_logs (user_id, action, ip_address, description, created_at) VALUES (?, 'WITHDRAWAL_REJECTED', ?, ?, NOW())`,
            [userId, req.ip || 'unknown', `Withdrawal ${withdrawalId} rejected. Refunded ${amountToRefund}`]
        );

        await connection.commit();
        connection.release();
        return res.status(200).json({ success: true, message: 'Withdrawal rejected and refunded' });
    } catch (error) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ success: false, message: error.message || 'Server error' });
    }
};



// ==========================================
// PROMPT 21: MANUAL BALANCE ADJUSTMENT
// ==========================================

/**
 * POST /api/admin/adjustments
 * PRD §5: Manual Balance/Prize Adjustments
 */
const manualBalanceAdjustment = async (req, res) => {
    const adminId = req.user.id;
    const { user_id, wallet_field, amount, description } = req.body;

    const validWalletFields = [
        'current_balance', 'total_income', 'daily_club_bonus', 'salary_club',
        'hajj_club', 'shareholder_club', 'hajj_lottery_club', 'reward_point',
        'monthly_prize_point', 'due_account'
    ];

    if (!validWalletFields.includes(wallet_field)) {
        return res.status(400).json({ success: false, message: 'Invalid wallet field' });
    }

    const adjustAmount = parseFloat(amount);
    if (isNaN(adjustAmount) || adjustAmount === 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [users] = await connection.execute('SELECT id FROM users WHERE id = ?', [user_id]);
        if (users.length === 0) throw new Error('User not found');

        // Update wallet
        await connection.execute(
            `UPDATE wallets SET ${wallet_field} = ${wallet_field} + ? WHERE user_id = ?`,
            [adjustAmount, user_id]
        );

        // Determine transaction type based on positive/negative amount
        const type = adjustAmount > 0 ? 'credit' : 'debit';
        const absAmount = Math.abs(adjustAmount);

        await connection.execute(
            `INSERT INTO transactions (user_id, amount, type, category, description, wallet_field, created_at)
             VALUES (?, ?, ?, 'club_bonus', ?, ?, NOW())`, // using club_bonus as generic admin adjust if no admin_adjustment enum exists
            [user_id, absAmount, type, description || `Admin adjustment to ${wallet_field}`, wallet_field]
        );

        await connection.execute(
            `INSERT INTO user_activity_logs (user_id, action, ip_address, description, created_at) VALUES (?, 'ADMIN_ADJUSTMENT', ?, ?, NOW())`,
            [adminId, req.ip || 'unknown', `Adjusted user ${user_id}'s ${wallet_field} by ${adjustAmount}. Reason: ${description}`]
        );

        await connection.commit();
        connection.release();

        return res.status(200).json({ success: true, message: 'Balance adjusted successfully' });
    } catch (error) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ success: false, message: error.message || 'Server error' });
    }
};

// ==========================================
// PROMPT 22: DEALER MANAGEMENT
// ==========================================

/**
 * PUT /api/admin/dealers/:userId/config
 */
const configDealer = async (req, res) => {
    const targetUserId = req.params.userId;
    const adminId = req.user.id;
    const { is_dealer } = req.body; // commission_rate is ignored as it's not in DB schema yet

    if (typeof is_dealer !== 'boolean') {
        return res.status(400).json({ success: false, message: 'is_dealer must be a boolean' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await connection.execute('UPDATE users SET is_dealer = ? WHERE id = ?', [is_dealer ? 1 : 0, targetUserId]);

        await connection.execute(
            `INSERT INTO user_activity_logs (user_id, action, ip_address, description, created_at) VALUES (?, 'DEALER_CONFIG', ?, ?, NOW())`,
            [targetUserId, req.ip || 'unknown', `Admin ${adminId} updated dealer status to ${is_dealer}`]
        );

        await connection.commit();
        connection.release();
        return res.status(200).json({ success: true, message: `Dealer status updated to ${is_dealer}` });
    } catch (error) {
        await connection.rollback();
        connection.release();
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /api/admin/dealers
 */
const getDealers = async (req, res) => {
    try {
        const [dealers] = await db.execute(
            'SELECT id, phone, status, created_at FROM users WHERE is_dealer = true ORDER BY created_at DESC'
        );
        return res.status(200).json({ success: true, data: dealers });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { 
    resetUserPassword, 
    getUserAuditLog, 
    getAllUsers, 
    getUserDetails, 
    banUser, 
    unbanUser, 
    updateUserStatus,
    getWithdrawals, 
    approveWithdrawal, 
    rejectWithdrawal,
    manualBalanceAdjustment,
    configDealer,
    getDealers
};
