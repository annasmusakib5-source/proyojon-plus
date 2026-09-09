const db = require('../config/db');

/**
 * GET /api/admin/distribution/preview
 * Protected: authenticateUser + authorizeAdmin
 * Previews the count of eligible members for each of the 7 clubs.
 */
const previewDistribution = async (req, res) => {
    try {
        // Query to get counts for clubs where eligibility is based on 'active' user status
        // Daily, Hajj, Reward, Monthly Prize, Hajj Lottery
        const [activeUsersResult] = await db.execute(
            'SELECT count(id) as cnt FROM users WHERE status = "active"'
        );
        const activeUsersCount = activeUsersResult[0].cnt;

        // Query to get counts for Shareholder Club (active shareholder packages)
        const [shareholderResult] = await db.execute(
            `SELECT count(DISTINCT up.user_id) as cnt 
             FROM user_packages up 
             JOIN packages p ON up.package_id = p.id 
             WHERE p.name = 'Shareholder' AND up.status = 'active'`
        );
        const shareholderCount = shareholderResult[0].cnt;

        // Query to get counts for Salary Club (from club_memberships table)
        const [salaryResult] = await db.execute(
            `SELECT count(user_id) as cnt 
             FROM club_memberships 
             WHERE club_type = 'salary' AND is_eligible = true`
        );
        const salaryCount = salaryResult[0].cnt;

        return res.status(200).json({
            success: true,
            message: 'Club distribution preview generated successfully.',
            data: {
                daily_club: activeUsersCount,
                shareholder_club: shareholderCount,
                hajj_club: activeUsersCount,
                reward_point: activeUsersCount,
                monthly_prize: activeUsersCount,
                hajj_lottery: activeUsersCount,
                salary_club: salaryCount
            }
        });
    } catch (error) {
        console.error('Preview Distribution Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred while previewing distribution.'
        });
    }
};

/**
 * POST /api/admin/distribution/trigger
 * Protected: authenticateUser + authorizeAdmin
 * Executes the 100 PV distribution across all 7 clubs.
 */
const triggerDistribution = async (req, res) => {
    const adminId = req.user.id;
    const basePv = parseFloat(req.body.base_pv) || 100.00;

    if (basePv <= 0) {
        return res.status(400).json({ success: false, message: 'base_pv must be greater than 0.' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Calculate Portions (Total 60%)
        const portions = {
            daily_club: basePv * 0.20,
            shareholder_club: basePv * 0.10,
            hajj_club: basePv * 0.10,
            reward_point: basePv * 0.07,
            monthly_prize: basePv * 0.05,
            hajj_lottery: basePv * 0.05,
            salary_club: basePv * 0.03
        };

        // 2. Fetch Eligible Members
        // Active Users (for Daily, Hajj, Reward, Monthly Prize, Hajj Lottery)
        const [activeUsers] = await connection.execute('SELECT id FROM users WHERE status = "active"');
        const activeUserIds = activeUsers.map(u => u.id);

        // Shareholder Users
        const [shareholders] = await connection.execute(
            `SELECT DISTINCT up.user_id as id 
             FROM user_packages up 
             JOIN packages p ON up.package_id = p.id 
             WHERE p.name = 'Shareholder' AND up.status = 'active'`
        );
        const shareholderUserIds = shareholders.map(u => u.id);

        // Salary Club Users
        const [salaryUsers] = await connection.execute(
            `SELECT user_id as id FROM club_memberships WHERE club_type = 'salary' AND is_eligible = true`
        );
        const salaryUserIds = salaryUsers.map(u => u.id);

        const memberCounts = {
            daily_club: activeUserIds.length,
            shareholder_club: shareholderUserIds.length,
            hajj_club: activeUserIds.length,
            reward_point: activeUserIds.length,
            monthly_prize: activeUserIds.length,
            hajj_lottery: activeUserIds.length,
            salary_club: salaryUserIds.length
        };

        // 3. Helper function to distribute to a specific club
        const distributeToClub = async (userIds, totalAmount, walletField) => {
            if (userIds.length === 0 || totalAmount <= 0) return;
            const amountPerUser = parseFloat((totalAmount / userIds.length).toFixed(4));
            
            for (const uid of userIds) {
                // Update wallet
                await connection.execute(
                    `UPDATE wallets SET ${walletField} = ${walletField} + ?, current_balance = current_balance + ?, total_income = total_income + ? WHERE user_id = ?`,
                    [amountPerUser, amountPerUser, amountPerUser, uid]
                );
                // Log transaction
                await connection.execute(
                    `INSERT INTO transactions (user_id, amount, type, category, description, wallet_field, created_at)
                     VALUES (?, ?, 'credit', 'club_bonus', ?, ?, NOW())`,
                    [uid, amountPerUser, `Admin distributed ${basePv} PV to ${walletField}`, walletField]
                );
            }
        };

        // 4. Distribute to all clubs
        await distributeToClub(activeUserIds, portions.daily_club, 'daily_club_bonus');
        await distributeToClub(shareholderUserIds, portions.shareholder_club, 'shareholder_club');
        await distributeToClub(activeUserIds, portions.hajj_club, 'hajj_club');
        await distributeToClub(activeUserIds, portions.reward_point, 'reward_point');
        await distributeToClub(activeUserIds, portions.monthly_prize, 'monthly_prize_point'); // Note: DB column is monthly_prize_point
        await distributeToClub(activeUserIds, portions.hajj_lottery, 'hajj_lottery_club');
        await distributeToClub(salaryUserIds, portions.salary_club, 'salary_club');

        // 5. Log Distribution History
        await connection.execute(
            `INSERT INTO club_distribution_history 
             (triggered_by, total_pv_distributed, daily_club_amount, shareholder_club_amount, hajj_club_amount, 
              reward_point_amount, monthly_prize_amount, hajj_lottery_amount, salary_club_amount, eligible_member_counts, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                adminId, basePv, portions.daily_club, portions.shareholder_club, portions.hajj_club,
                portions.reward_point, portions.monthly_prize, portions.hajj_lottery, portions.salary_club,
                JSON.stringify(memberCounts)
            ]
        );

        // 6. Log Activity
        await connection.execute(
            `INSERT INTO user_activity_logs (user_id, action, ip_address, description, created_at) 
             VALUES (?, 'CLUB_DISTRIBUTION_TRIGGERED', ?, ?, NOW())`,
            [adminId, req.ip || 'unknown', `Triggered distribution of ${basePv} PV across clubs.`]
        );

        await connection.commit();
        connection.release();

        return res.status(200).json({
            success: true,
            message: 'Club distribution executed successfully.',
            data: {
                base_pv: basePv,
                portions,
                memberCounts
            }
        });

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Trigger Distribution Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred while executing distribution.'
        });
    }
};

/**
 * GET /api/admin/distribution/history
 * Protected: authenticateUser + authorizeAdmin
 * Retrieves paginated list of past distributions.
 */
const getDistributionHistory = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const [history] = await db.execute(
            `SELECT h.*, u.phone as admin_phone 
             FROM club_distribution_history h
             JOIN users u ON h.triggered_by = u.id
             ORDER BY h.created_at DESC 
             LIMIT ? OFFSET ?`,
            [limit.toString(), offset.toString()] // stringify for limit/offset in mysql2 to prevent syntax errors
        );

        const [totalResult] = await db.execute('SELECT count(id) as total FROM club_distribution_history');
        const total = totalResult[0].total;

        return res.status(200).json({
            success: true,
            message: 'Distribution history retrieved successfully.',
            data: history,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get Distribution History Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred while retrieving distribution history.'
        });
    }
};

module.exports = { previewDistribution, triggerDistribution, getDistributionHistory };
