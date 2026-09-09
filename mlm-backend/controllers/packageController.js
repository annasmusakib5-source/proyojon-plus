const db = require('../config/db');
const { distributeGenerationBonus, distributeShareholderReferral } = require('../services/commissionService');

/**
 * POST /api/packages/purchase
 * Protected: authenticateUser
 */
const purchasePackage = async (req, res) => {
    const { package_type } = req.body;
    const userId = req.user.id;

    // Map incoming package type to the correct string for DB lookup
    const validTypes = {
        'customer': 'Customer',
        'shareholder': 'Shareholder',
        'gold': 'Gold'
    };

    const pkgName = validTypes[package_type?.toLowerCase()];

    if (!pkgName) {
        return res.status(400).json({
            success: false,
            message: 'Invalid package_type. Must be customer, shareholder, or gold.'
        });
    }

    const connection = await db.getConnection();

    try {
        // --- BEGIN TRANSACTION ---
        await connection.beginTransaction();

        // 1. Fetch package details
        const [packages] = await connection.execute(
            'SELECT id, price_value, validity_days FROM packages WHERE name = ?',
            [pkgName]
        );

        if (packages.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ success: false, message: 'Package not found in system.' });
        }

        const packageObj = packages[0];
        const packageId = packageObj.id;
        const packagePrice = parseFloat(packageObj.price_value);
        const validityDays = packageObj.validity_days;

        // 2. Validate that user doesn't already have this exact package active
        const [existingPackages] = await connection.execute(
            'SELECT id FROM user_packages WHERE user_id = ? AND package_id = ? AND status = "active"',
            [userId, packageId]
        );

        if (existingPackages.length > 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
                success: false,
                message: `You already have an active ${pkgName} package.`
            });
        }

        // 3. Fetch user wallet with FOR UPDATE to prevent race conditions
        const [wallets] = await connection.execute(
            'SELECT current_balance FROM wallets WHERE user_id = ? FOR UPDATE',
            [userId]
        );

        if (wallets.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ success: false, message: 'Wallet not found.' });
        }

        const currentBalance = parseFloat(wallets[0].current_balance);

        if (currentBalance < packagePrice) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. ${pkgName} package costs ${packagePrice}, but you have ${currentBalance}.`
            });
        }

        // 4. Calculate expires_at and countdown_end_date based on package type
        let expiresAt = null;
        let countdownEndDate = null;

        if (pkgName === 'Customer') {
            expiresAt = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // +30 days
        } else if (pkgName === 'Gold') {
            expiresAt = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)); // +365 days
            countdownEndDate = expiresAt;
        }
        // Shareholder has no expiry

        // 5. Deduct amount from wallet
        await connection.execute(
            'UPDATE wallets SET current_balance = current_balance - ? WHERE user_id = ?',
            [packagePrice, userId]
        );

        // 6. Insert row into user_packages
        const [insertResult] = await connection.execute(
            `INSERT INTO user_packages (user_id, package_id, status, activated_at, expires_at, countdown_end_date)
             VALUES (?, ?, 'active', NOW(), ?, ?)`,
            [userId, packageId, expiresAt, countdownEndDate]
        );
        const userPackageId = insertResult.insertId;

        // 7. Check if this is their first active package, if so update user status to active
        const [allUserPackages] = await connection.execute(
            'SELECT count(id) as cnt FROM user_packages WHERE user_id = ? AND status = "active"',
            [userId]
        );

        if (allUserPackages[0].cnt === 1) { // This is the first active package
            await connection.execute(
                'UPDATE users SET status = "active", updated_at = NOW() WHERE id = ?',
                [userId]
            );
        }

        // 8. Log the purchase in transactions
        await connection.execute(
            `INSERT INTO transactions (user_id, amount, type, category, description, wallet_field, reference_id, created_at)
             VALUES (?, ?, 'debit', 'deposit', ?, 'current_balance', ?, NOW())`,
            [userId, packagePrice, `Purchased ${pkgName} package`, userPackageId]
        );

        // 9. Log activity
        await connection.execute(
            `INSERT INTO user_activity_logs (user_id, action, ip_address, description, created_at) 
             VALUES (?, 'PACKAGE_PURCHASE', ?, ?, NOW())`,
            [userId, req.ip || 'unknown', `Purchased ${pkgName} package for ${packagePrice}`]
        );

        // --- TRIGGER COMMISSIONS ---
        // 10. Trigger 5% Generation Bonus (Hajj Club)
        // PV is 1000 for Customer, 5000 for Gold/Shareholder (same as price_value based on PRD)
        if (pkgName === 'Customer') {
            await distributeGenerationBonus(connection, userId, packagePrice);
        }

        // 11. Trigger 2.5% Referral Commission for Shareholder
        if (pkgName === 'Shareholder') {
            await distributeShareholderReferral(connection, userId, packagePrice);
        }

        // --- COMMIT TRANSACTION ---
        await connection.commit();
        connection.release();

        return res.status(201).json({
            success: true,
            message: `${pkgName} package activated successfully!`,
            data: {
                package_id: packageId,
                package_name: pkgName,
                price: packagePrice,
                expires_at: expiresAt
            }
        });

    } catch (error) {
        await connection.rollback();
        connection.release();

        console.error('Package Purchase Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred while processing package purchase.'
        });
    }
};



/**
 * POST /api/packages/:id/cancel
 * Protected: authenticateUser
 * PRD §2C: Gold Package Cancellation (pay off due_account)
 */
const cancelGoldPackage = async (req, res) => {
    const packageId = req.params.id;
    const userId = req.user.id;

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Verify this is an active Gold package owned by the user
        const [packages] = await connection.execute(
            `SELECT up.id, p.name 
             FROM user_packages up
             JOIN packages p ON up.package_id = p.id
             WHERE up.id = ? AND up.user_id = ? AND up.status = 'active'`,
            [packageId, userId]
        );

        if (packages.length === 0 || packages[0].name !== 'Gold') {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'Invalid package or the package is not an active Gold package.'
            });
        }

        // 2. Fetch the user's due_account and current_balance with lock
        const [wallets] = await connection.execute(
            'SELECT current_balance, due_account FROM wallets WHERE user_id = ? FOR UPDATE',
            [userId]
        );

        if (wallets.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ success: false, message: 'Wallet not found.' });
        }

        const currentBalance = parseFloat(wallets[0].current_balance);
        const dueAccount = parseFloat(wallets[0].due_account);

        // 3. Check if user has enough current_balance to pay off the due_account
        if (currentBalance < dueAccount) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
                success: false,
                message: `Insufficient balance to cancel. You need ${dueAccount} to pay off your due account.`
            });
        }

        // 4. Deduct due_account amount from current_balance and reset due_account
        await connection.execute(
            'UPDATE wallets SET current_balance = current_balance - ?, due_account = 0 WHERE user_id = ?',
            [dueAccount, userId]
        );

        // 5. Cancel the package
        await connection.execute(
            'UPDATE user_packages SET status = "canceled" WHERE id = ?',
            [packageId]
        );

        // 6. Log transaction
        if (dueAccount > 0) {
            await connection.execute(
                `INSERT INTO transactions (user_id, amount, type, category, description, wallet_field, reference_id, created_at)
                 VALUES (?, ?, 'debit', 'due_account_penalty', 'Paid off due account for Gold cancellation', 'current_balance', ?, NOW())`,
                [userId, dueAccount, packageId]
            );
        }

        // 7. Log activity
        await connection.execute(
            `INSERT INTO user_activity_logs (user_id, action, ip_address, description, created_at) 
             VALUES (?, 'GOLD_CANCELLATION', ?, ?, NOW())`,
            [userId, req.ip || 'unknown', `Canceled Gold Package ID: ${packageId}, Paid due: ${dueAccount}`]
        );

        await connection.commit();
        connection.release();

        return res.status(200).json({
            success: true,
            message: 'Gold Package canceled successfully. Due account has been cleared.'
        });

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Cancel Gold Package Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred while canceling the package.'
        });
    }
};

/**
 * GET /api/packages
 * Protected: authenticateUser
 * View logged-in user's packages
 */
const getUserPackages = async (req, res) => {
    const userId = req.user.id;

    try {
        const [packages] = await db.execute(
            `SELECT 
                up.id AS user_package_id,
                p.name AS package_name,
                p.price_value AS price,
                up.status,
                up.activated_at,
                up.expires_at,
                up.countdown_end_date,
                up.monthly_accumulated_pv
             FROM user_packages up
             JOIN packages p ON up.package_id = p.id
             WHERE up.user_id = ?
             ORDER BY up.activated_at DESC`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            message: 'Packages retrieved successfully.',
            data: packages
        });
    } catch (error) {
        console.error('Get User Packages Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred while retrieving your packages.'
        });
    }
};

module.exports = { purchasePackage, cancelGoldPackage, getUserPackages };
