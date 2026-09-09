const pool = require('./config/db');

async function run() {
    const conn = await pool.getConnection();
    try {
        await conn.execute('ALTER TABLE users ADD COLUMN sp DECIMAL(15,2) DEFAULT 0.00');
        await conn.execute('ALTER TABLE users ADD COLUMN gp DECIMAL(15,2) DEFAULT 0.00');
        console.log('Success: Columns added');
    } catch(e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist');
        } else {
            console.error(e);
        }
    }
    conn.release();
    process.exit(0);
}
run();
