const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

// Check if a full DATABASE_URL is provided in .env
if (process.env.DATABASE_URL) {
    // Note: Prisma might use a format like mysql://user:password@localhost:3306/mlm_db
    pool = mysql.createPool(process.env.DATABASE_URL);
} else {
    // Fallback to individual DB credentials
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mlm_db',
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
}

// Test the connection
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to the MySQL database.');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to the database:', err.message);
    });

module.exports = pool;
