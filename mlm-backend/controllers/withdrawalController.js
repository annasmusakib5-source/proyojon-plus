const db = require('../config/db');

// POST /api/withdraw
const requestWithdrawal = async (req, res) => {
    const { amount, method, account_details } = req.body;
    const userId = req.user.id; // Extracted from authMiddleware

    // --- Validation ---
    if (!amount || amount <= 0) {
        return res.status(400).json({
            success: false,
            message: 'A valid withdrawal amount is required.'
        });
    }

    if (!method || !['Bank', 'bKash', 'Nagad', 'Rocket'].includes(method)) {
        return res.status(400).json({
            success: false,
            message: 'Valid payment method (Bank, bKash, Nagad, Rocket) is required.'
        });
    }

    if (!account_details) {
        return res.status(400).json({
            success: false,
            message: 'Account details are required.'
        });
    }

    const connection = await db.getConnection();

    try {
        // --- BEGIN TRANSACTION ---
        await connection.beginTransaction();

        // 1. Fetch current_balance with Row-Level Lock (FOR UPDATE) to prevent race conditions (double spending)
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
        const withdrawalAmount = parseFloat(amount);

        // 2. Check if balance is sufficient
        if (currentBalance < withdrawalAmount) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Your current balance is ${currentBalance}.`
            });
        }

        // 3. Calculate 5% flat charge and net payable
        const charge = withdrawalAmount * 0.05;
        const netPayable = withdrawalAmount - charge;

        // 4. Deduct amount from wallet's current_balance
        const newBalance = currentBalance - withdrawalAmount;
        await connection.execute(
            'UPDATE wallets SET current_balance = ? WHERE user_id = ?',
            [newBalance, userId]
        );

        // 5. Insert record into `withdrawals` table (Status: 'pending' by default based on schema)
        const [withdrawalResult] = await connection.execute(
            `INSERT INTO withdrawals (user_id, amount, charge, net_payable, method, account_details, status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
            [userId, withdrawalAmount, charge, netPayable, method, account_details]
        );

        const withdrawalId = withdrawalResult.insertId;

        // 6. Log transaction into `transactions` ledger
        await connection.execute(
            `INSERT INTO transactions (user_id, amount, type, category, description, reference_id, created_at)
             VALUES (?, ?, 'debit', 'withdrawal', 'Withdrawal request placed', ?, NOW())`,
            [userId, withdrawalAmount, withdrawalId]
        );

        // 7. Log activity for Audit
        await connection.execute(
            `INSERT INTO user_activity_logs (user_id, action, ip_address, description, created_at) 
             VALUES (?, 'WITHDRAWAL_REQUEST', ?, ?, NOW())`,
            [userId, req.ip || 'unknown', `Requested withdrawal of ${withdrawalAmount} via ${method}`]
        );

        // --- COMMIT TRANSACTION ---
        await connection.commit();
        connection.release();

        return res.status(201).json({
            success: true,
            message: 'Withdrawal request placed successfully.',
            data: {
                withdrawal_id: withdrawalId,
                requested_amount: withdrawalAmount,
                charge_5_percent: charge,
                net_payable: netPayable,
                method: method,
                status: 'pending'
            }
        });

    } catch (error) {
        // --- ROLLBACK ON ANY ERROR ---
        await connection.rollback();
        connection.release();

        console.error('Withdrawal Request Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred while processing withdrawal.'
        });
    }
};

module.exports = { requestWithdrawal };
