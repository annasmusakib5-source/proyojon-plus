const db = require('../config/db');

// GET /api/settings
// Public route to fetch all settings (like hero image)
const getPublicSettings = async (req, res) => {
    try {
        const [settings] = await db.execute('SELECT `key`, `value` FROM settings');
        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        // Provide defaults if not set
        if (!settingsMap['hero_image']) {
            settingsMap['hero_image'] = '/hero-3d.jpg';
        }

        return res.status(200).json({
            success: true,
            data: settingsMap
        });
    } catch (error) {
        console.error('Settings Error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/admin/settings
const adminGetSettings = async (req, res) => {
    try {
        const [settings] = await db.execute('SELECT `key`, `value` FROM settings');
        return res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Admin Settings Error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PUT /api/admin/settings
const adminUpdateSettings = async (req, res) => {
    const { settings } = req.body; // Expect array of { key, value }

    if (!Array.isArray(settings)) {
        return res.status(400).json({ success: false, message: 'Invalid format. Expected array of settings.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        for (const setting of settings) {
            await connection.execute(
                'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
                [setting.key, setting.value, setting.value]
            );
        }

        await connection.commit();
        connection.release();

        return res.status(200).json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Admin Settings Error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getPublicSettings,
    adminGetSettings,
    adminUpdateSettings
};
