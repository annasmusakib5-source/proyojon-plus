const db = require('../config/db');

/**
 * GET /api/network?level=1
 * Protected: authenticateUser
 * PRD §4: Network generation tree (Table format, up to 5 levels)
 */
const getNetwork = async (req, res) => {
    const userId = req.user.id;
    const targetLevel = parseInt(req.query.level) || 1;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    if (targetLevel < 1 || targetLevel > 5) {
        return res.status(400).json({
            success: false,
            message: 'Invalid level. Must be between 1 and 5.'
        });
    }

    try {
        let currentLevelIds = [userId];
        
        // Traverse down the network to the target level
        for (let i = 1; i <= targetLevel; i++) {
            if (currentLevelIds.length === 0) break; // No more downline

            // Construct placeholders like ?,?,?
            const placeholders = currentLevelIds.map(() => '?').join(',');
            const [users] = await db.execute(
                `SELECT id FROM users WHERE sponsor_id IN (${placeholders})`,
                currentLevelIds
            );
            
            currentLevelIds = users.map(u => u.id);
        }

        if (currentLevelIds.length === 0) {
            return res.status(200).json({
                success: true,
                message: `No network found at level ${targetLevel}.`,
                data: [],
                pagination: { total: 0, page, limit, totalPages: 0 }
            });
        }

        // Now we have the IDs of the users at the target level. Fetch their details with pagination.
        const offset = (page - 1) * limit;
        const placeholders = currentLevelIds.map(() => '?').join(',');

        // 1. Fetch total count for pagination
        const [countResult] = await db.execute(
            `SELECT count(id) as total FROM users WHERE id IN (${placeholders})`,
            currentLevelIds
        );
        const total = countResult[0].total;

        // 2. Fetch paginated users
        // Since we need to join with active packages, we use GROUP_CONCAT to get package names
        const queryParams = [...currentLevelIds, limit.toString(), offset.toString()];
        const [networkUsers] = await db.execute(
            `SELECT 
                u.id, u.phone, u.status, u.created_at as joined_date,
                GROUP_CONCAT(p.name SEPARATOR ', ') as active_packages
             FROM users u
             LEFT JOIN user_packages up ON u.id = up.user_id AND up.status = 'active'
             LEFT JOIN packages p ON up.package_id = p.id
             WHERE u.id IN (${placeholders})
             GROUP BY u.id
             ORDER BY u.created_at DESC
             LIMIT ? OFFSET ?`,
            queryParams
        );

        return res.status(200).json({
            success: true,
            message: `Network level ${targetLevel} retrieved successfully.`,
            data: networkUsers,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get Network Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred while retrieving network.'
        });
    }
};

module.exports = { getNetwork };
