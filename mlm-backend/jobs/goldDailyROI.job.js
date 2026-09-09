const cron = require('node-cron');
const db = require('../config/db');

// Schedule job to run every day at 00:01 AM
const startGoldDailyDripJob = () => {
    cron.schedule('1 0 * * *', async () => {
        console.log('[CRON] Starting Gold Daily Drip Job at', new Date().toISOString());
        let connection;

        try {
            connection = await db.getConnection();
            
            // 1. Get the Gold Package ID and its price
            const [packages] = await connection.execute(
                'SELECT id, price_value FROM packages WHERE name = "Gold" LIMIT 1'
            );

            if (packages.length === 0) {
                console.error('[CRON] Gold package not found in database.');
                connection.release();
                return;
            }

            const goldPackageId = packages[0].id;
            const goldPrice = parseFloat(packages[0].price_value);
            
            // Referrer: 1.8% of GP / 365
            const totalReferrerCommission = goldPrice * 0.018; 
            const dailyReferrerAmount = parseFloat((totalReferrerCommission / 365).toFixed(4)); 
            
            // Buyer: 36% of 100,000 GP / 365
            const totalBuyerIncome = 100000 * 0.36;
            const dailyBuyerAmount = parseFloat((totalBuyerIncome / 365).toFixed(4));

            // 2. Find all active Gold packages and their sponsors
            // We join users to get the sponsor_id of the person who bought the package
            const [activeGoldPackages] = await connection.execute(
                `SELECT up.id as user_package_id, up.user_id as buyer_id, u.sponsor_id as referrer_id, up.activated_at 
                 FROM user_packages up
                 JOIN users u ON up.user_id = u.id
                 WHERE up.package_id = ? AND up.status = 'active'`,
                [goldPackageId]
            );

            if (activeGoldPackages.length === 0) {
                console.log('[CRON] No active Gold packages found for daily drip.');
                connection.release();
                return;
            }

            console.log(`[CRON] Processing ${activeGoldPackages.length} active Gold packages...`);

            // --- BEGIN TRANSACTION ---
            await connection.beginTransaction();

            for (const pkg of activeGoldPackages) {
                const referrerId = pkg.referrer_id;
                const buyerId = pkg.buyer_id;

                // --- 1. REFERRER COMMISSION (365 DAYS) ---
                if (referrerId) {
                    await connection.execute(
                        'UPDATE wallets SET current_balance = current_balance + ? WHERE user_id = ?',
                        [dailyReferrerAmount, referrerId]
                    );

                    await connection.execute(
                        `INSERT INTO transactions 
                        (user_id, amount, type, category, description, wallet_field, reference_id, created_at)
                        VALUES (?, ?, 'credit', 'gold_daily_drip', ?, 'current_balance', ?, NOW())`,
                        [
                            referrerId, 
                            dailyReferrerAmount, 
                            `Daily Gold Drip Commission for referral User ID ${buyerId}`, 
                            pkg.user_package_id
                        ]
                    );
                }

                // --- 2. BUYER INCOME/DUE (365 DAYS) ---
                await connection.execute(
                    'UPDATE wallets SET due_account = due_account + ? WHERE user_id = ?',
                    [dailyBuyerAmount, buyerId]
                );

                await connection.execute(
                    `INSERT INTO transactions 
                    (user_id, amount, type, category, description, wallet_field, reference_id, created_at)
                    VALUES (?, ?, 'credit', 'gold_daily_drip', ?, 'due_account', ?, NOW())`,
                    [
                        buyerId, 
                        dailyBuyerAmount, 
                        `Daily Gold ROI (Due Account)`, 
                        pkg.user_package_id
                    ]
                );
            }

            // --- COMMIT TRANSACTION ---
            await connection.commit();
            console.log(`[CRON] Successfully distributed daily drip to referrers.`);

        } catch (error) {
            console.error('[CRON] Error executing Gold Daily Drip Job:', error.message);
            if (connection) {
                try {
                    await connection.rollback();
                    console.log('[CRON] Transaction rolled back.');
                } catch (rollbackError) {
                    console.error('[CRON] Rollback failed:', rollbackError.message);
                }
            }
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }, {
        scheduled: true,
        timezone: "Asia/Dhaka" // Ensuring the midnight trigger happens according to BD time
    });

    console.log('Cron Job initialized: Gold Daily Drip (Runs at 00:01 AM Asia/Dhaka)');
};

module.exports = { startGoldDailyDripJob };
