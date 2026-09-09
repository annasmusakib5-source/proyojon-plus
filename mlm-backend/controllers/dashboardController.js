const db = require('../config/db');

/**
 * GET /api/dashboard
 * Protected route: requires valid JWT token via authenticateUser middleware.
 * Returns:
 *  - User profile details (excluding password)
 *  - All wallet balance and club fund details
 *  - List of currently active user packages with package meta details
 */
const getDashboard = async (req, res) => {
    const userId = req.user.id;

    try {
        // Run all queries in parallel for optimal performance
        const [userResult, walletResult, packagesResult] = await Promise.all([
            // 1. Fetch user profile (excluding sensitive password hash)
            db.execute(
                `SELECT 
                    id, 
                    phone, 
                    sponsor_id, 
                    status, 
                    role, 
                    last_active_at, 
                    accumulated_pv,
                    sp,
                    gp,
                    created_at, 
                    updated_at 
                FROM users 
                WHERE id = ?`,
                [userId]
            ),

            // 2. Fetch all wallet balances and club funds
            db.execute(
                `SELECT 
                    current_balance, 
                    total_income, 
                    daily_club_bonus, 
                    salary_club, 
                    hajj_club, 
                    shareholder_club, 
                    hajj_lottery_club, 
                    reward_point, 
                    monthly_prize_point, 
                    due_account 
                FROM wallets 
                WHERE user_id = ?`,
                [userId]
            ),

            // 3. Fetch active packages from user_packages with package meta
            db.execute(
                `SELECT 
                    up.id AS user_package_id,
                    up.package_id,
                    p.name AS package_name,
                    p.price_value,
                    p.validity_days,
                    up.status,
                    up.activated_at,
                    up.expires_at
                FROM user_packages up
                LEFT JOIN packages p ON up.package_id = p.id
                WHERE up.user_id = ? AND up.status = 'active'
                ORDER BY up.activated_at DESC`,
                [userId]
            )
        ]);

        const [users] = userResult;
        const [wallets] = walletResult;
        const [activePackages] = packagesResult;

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found.'
            });
        }

        const userProfile = users[0];

        // Format wallet with default fallbacks in case wallet row was not initialized
        const walletData = wallets.length > 0 ? wallets[0] : {
            current_balance: "0.00",
            total_income: "0.00",
            daily_club_bonus: "0.00",
            salary_club: "0.00",
            hajj_club: "0.00",
            shareholder_club: "0.00",
            hajj_lottery_club: "0.00",
            reward_point: "0.00",
            monthly_prize_point: "0.00",
            due_account: "0.00"
        };

        return res.status(200).json({
            success: true,
            message: 'Dashboard data retrieved successfully.',
            data: {
                user: userProfile,
                wallet: walletData,
                active_packages: activePackages
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching dashboard data.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = { getDashboard };
