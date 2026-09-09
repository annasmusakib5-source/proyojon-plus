/**
 * Reset admin password
 * Run: node prisma/reset_admin_password.js
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function resetAdminPassword() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'mlm_db',
    });

    try {
        const newPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const [result] = await connection.execute(
            "UPDATE users SET password = ? WHERE role = 'admin'",
            [hashedPassword]
        );

        console.log(`✅ Admin password reset successfully!`);
        console.log(`   Affected rows: ${result.affectedRows}`);
        console.log(`   New Password: ${newPassword}`);
        
        // Confirm by showing admin users
        const [admins] = await connection.execute(
            "SELECT id, phone, role, status FROM users WHERE role = 'admin'"
        );
        console.log('\n📋 Admin accounts:');
        admins.forEach(u => console.log(`  ID: ${u.id} | Phone: ${u.phone} | Status: ${u.status}`));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        connection.end();
    }
}

resetAdminPassword();
