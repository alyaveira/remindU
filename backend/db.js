<<<<<<< HEAD
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.connect((err) => {
=======
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
>>>>>>> ca92e4ea01d740428cdafd5aff9a5c43050739f6
    if (err) {
        console.error('❌ Gagal konek ke database:', err.message);
        return;
    }
<<<<<<< HEAD
    console.log('✅ Terhubung ke database');
=======
    release();
    console.log('✅ Terhubung ke database Supabase');
>>>>>>> ca92e4ea01d740428cdafd5aff9a5c43050739f6
});

module.exports = pool;