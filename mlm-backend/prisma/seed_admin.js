/**
 * Seed script — creates an admin user if one doesn't already exist.
 * Run: node prisma/seed_admin.js
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function seedAdmin() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'mlm_db',
    });

    try {
        // Check if admin already exists
        const [existing] = await connection.execute(
            "SELECT id, phone, role FROM users WHERE role = 'admin' LIMIT 5"
        );

        if (existing.length > 0) {
            console.log('✅ Admin users already exist:');
            existing.forEach(u => console.log(`  ID: ${u.id} | Phone: ${u.phone} | Role: ${u.role}`));
            
            // Also show all users for reference
            const [allUsers] = await connection.execute(
                "SELECT id, phone, role, status FROM users LIMIT 20"
            );
            console.log('\n📋 All users in database:');
            allUsers.forEach(u => console.log(`  ID: ${u.id} | Phone: ${u.phone} | Role: ${u.role} | Status: ${u.status}`));
            
            connection.end();
            return;
        }

        // No admin exists — create one
        const adminPhone = '01700000001';
        const adminPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const [result] = await connection.execute(
            `INSERT INTO users (phone, password_hash, role, status, sponsor_id, created_at, updated_at)
             VALUES (?, ?, 'admin', 'active', NULL, NOW(), NOW())`,
            [adminPhone, hashedPassword]
        );

        const adminId = result.insertId;

        // Create wallet for admin
        await connection.execute(
            `INSERT INTO wallets (user_id, current_balance, total_income, created_at, updated_at)
             VALUES (?, 0, 0, NOW(), NOW())
             ON DUPLICATE KEY UPDATE user_id = user_id`,
            [adminId]
        );

        console.log(`✅ Admin user created successfully!`);
        console.log(`   Phone: ${adminPhone}`);
        console.log(`   Password: ${adminPassword}`);
        console.log(`   User ID: ${adminId}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        connection.end();
    }
}

seedAdmin();
