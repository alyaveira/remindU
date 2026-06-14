require('dotenv').config({ path: './api.env' });
const { Pool } = require('pg');

const db = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    ssl: { rejectUnauthorized: false }
});

db.connect((err, client, release) => {
    if (err) {
        console.error('❌ Gagal konek ke database:', err.message);
        return;
    }
    release();
    console.log('✅ Terhubung ke database Supabase');
});

module.exports = db;