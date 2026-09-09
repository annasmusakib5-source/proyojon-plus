const db = require('../config/db');

/**
 * GET /api/clubs
 * PRD §4: Universal Club Visibility
 * Returns all 7 club types with the user's membership status.
 */
const getClubStatus = async (req, res) => {
    const userId = req.user.id;

    // List of all clubs defined in the system
    const allClubs = [
        'daily', 
        'shareholder', 
        'hajj', 
        'hajj_lottery', 
        'salary', 
        'reward', 
        'monthly_prize'
    ];

    try {
        // Fetch user's actual memberships
        const [memberships] = await db.execute(
            'SELECT club_type, is_eligible, joined_at FROM club_memberships WHERE user_id = ?',
            [userId]
        );

        // Convert db results to a map for easy lookup
        const memberMap = {};
        memberships.forEach(m => {
            memberMap[m.club_type] = {
                is_eligible: m.is_eligible === 1,
                joined_at: m.joined_at
            };
        });

        // Build the response array ensuring all 7 clubs are represented
        const responseData = allClubs.map(club => {
            if (memberMap[club]) {
                return {
                    club_type: club,
                    is_eligible: memberMap[club].is_eligible,
                    joined_at: memberMap[club].joined_at
                };
            } else {
                return {
                    club_type: club,
                    is_eligible: false,
                    joined_at: null
                };
            }
        });

        return res.status(200).json({
            success: true,
            data: responseData
        });
    } catch (error) {
        console.error('Get Club Status Error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getClubStatus };
