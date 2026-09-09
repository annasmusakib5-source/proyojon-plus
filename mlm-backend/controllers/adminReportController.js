const db = require('../config/db');

/**
 * GET /api/admin/reports/sales
 * Aggregate total package sales
 */
const getSalesReport = async (req, res) => {
    try {
        const [sales] = await db.execute(`
            SELECT 
                p.name AS package_name, 
                COUNT(up.id) AS total_sold, 
                SUM(p.price_value) AS total_revenue
            FROM user_packages up
            JOIN packages p ON up.package_id = p.id
            GROUP BY p.name
        `);

        return res.status(200).json({ success: true, data: sales });
    } catch (error) {
        console.error('Sales Report Error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /api/admin/reports/withdrawals
 * Total withdrawals grouped by status and method.
 * Supports ?start_date=YYYY-MM-DD & ?end_date=YYYY-MM-DD
 */
const getWithdrawalsReport = async (req, res) => {
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    let queryParams = [];

    if (start_date && end_date) {
        dateFilter = 'WHERE created_at BETWEEN ? AND ?';
        queryParams.push(`${start_date} 00:00:00`, `${end_date} 23:59:59`);
    }

    try {
        const [report] = await db.execute(`
            SELECT 
                status, 
                method, 
                COUNT(id) AS total_requests, 
                SUM(amount) AS total_amount, 
                SUM(charge) AS total_charge, 
                SUM(net_payable) AS total_net_payable
            FROM withdrawals
            ${dateFilter}
            GROUP BY status, method
        `, queryParams);

        return res.status(200).json({ success: true, data: report });
    } catch (error) {
        console.error('Withdrawals Report Error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /api/admin/reports/clubs
 * Club fund distribution history summary
 */
const getClubsReport = async (req, res) => {
    try {
        const [report] = await db.execute(`
            SELECT 
                COUNT(id) AS total_distributions,
                SUM(total_pv_distributed) AS total_pv,
                SUM(daily_club_amount) AS total_daily_club,
                SUM(shareholder_club_amount) AS total_shareholder,
                SUM(hajj_club_amount) AS total_hajj,
                SUM(reward_point_amount) AS total_reward,
                SUM(monthly_prize_amount) AS total_monthly_prize,
                SUM(hajj_lottery_amount) AS total_hajj_lottery,
                SUM(salary_club_amount) AS total_salary
            FROM club_distribution_history
        `);

        return res.status(200).json({ success: true, data: report[0] });
    } catch (error) {
        console.error('Clubs Report Error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /api/admin/reports/users
 * User statistics
 */
const getUsersReport = async (req, res) => {
    try {
        // Status counts
        const [statusCounts] = await db.execute(`
            SELECT status, COUNT(id) AS count
            FROM users
            GROUP BY status
        `);

        // Registration stats
        const [dailyReg] = await db.execute(`
            SELECT COUNT(id) AS count FROM users 
            WHERE DATE(created_at) = CURDATE()
        `);
        
        // MySQL YEARWEEK / MONTH syntax
        const [weeklyReg] = await db.execute(`
            SELECT COUNT(id) AS count FROM users 
            WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)
        `);

        const [monthlyReg] = await db.execute(`
            SELECT COUNT(id) AS count FROM users 
            WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())
        `);

        return res.status(200).json({ 
            success: true, 
            data: {
                status_breakdown: statusCounts,
                registrations: {
                    today: dailyReg[0].count,
                    this_week: weeklyReg[0].count,
                    this_month: monthlyReg[0].count
                }
            } 
        });
    } catch (error) {
        console.error('Users Report Error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /api/admin/reports/due-accounts
 * List of Gold Package users with their due_account balances
 */
const getDueAccountsReport = async (req, res) => {
    try {
        const [report] = await db.execute(`
            SELECT 
                u.id AS user_id, 
                u.phone, 
                w.due_account,
                up.activated_at AS gold_activation_date
            FROM users u
            JOIN wallets w ON u.id = w.user_id
            JOIN user_packages up ON u.id = up.user_id
            JOIN packages p ON up.package_id = p.id
            WHERE p.name = 'Gold' AND up.status = 'active' AND w.due_account > 0
            ORDER BY w.due_account DESC
        `);

        return res.status(200).json({ success: true, data: report });
    } catch (error) {
        console.error('Due Accounts Report Error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getSalesReport,
    getWithdrawalsReport,
    getClubsReport,
    getUsersReport,
    getDueAccountsReport
};
