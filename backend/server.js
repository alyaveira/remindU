const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db'); // file koneksi database

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// ========== Helper: ambil id_pengguna dari email ==========
function getUserIdFromEmail(email, callback) {
    const sql = 'SELECT id_pengguna FROM data_pengguna WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err || results.length === 0) return callback(null);
        callback(results[0].id_pengguna);
    });
}

// ========== REGISTER ==========
app.post('/api/register', async (req, res) => {
    const { firstName, lastName, email, password, terms } = req.body;

    if (!firstName || !lastName) return res.status(400).json({ error: 'Nama depan dan belakang wajib diisi' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email tidak valid' });
    if (!password || password.length < 8 || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        return res.status(400).json({ error: 'Password minimal 8 karakter, huruf kecil & angka' });
    }
    if (!terms) return res.status(400).json({ error: 'Harus menyetujui Terms & Conditions' });

    db.query('SELECT email FROM data_pengguna WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) return res.status(400).json({ error: 'Email sudah terdaftar' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const sql = `INSERT INTO data_pengguna (nama_depan, nama_belakang, email, kata_sandi, kode_verifikasi, setuju_syarat)
                     VALUES (?, ?, ?, ?, ?, ?)`;
        db.query(sql, [firstName, lastName, email, hashedPassword, otp, terms ? 1 : 0], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            console.log(`🔐 OTP untuk ${email}: ${otp}`);
            res.status(201).json({ message: 'Registrasi berhasil', otp: otp });
        });
    });
});

// ========== VERIFY OTP ==========
app.post('/api/verify', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email dan OTP wajib diisi' });

    db.query('SELECT kode_verifikasi FROM data_pengguna WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Email tidak ditemukan' });
        if (results[0].kode_verifikasi !== otp) return res.status(400).json({ error: 'OTP salah' });

        db.query('UPDATE data_pengguna SET kode_verifikasi = NULL WHERE email = ?', [email], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Verifikasi berhasil' });
        });
    });
});

// ========== LOGIN ==========
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib diisi' });

    db.query('SELECT id_pengguna, email, kata_sandi, kode_verifikasi FROM data_pengguna WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ error: 'Email atau password salah' });

        const user = results[0];
        if (user.kode_verifikasi !== null) return res.status(403).json({ error: 'Akun belum diverifikasi. Cek OTP.' });

        const match = await bcrypt.compare(password, user.kata_sandi);
        if (!match) return res.status(401).json({ error: 'Email atau password salah' });

        res.json({ success: true, email: user.email });
    });
});

// ========== PROFILE (GET) ==========
app.get('/api/profile', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });

    const sql = 'SELECT nama_depan, nama_belakang, email FROM data_pengguna WHERE email = ?';
    db.query(sql, [userEmail], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
        res.json(results[0]);
    });
});

// ========== PROFILE (UPDATE) ==========
app.put('/api/profile', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { firstName, lastName, newPassword, confirmPassword } = req.body;
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });
    if (!firstName || !lastName) return res.status(400).json({ error: 'Nama depan dan belakang wajib diisi' });

    if (newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) return res.status(400).json({ error: 'Konfirmasi password baru tidak cocok' });
        if (newPassword.length < 8 || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            return res.status(400).json({ error: 'Password minimal 8 karakter, huruf kecil & angka' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const sql = 'UPDATE data_pengguna SET nama_depan = ?, nama_belakang = ?, kata_sandi = ? WHERE email = ?';
        db.query(sql, [firstName, lastName, hashedPassword, userEmail], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
            res.json({ success: true, message: 'Profil dan password berhasil diperbarui' });
        });
    } else {
        const sql = 'UPDATE data_pengguna SET nama_depan = ?, nama_belakang = ? WHERE email = ?';
        db.query(sql, [firstName, lastName, userEmail], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
            res.json({ success: true, message: 'Profil berhasil diperbarui' });
        });
    }
});

// ========== TASKS ENDPOINTS ==========
app.get('/api/tasks', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });

    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        const sql = `SELECT id_task, judul, notes, due_date, remind_at, kategori, selesai, dibuat_pada
                     FROM tasks WHERE id_pengguna = ? ORDER BY dibuat_pada DESC`;
        db.query(sql, [userId], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });
});

app.post('/api/tasks', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { judul, kategori, notes, due_date, remind_at } = req.body;
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });
    if (!judul || judul.trim() === '') return res.status(400).json({ error: 'Judul kosong' });
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        const sql = `INSERT INTO tasks (id_pengguna, judul, kategori, notes, due_date, remind_at)
                     VALUES (?, ?, ?, ?, ?, ?)`;
        db.query(sql, [userId, judul, kategori, notes || null, due_date || null, remind_at || null], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id_task: result.insertId, judul, kategori, notes, due_date, remind_at, selesai: false });
        });
    });
});

app.put('/api/tasks/:id', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const taskId = req.params.id;
    const { selesai } = req.body;
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        const sql = 'UPDATE tasks SET selesai = ? WHERE id_task = ? AND id_pengguna = ?';
        db.query(sql, [selesai, taskId, userId], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Task tidak ditemukan' });
            res.json({ success: true });
        });
    });
});

app.delete('/api/tasks/:id', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const taskId = req.params.id;
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        const sql = 'DELETE FROM tasks WHERE id_task = ? AND id_pengguna = ?';
        db.query(sql, [taskId, userId], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Task tidak ditemukan' });
            res.json({ success: true });
        });
    });
});

// ========== NOTIFIKASI (opsional) ==========
app.get('/api/notifications', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });

    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        // Contoh notifikasi sederhana: deadline dalam 24 jam
        const sql = `SELECT id_task, judul, due_date FROM tasks 
                     WHERE id_pengguna = ? AND selesai = 0 AND due_date IS NOT NULL 
                     AND due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 1 DAY)`;
        db.query(sql, [userId], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            const notif = results.map(task => ({
                id: task.id_task,
                type: 'deadline',
                icon: '⏰',
                title: 'Deadline Mendekat!',
                msg: `Task "${task.judul}" akan jatuh tempo kurang dari 24 jam.`,
                time: new Date().toISOString(),
                read: false
            }));
            res.json(notif);
        });
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});