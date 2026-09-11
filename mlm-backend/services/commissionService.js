/**
 * Commission Service
 * Handles complex business logic for MLM distribution and referrals.
 */

/**
 * 2.3 Distribute 5% Generation Bonus (1% × 5 Levels → Hajj Club AND Current Balance)
 * @param {import('mysql2/promise').Connection} connection - The active transaction connection
 * @param {number} buyerUserId - The ID of the user who bought the package
 * @param {number} pvAmount - The Point Value of the package
 */
const distributeGenerationBonus = async (connection, buyerUserId, pvAmount) => {
    // 1% of the PV amount per level
    const bonusAmount = parseFloat((pvAmount * 0.01).toFixed(2));
    
    if (bonusAmount <= 0) return;

    // Find admin user to credit undistributed bonuses
    const [admins] = await connection.execute("SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1");
    const adminId = admins.length > 0 ? admins[0].id : null;

    let currentUserId = buyerUserId;
    let level = 1;

    // Traverse up to 5 levels
    while (level <= 5) {
        let creditedTo = null;
        let sponsorId = null;

        // Find the sponsor of the current user
        const [users] = await connection.execute(
            'SELECT sponsor_id FROM users WHERE id = ?',
            [currentUserId]
        );

        if (users.length > 0 && users[0].sponsor_id) {
            sponsorId = users[0].sponsor_id;

            // Check if sponsor is active
            const [sponsors] = await connection.execute(
                "SELECT id, status FROM users WHERE id = ?",
                [sponsorId]
            );

            if (sponsors.length > 0 && sponsors[0].status === 'active') {
                // Credit to Hajj Club
                await connection.execute(
                    'UPDATE wallets SET hajj_club = hajj_club + ?, current_balance = current_balance + ?, total_income = total_income + ? WHERE user_id = ?',
                    [bonusAmount, bonusAmount, bonusAmount, sponsorId]
                );

                // Log Transaction for Hajj Club
                await connection.execute(
                    `INSERT INTO transactions (user_id, amount, type, category, description, wallet_field, created_at)
                     VALUES (?, ?, 'credit', 'generation_bonus', ?, 'hajj_club', NOW())`,
                    [
                        sponsorId, 
                        bonusAmount, 
                        `Generation bonus (Level ${level}) to Hajj Fund from User ${buyerUserId}`
                    ]
                );

                // Log Transaction for Current Balance
                await connection.execute(
                    `INSERT INTO transactions (user_id, amount, type, category, description, wallet_field, created_at)
                     VALUES (?, ?, 'credit', 'generation_bonus', ?, 'current_balance', NOW())`,
                    [
                        sponsorId, 
                        bonusAmount, 
                        `Standard Generation bonus (Level ${level}) from User ${buyerUserId}`
                    ]
                );
                
                creditedTo = sponsorId;
            }
            
            // Move up the chain
            currentUserId = sponsorId;
        }

        // If no active sponsor was found for this level, credit it to the company (Admin)
        if (!creditedTo && adminId) {
            await connection.execute(
                'UPDATE wallets SET current_balance = current_balance + ?, total_income = total_income + ? WHERE user_id = ?',
                [bonusAmount, bonusAmount, adminId]
            );
            await connection.execute(
                `INSERT INTO transactions (user_id, amount, type, category, description, wallet_field, created_at)
                 VALUES (?, ?, 'credit', 'generation_bonus', ?, 'current_balance', NOW())`,
                [
                    adminId, 
                    bonusAmount, 
                    `Company Generation Commission (Level ${level} missed) from User ${buyerUserId}`
                ]
            );
        }

        level++;
    }
};

/**
 * 2.4 Shareholder 2.5% Instant Referral Commission
 * @param {import('mysql2/promise').Connection} connection - The active transaction connection
 * @param {number} buyerUserId - The ID of the user who bought the package
 * @param {number} spAmount - The package price (SP - Shareholder Price)
 */
const distributeShareholderReferral = async (connection, buyerUserId, spAmount) => {
    const commissionAmount = parseFloat((spAmount * 0.025).toFixed(2));

    if (commissionAmount <= 0) return;

    // Find admin user to credit undistributed bonuses
    const [admins] = await connection.execute("SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1");
    const adminId = admins.length > 0 ? admins[0].id : null;

    let creditedTo = null;

    // Find the buyer's direct sponsor
    const [users] = await connection.execute(
        'SELECT sponsor_id FROM users WHERE id = ?',
        [buyerUserId]
    );

    if (users.length > 0 && users[0].sponsor_id) {
        const sponsorId = users[0].sponsor_id;

        // Check if sponsor is active
        const [sponsors] = await connection.execute(
            "SELECT id, status FROM users WHERE id = ?",
            [sponsorId]
        );

        if (sponsors.length > 0 && sponsors[0].status === 'active') {
            // Credit to current_balance AND increase total_income
            await connection.execute(
                `UPDATE wallets 
                 SET current_balance = current_balance + ?, 
                     total_income = total_income + ? 
                 WHERE user_id = ?`,
                [commissionAmount, commissionAmount, sponsorId]
            );

            // Log Transaction
            await connection.execute(
                `INSERT INTO transactions (user_id, amount, type, category, description, wallet_field, created_at)
                 VALUES (?, ?, 'credit', 'referral_bonus', ?, 'current_balance', NOW())`,
                [
                    sponsorId, 
                    commissionAmount, 
                    `Shareholder referral bonus from User ${buyerUserId}`
                ]
            );
            
            creditedTo = sponsorId;
        }
    }

    // If no active sponsor found, credit it to the company (Admin)
    if (!creditedTo && adminId) {
        await connection.execute(
            `UPDATE wallets 
             SET current_balance = current_balance + ?, 
                 total_income = total_income + ? 
             WHERE user_id = ?`,
            [commissionAmount, commissionAmount, adminId]
        );
        await connection.execute(
            `INSERT INTO transactions (user_id, amount, type, category, description, wallet_field, created_at)
             VALUES (?, ?, 'credit', 'referral_bonus', ?, 'current_balance', NOW())`,
            [
                adminId, 
                commissionAmount, 
                `Company Shareholder Referral Commission (Sponsor missed) from User ${buyerUserId}`
            ]
        );
    }
};

/**
 * 2.5 Global PV Distribution Formula (Auto Trigger)
 * Distributes a specific PV amount across the 7 global clubs to all eligible members.
 * @param {import('mysql2/promise').Connection} connection - The active transaction connection
 * @param {number} basePv - The total PV to distribute
 * @param {number} sourceUserId - The user who triggered this (e.g., buyer or admin)
 * @param {string} referenceId - The order ID or reference
 */
const distributeGlobalPV = async (connection, basePv, sourceUserId, referenceId = 'auto') => {
    if (basePv <= 0) return;

    // 1. Calculate Portions (Total 60%)
    const portions = {
        daily_club: basePv * 0.20,
        shareholder_club: basePv * 0.10,
        hajj_club: basePv * 0.10,
        reward_point: basePv * 0.07,
        monthly_prize: basePv * 0.05,
        hajj_lottery: basePv * 0.05,
        salary_club: basePv * 0.03,
    };

    // 2. Fetch Eligible Members
    const [activeUsers] = await connection.execute("SELECT id FROM users WHERE status = 'active'");
    const activeUserIds = activeUsers.map(u => u.id);

    const [shareholders] = await connection.execute(
        `SELECT DISTINCT up.user_id as id 
         FROM user_packages up 
         JOIN packages p ON up.package_id = p.id 
         WHERE p.name = 'Shareholder' AND up.status = 'active'`
    );
    const shareholderUserIds = shareholders.map(u => u.id);

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
            await connection.execute(
                `UPDATE wallets SET ${walletField} = ${walletField} + ?, current_balance = current_balance + ?, total_income = total_income + ? WHERE user_id = ?`,
                [amountPerUser, amountPerUser, amountPerUser, uid]
            );
            await connection.execute(
                `INSERT INTO transactions (user_id, amount, type, category, description, wallet_field, created_at)
                 VALUES (?, ?, 'credit', 'club_bonus', ?, ?, NOW())`,
                [uid, amountPerUser, `Auto-distributed PV share from Order/Package ${referenceId}`, walletField]
            );
        }
    };

    // 4. Distribute to all clubs
    await distributeToClub(activeUserIds, portions.daily_club, 'daily_club_bonus');
    await distributeToClub(shareholderUserIds, portions.shareholder_club, 'shareholder_club');
    await distributeToClub(activeUserIds, portions.hajj_club, 'hajj_club');
    await distributeToClub(activeUserIds, portions.reward_point, 'reward_point');
    await distributeToClub(activeUserIds, portions.monthly_prize, 'monthly_prize_point');
    await distributeToClub(activeUserIds, portions.hajj_lottery, 'hajj_lottery_club');
    await distributeToClub(salaryUserIds, portions.salary_club, 'salary_club');

    // 5. Log Distribution History
    await connection.execute(
        `INSERT INTO club_distribution_history 
         (triggered_by, total_pv_distributed, daily_club_amount, shareholder_club_amount, hajj_club_amount, 
          reward_point_amount, monthly_prize_amount, hajj_lottery_amount, salary_club_amount, eligible_member_counts, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
            sourceUserId, basePv, portions.daily_club, portions.shareholder_club, portions.hajj_club,
            portions.reward_point, portions.monthly_prize, portions.hajj_lottery, portions.salary_club,
            JSON.stringify(memberCounts)
        ]
    );
};

module.exports = {
    distributeGenerationBonus,
    distributeShareholderReferral,
    distributeGlobalPV
};
