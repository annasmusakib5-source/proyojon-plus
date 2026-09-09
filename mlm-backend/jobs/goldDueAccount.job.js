const cron = require('node-cron');
const db = require('../config/db');

/**
 * 6.2 Gold Due Account Updater
 * Runs daily at 00:02 AM (Asia/Dhaka)
 * Adds 98.63 (approx 36% of 100,000 / 365) to Gold users' due_account
 */
const startGoldDueAccountJob = () => {
    cron.schedule('2 0 * * *', async () => {
        console.log('Running Gold Due Account Updater...');

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Find all active Gold packages
            const [goldPackages] = await connection.execute(`
                SELECT up.user_id, up.id as package_id 
                FROM user_packages up
                JOIN packages p ON up.package_id = p.id
                WHERE p.name = 'Gold' AND up.status = 'active'
            `);

            if (goldPackages.length > 0) {
                const dailyDue = 98.63;

                for (const pkg of goldPackages) {
                    const userId = pkg.user_id;

                    // Update wallet due_account
                    await connection.execute(
                        'UPDATE wallets SET due_account = due_account + ? WHERE user_id = ?',
                        [dailyDue, userId]
                    );

                    // Log transaction
                    await connection.execute(
                        `INSERT INTO transactions (user_id, amount, type, category, description, wallet_field, reference_id, created_at)
                         VALUES (?, ?, 'debit', 'due_account_penalty', 'Daily Gold due account penalty', 'due_account', ?, NOW())`,
                        [userId, dailyDue, pkg.package_id]
                    );
                }
                console.log(`Updated due_account for ${goldPackages.length} Gold packages.`);
            } else {
                console.log('No active Gold packages found.');
            }

            await connection.commit();
            connection.release();
        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error('Gold Due Account Job Error:', error.message);
        }
    }, {
        timezone: "Asia/Dhaka"
    });
};

module.exports = { startGoldDueAccountJob };
