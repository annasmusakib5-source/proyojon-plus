const db = require('../config/db');

/**
 * POST /api/wallet/transfer
 * Protected: authenticateUser
 * PRD §4 / DFT 4.2: ID-to-ID Fund Transfer
 */
const transferFunds = async (req, res) => {
    const senderId = req.user.id;
    const { receiver_id, amount } = req.body;

    const transferAmount = parseFloat(amount);

    // --- Validation ---
    if (!receiver_id || !transferAmount || transferAmount <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Valid receiver_id and amount (greater than 0) are required.'
        });
    }

    if (senderId === parseInt(receiver_id)) {
        return res.status(400).json({
            success: false,
            message: 'You cannot transfer funds to yourself.'
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Check if receiver exists (by ID or Phone)
        const parsedId = Number(receiver_id);
        const isNumericId = !isNaN(parsedId) && parsedId > 0 && parsedId < 2147483647;

        const [receivers] = await connection.execute(
            `SELECT id, phone, status FROM users WHERE phone = ? ${isNumericId ? 'OR id = ?' : ''}`,
            isNumericId ? [receiver_id, parsedId] : [receiver_id]
        );

        if (receivers.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ success: false, message: 'Receiver not found. Check the ID or Phone Number.' });
        }

        const receiver = receivers[0];
        const actualReceiverId = receiver.id;

        if (senderId === actualReceiverId) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ success: false, message: 'You cannot transfer funds to yourself.' });
        }

        // 2. Lock both sender and receiver wallet rows using SELECT ... FOR UPDATE
        // To prevent deadlocks, always lock the smaller ID first
        const firstId = senderId < actualReceiverId ? senderId : actualReceiverId;
        const secondId = senderId < actualReceiverId ? actualReceiverId : senderId;

        // Lock first
        await connection.execute('SELECT current_balance FROM wallets WHERE user_id = ? FOR UPDATE', [firstId]);
        // Lock second
        await connection.execute('SELECT current_balance FROM wallets WHERE user_id = ? FOR UPDATE', [secondId]);

        // 3. Fetch current balances
        const [senderWallets] = await connection.execute(
            'SELECT current_balance FROM wallets WHERE user_id = ?',
            [senderId]
        );

        const [receiverWallets] = await connection.execute(
            'SELECT current_balance FROM wallets WHERE user_id = ?',
            [actualReceiverId]
        );

        if (senderWallets.length === 0 || receiverWallets.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ success: false, message: 'Wallet not found for one of the users.' });
        }

        const senderBalance = parseFloat(senderWallets[0].current_balance);

        // 4. Verify sender has sufficient balance
        if (senderBalance < transferAmount) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. You have ${senderBalance} available.`
            });
        }

        // 5. Debit sender & Credit receiver
        await connection.execute(
            'UPDATE wallets SET current_balance = current_balance - ? WHERE user_id = ?',
            [transferAmount, senderId]
        );

        await connection.execute(
            'UPDATE wallets SET current_balance = current_balance + ? WHERE user_id = ?',
            [transferAmount, actualReceiverId]
        );

        // 6. Insert record in fund_transfers table
        const [transferResult] = await connection.execute(
            `INSERT INTO fund_transfers (sender_id, receiver_id, amount, created_at) VALUES (?, ?, ?, NOW())`,
            [senderId, actualReceiverId, transferAmount]
        );
        const transferId = transferResult.insertId;

        // 7. Log transactions for both users
        // Sender log
        await connection.execute(
            `INSERT INTO transactions (user_id, amount, type, category, description, wallet_field, reference_id, created_at)
             VALUES (?, ?, 'debit', 'transfer', ?, 'current_balance', ?, NOW())`,
            [senderId, transferAmount, `Transferred to ID ${actualReceiverId} (${receiver.phone})`, transferId]
        );

        // Receiver log
        await connection.execute(
            `INSERT INTO transactions (user_id, amount, type, category, description, wallet_field, reference_id, created_at)
             VALUES (?, ?, 'credit', 'transfer', ?, 'current_balance', ?, NOW())`,
            [actualReceiverId, transferAmount, `Received from ID ${senderId}`, transferId]
        );

        // 8. Log in user_activity_logs
        await connection.execute(
            `INSERT INTO user_activity_logs (user_id, action, ip_address, description, created_at) VALUES (?, 'FUND_TRANSFER_SENT', ?, ?, NOW())`,
            [senderId, req.ip || 'unknown', `Sent ${transferAmount} to ID ${actualReceiverId}`]
        );
        await connection.execute(
            `INSERT INTO user_activity_logs (user_id, action, ip_address, description, created_at) VALUES (?, 'FUND_TRANSFER_RECEIVED', ?, ?, NOW())`,
            [actualReceiverId, req.ip || 'unknown', `Received ${transferAmount} from ID ${senderId}`]
        );

        // --- COMMIT TRANSACTION ---
        await connection.commit();
        connection.release();

        return res.status(200).json({
            success: true,
            message: 'Funds transferred successfully.',
            data: {
                transfer_id: transferId,
                amount: transferAmount,
                receiver: {
                    id: receiver_id,
                    phone: receiver.phone
                }
            }
        });

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Fund Transfer Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred while transferring funds.'
        });
    }
};

/**
 * GET /api/wallet
 * Protected: authenticateUser
 * PRD §4: View all wallet balances and club memberships ("Universal Club Visibility")
 */
const getWallet = async (req, res) => {
    const userId = req.user.id;

    try {
        // 1. Fetch wallet balances
        const [wallets] = await db.execute(
            `SELECT 
                current_balance, total_income, daily_club_bonus, salary_club, 
                hajj_club, shareholder_club, hajj_lottery_club, reward_point, 
                monthly_prize_point, due_account
             FROM wallets WHERE user_id = ?`,
            [userId]
        );

        if (wallets.length === 0) {
            return res.status(404).json({ success: false, message: 'Wallet not found.' });
        }

        const [users] = await db.execute('SELECT accumulated_pv, sp, gp FROM users WHERE id = ?', [userId]);

        const wallet = wallets[0];
        wallet.accumulated_pv = users.length > 0 ? users[0].accumulated_pv : 0.00;
        wallet.sp = users.length > 0 ? users[0].sp : 0.00;
        wallet.gp = users.length > 0 ? users[0].gp : 0.00;

        // 2. Fetch club memberships
        const [memberships] = await db.execute(
            `SELECT club_type, is_eligible, joined_at 
             FROM club_memberships WHERE user_id = ?`,
            [userId]
        );

        // Map memberships into a dictionary for easy access
        const activeMemberships = {};
        memberships.forEach(m => {
            activeMemberships[m.club_type] = {
                is_eligible: Boolean(m.is_eligible),
                joined_at: m.joined_at
            };
        });

        // 3. Prepare "Universal Club Visibility" structure
        const allClubs = ['daily', 'shareholder', 'hajj', 'hajj_lottery', 'salary', 'reward', 'monthly_prize'];
        const clubStatus = {};

        allClubs.forEach(club => {
            if (activeMemberships[club]) {
                clubStatus[club] = activeMemberships[club];
            } else {
                clubStatus[club] = {
                    is_eligible: false,
                    joined_at: null
                };
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Wallet and club data retrieved successfully.',
            data: {
                balances: wallet,
                clubs: clubStatus
            }
        });

    } catch (error) {
        console.error('Get Wallet Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred while retrieving wallet data.'
        });
    }
};

module.exports = { transferFunds, getWallet };
