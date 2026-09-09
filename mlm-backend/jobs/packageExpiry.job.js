const cron = require('node-cron');
const db = require('../config/db');

/**
 * 6.3 Customer Package Expiry Check
 * Runs daily at midnight 00:00 AM (Asia/Dhaka)
 * Reactivates package if accumulated PV >= 100, else expires it.
 */
const startPackageExpiryJob = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('Running Customer Package Expiry Check...');

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Find all active Customer packages whose expires_at is in the past
            const [expiredPackages] = await connection.execute(`
                SELECT up.id, up.user_id, u.accumulated_pv as pv 
                FROM user_packages up
                JOIN packages p ON up.package_id = p.id
                JOIN users u ON up.user_id = u.id
                WHERE p.name = 'Customer' AND up.status = 'active' AND up.expires_at <= NOW()
            `);

            let expiredCount = 0;
            let reactivatedCount = 0;

            for (const pkg of expiredPackages) {
                const { id: packageId, user_id: userId, monthly_accumulated_pv: pv } = pkg;

                if (pv >= 100) {
                    // Reactivate
                    await connection.execute(`
                        UPDATE user_packages 
                        SET expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY) 
                        WHERE id = ?
                    `, [packageId]);

                    await connection.execute(`
                        INSERT INTO user_activity_logs (user_id, action, ip_address, description, created_at)
                        VALUES (?, 'PACKAGE_REACTIVATED', 'system', 'Customer Package automatically reactivated (100 PV)', NOW())
                    `, [userId]);
                    
                    reactivatedCount++;
                } else {
                    // Expire
                    await connection.execute(`UPDATE user_packages SET status = 'expired' WHERE id = ?`, [packageId]);

                    // Package Independence: Check if user has ANY other active packages
                    const [activeOthers] = await connection.execute(`
                        SELECT count(id) as cnt FROM user_packages WHERE user_id = ? AND status = 'active'
                    `, [userId]);

                    if (activeOthers[0].cnt === 0) {
                        // User has no other active packages, mark user as inactive
                        await connection.execute(`UPDATE users SET status = 'inactive' WHERE id = ?`, [userId]);
                    }

                    await connection.execute(`
                        INSERT INTO user_activity_logs (user_id, action, ip_address, description, created_at)
                        VALUES (?, 'PACKAGE_EXPIRED', 'system', 'Customer Package expired (PV < 100)', NOW())
                    `, [userId]);

                    expiredCount++;
                }
            }

            console.log(`Package Expiry Job Finished. Expired: ${expiredCount}, Reactivated: ${reactivatedCount}`);

            await connection.commit();
            connection.release();
        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error('Package Expiry Job Error:', error.message);
        }
    }, {
        timezone: "Asia/Dhaka"
    });
};

module.exports = { startPackageExpiryJob };
