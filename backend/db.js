const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'remindu'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Gagal konek ke database:', err.message);
        return;
    }
    console.log('✅ Terhubung ke database remindu');
});

module.exports = db;