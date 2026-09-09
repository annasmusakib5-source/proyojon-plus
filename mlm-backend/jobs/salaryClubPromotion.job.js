const cron = require('node-cron');
const db = require('../config/db');

/**
 * 6.4 Salary Club Auto-Promotion
 * Runs daily at 00:05 AM (Asia/Dhaka)
 * Adds users to Salary Club if they have >= 15 direct active Customer referrals
 */
const startSalaryClubPromotionJob = () => {
    cron.schedule('5 0 * * *', async () => {
        console.log('Running Salary Club Auto-Promotion...');

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Find all active users and count their direct referrals with >= 1000 accumulated PV
            const [eligibleUsers] = await connection.execute(`
                SELECT u.id as sponsor_id, COUNT(ref.id) as qualifying_referrals
                FROM users u
                JOIN users ref ON ref.sponsor_id = u.id
                WHERE u.status = 'active' AND ref.accumulated_pv >= 1000
                GROUP BY u.id
                HAVING COUNT(ref.id) >= 15
            `);

            let promotedCount = 0;

            for (const user of eligibleUsers) {
                const sponsorId = user.sponsor_id;

                // Check if they are already in the salary club
                const [existingMemberships] = await connection.execute(`
                    SELECT id FROM club_memberships 
                    WHERE user_id = ? AND club_type = 'salary'
                `, [sponsorId]);

                if (existingMemberships.length === 0) {
                    // Promote to Salary Club
                    await connection.execute(`
                        INSERT INTO club_memberships (user_id, club_type, is_eligible, joined_at)
                        VALUES (?, 'salary', true, NOW())
                    `, [sponsorId]);

                    // Log in user_activity_logs
                    await connection.execute(`
                        INSERT INTO user_activity_logs (user_id, action, ip_address, description, created_at)
                        VALUES (?, 'CLUB_ACHIEVEMENT', 'system', 'Promoted to Salary Club (15+ Active Customer Referrals)', NOW())
                    `, [sponsorId]);

                    promotedCount++;
                }
            }

            console.log(`Salary Club Promotion Job Finished. Users promoted: ${promotedCount}`);

            await connection.commit();
            connection.release();
        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error('Salary Club Promotion Job Error:', error.message);
        }
    }, {
        timezone: "Asia/Dhaka"
    });
};

module.exports = { startSalaryClubPromotionJob };
