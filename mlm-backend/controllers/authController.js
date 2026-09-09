const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// POST /api/register
const registerUser = async (req, res) => {
    const { name, phone, password, sponsor_id } = req.body;

    // --- Validation ---
    if (!name || !phone || !password) {
        return res.status(400).json({
            success: false,
            message: 'Name, phone number, and password are required.'
        });
    }

    // Phone format check (Bangladesh 11-digit)
    if (!/^01[3-9]\d{8}$/.test(phone)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid phone number format. Must be 11 digits starting with 01.'
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters long.'
        });
    }

    // Get a connection from pool for transaction
    const connection = await db.getConnection();

    try {
        // --- Check if phone already exists ---
        const [existingUser] = await connection.execute(
            'SELECT id FROM users WHERE phone = ?',
            [phone]
        );

        if (existingUser.length > 0) {
            connection.release();
            return res.status(409).json({
                success: false,
                message: 'This phone number is already registered.'
            });
        }

        // --- Verify sponsor exists (Mandatory) ---
        let validSponsorId = null;

        if (!sponsor_id) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'Referral ID is required to register.'
            });
        }

        const parsedId = Number(sponsor_id);
        const isNumericId = !isNaN(parsedId) && parsedId > 0 && parsedId < 2147483647;

        const [sponsor] = await connection.execute(
            `SELECT id FROM users WHERE phone = ? OR username = ? ${isNumericId ? 'OR id = ?' : ''}`,
            isNumericId ? [sponsor_id, sponsor_id, parsedId] : [sponsor_id, sponsor_id]
        );

        if (sponsor.length === 0) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'Invalid Referral ID. No user found with this number or ID.'
            });
        }

        validSponsorId = sponsor[0].id;

        // --- Hash the password ---
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // --- Generate unique username ---
        const baseName = name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        let generatedUsername = '';
        let isUnique = false;
        
        while (!isUnique) {
            const randomNum = Math.floor(1000 + Math.random() * 9000);
            generatedUsername = `${baseName || 'user'}_${randomNum}`;
            const [existingUsername] = await connection.execute(
                'SELECT id FROM users WHERE username = ?',
                [generatedUsername]
            );
            if (existingUsername.length === 0) {
                isUnique = true;
            }
        }

        // --- BEGIN MySQL Transaction ---
        await connection.beginTransaction();

        // 1. Insert new user into `users` table
        const [userResult] = await connection.execute(
            `INSERT INTO users (name, username, phone, password, sponsor_id, status, role, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, 'inactive', 'user', NOW(), NOW())`,
            [name, generatedUsername, phone, hashedPassword, validSponsorId]
        );

        const newUserId = userResult.insertId;

        // 2. Create default wallet row in `wallets` table (all balances start at 0.00)
        await connection.execute(
            `INSERT INTO wallets (user_id, current_balance, total_income, daily_club_bonus, salary_club, hajj_club, shareholder_club, hajj_lottery_club, reward_point, monthly_prize_point, due_account) 
             VALUES (?, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00)`,
            [newUserId]
        );

        // 3. Log activity in `user_activity_logs`
        await connection.execute(
            `INSERT INTO user_activity_logs (user_id, action, ip_address, description, created_at) 
             VALUES (?, 'REGISTRATION', ?, 'New user registered via phone number.', NOW())`,
            [newUserId, req.ip || 'unknown']
        );

        // --- COMMIT Transaction ---
        await connection.commit();
        connection.release();

        return res.status(201).json({
            success: true,
            message: 'Registration successful! Your account is inactive until you purchase a package.',
            data: {
                user_id: newUserId,
                username: generatedUsername,
                name: name,
                phone: phone,
                sponsor_id: validSponsorId,
                status: 'inactive'
            }
        });

    } catch (error) {
        // --- ROLLBACK on any error ---
        await connection.rollback();
        connection.release();

        console.error('Registration Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred during registration.'
        });
    }
};

// POST /api/login
const loginUser = async (req, res) => {
    const { phone, password } = req.body;

    // --- Validation ---
    if (!phone || !password) {
        return res.status(400).json({
            success: false,
            message: 'Phone number and password are required.'
        });
    }

    try {
        // --- Find user by phone with sponsor phone ---
        const [users] = await db.execute(
            `SELECT u.id, u.name, u.username, u.phone, u.password, u.sponsor_id, u.status, u.role, s.phone as sponsor_phone 
             FROM users u 
             LEFT JOIN users s ON u.sponsor_id = s.id 
             WHERE u.phone = ?`,
            [phone]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid phone number or password.'
            });
        }

        const user = users[0];

        // --- Check if user is banned ---
        if (user.status === 'banned') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been banned. Please contact Admin.'
            });
        }

        // --- Compare hashed password ---
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid phone number or password.'
            });
        }

        // --- Generate JWT Tokens ---
        const accessToken = jwt.sign(
            { id: user.id, phone: user.phone, role: user.role },
            process.env.JWT_SECRET || 'proyojon_plus_secret_key',
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET || 'proyojon_plus_refresh_secret',
            { expiresIn: '7d' }
        );

        // --- Set Cookies ---
        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // --- Update last_active_at ---
        await db.execute(
            'UPDATE users SET last_active_at = NOW() WHERE id = ?',
            [user.id]
        );

        // --- Log login activity ---
        await db.execute(
            `INSERT INTO user_activity_logs (user_id, action, ip_address, description, created_at) 
             VALUES (?, 'LOGIN', ?, 'User logged in successfully.', NOW())`,
            [user.id, req.ip || 'unknown']
        );
        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    phone: user.phone,
                    role: user.role,
                    sponsor_id: user.sponsor_id,
                    sponsor_phone: user.sponsor_phone,
                    status: user.status
                }
            }
        });

    } catch (error) {
        console.error('Login Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred during login.'
        });
    }
};

// GET /api/auth/forgot-password
// PRD §1: No automated OTP/email reset. User must contact Admin directly.
const forgotPassword = (req, res) => {
    const adminPhone = process.env.ADMIN_CONTACT_PHONE || '01XXXXXXXXX';

    return res.status(200).json({
        success: true,
        message: 'Password reset is not automated. Please contact Admin directly to reset your password.',
        data: {
            admin_contact_phone: adminPhone,
            instruction: 'Call or message the Admin at the number above. Provide your registered phone number for verification.'
        }
    });
};

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token cookie
 */
const refreshToken = async (req, res) => {
    const rToken = req.cookies.refresh_token;

    if (!rToken) {
        return res.status(401).json({ success: false, message: 'No refresh token provided.' });
    }

    try {
        const decoded = jwt.verify(rToken, process.env.JWT_REFRESH_SECRET || 'proyojon_plus_refresh_secret');
        
        // Fetch user
        const [users] = await db.execute('SELECT id, phone, role FROM users WHERE id = ?', [decoded.id]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }

        const user = users[0];

        // Issue new access token
        const newAccessToken = jwt.sign(
            { id: user.id, phone: user.phone, role: user.role },
            process.env.JWT_SECRET || 'proyojon_plus_secret_key',
            { expiresIn: '15m' }
        );

        res.cookie('access_token', newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        return res.status(200).json({ success: true, message: 'Access token refreshed.' });
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Invalid or expired refresh token.' });
    }
};

/**
 * POST /api/auth/logout
 * Clear authentication cookies
 */
const logoutUser = (req, res) => {
    res.clearCookie('access_token', { sameSite: 'None', secure: true, httpOnly: true });
    res.clearCookie('refresh_token', { sameSite: 'None', secure: true, httpOnly: true });
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

module.exports = { registerUser, loginUser, forgotPassword, refreshToken, logoutUser };
