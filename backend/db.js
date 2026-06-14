const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.connect((err) => {
    if (err) {
        console.error('❌ Gagal konek ke database:', err.message);
        return;
    }
    console.log('✅ Terhubung ke database');
});

module.exports = pool;