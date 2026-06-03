const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// ========== Helper ==========
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

    // Validasi defensif
    if (!firstName || !lastName) return res.status(400).json({ error: 'Nama depan dan belakang wajib diisi' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email tidak valid' });
    if (!password || password.length < 8 || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        return res.status(400).json({ error: 'Password minimal 8 karakter, huruf kecil & angka' });
    }
    if (!terms) return res.status(400).json({ error: 'Harus menyetujui Terms & Conditions' });

    // Cek email sudah terdaftar
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

// ========== TASKS ENDPOINTS ==========
app.get('/api/tasks', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });

    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        const sql = `SELECT id_task, judul, notes, due_date, remind_at, kategori, selesai 
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

// ========== GET PROFILE ==========
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

// ========== UPDATE PROFILE (nama & password) ==========
app.put('/api/profile', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { firstName, lastName, newPassword, confirmPassword } = req.body;

    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });
    if (!firstName || !lastName) return res.status(400).json({ error: 'Nama depan dan belakang wajib diisi' });

    // Jika ada permintaan ganti password
    if (newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'Konfirmasi password baru tidak cocok' });
        }
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
        // Hanya update nama
        const sql = 'UPDATE data_pengguna SET nama_depan = ?, nama_belakang = ? WHERE email = ?';
        db.query(sql, [firstName, lastName, userEmail], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
            res.json({ success: true, message: 'Profil berhasil diperbarui' });
        });
    }
});


// ========== NOTIFICATIONS ==========
app.get('/api/notifications', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        const sql = `SELECT id_notif, judul, pesan, tipe, waktu_kirim, status_baca
                     FROM notifications WHERE id_pengguna = ?
                     ORDER BY waktu_kirim DESC LIMIT 50`;
        db.query(sql, [userId], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });
});

app.put('/api/notifications/read-all', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        db.query('UPDATE notifications SET status_baca = 1 WHERE id_pengguna = ?', [userId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

app.put('/api/notifications/:id/read', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const notifId = req.params.id;
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        db.query('UPDATE notifications SET status_baca = 1 WHERE id_notif = ? AND id_pengguna = ?',
            [notifId, userId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

app.delete('/api/notifications/:id', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const notifId = req.params.id;
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        db.query('DELETE FROM notifications WHERE id_notif = ? AND id_pengguna = ?',
            [notifId, userId], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Notifikasi tidak ditemukan' });
            res.json({ success: true });
        });
    });
});

// Helper: buat notifikasi otomatis
function createNotification(userId, judul, pesan, tipe = 'system', idTask = null) {
    const sql = 'INSERT INTO notifications (id_pengguna, judul, pesan, tipe, id_task) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [userId, judul, pesan, tipe, idTask], (err) => {
        if (err) console.error('Gagal buat notifikasi:', err.message);
    });
}

// Override POST /api/tasks — tambah notifikasi otomatis saat task baru dibuat
// (hapus endpoint POST /api/tasks yang lama di atas jika ingin pakai versi ini)
// Versi baru dengan auto-notifikasi:
app.post('/api/tasks/v2', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { judul, kategori, notes, due_date, remind_at } = req.body;
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });
    if (!judul || judul.trim() === '') return res.status(400).json({ error: 'Judul kosong' });
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        const sql = `INSERT INTO tasks (id_pengguna, judul, kategori, notes, due_date, remind_at) VALUES (?, ?, ?, ?, ?, ?)`;
        db.query(sql, [userId, judul, kategori, notes || null, due_date || null, remind_at || null], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            // Notifikasi otomatis
            createNotification(userId, 'Task Baru Ditambahkan',
                `Task "${judul}" berhasil ditambahkan ke kategori ${kategori}.`,
                'reminder', result.insertId);
            // Cek deadline dalam 3 hari
            if (due_date) {
                const diff = new Date(due_date) - Date.now();
                if (diff > 0 && diff < 86400000 * 3) {
                    createNotification(userId, '⚡ Deadline Mepet!',
                        `Task "${judul}" yang baru kamu tambahkan jatuh tempo dalam kurang dari 3 hari!`,
                        'deadline', result.insertId);
                }
            }
            res.status(201).json({ id_task: result.insertId, judul, kategori, notes, due_date, remind_at, selesai: false });
        });
    });
});

// ========== PRIVACY ==========
app.put('/api/privacy', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { currentPassword, newPassword, newEmail, phone } = req.body;
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });

    getUserIdFromEmail(userEmail, async (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        db.query('SELECT kata_sandi FROM data_pengguna WHERE id_pengguna = ?', [userId], async (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            const user = results[0];

            if (newPassword) {
                if (!currentPassword) return res.status(400).json({ error: 'Password saat ini wajib diisi' });
                const match = await bcrypt.compare(currentPassword, user.kata_sandi);
                if (!match) return res.status(401).json({ error: 'Password saat ini salah' });
                if (newPassword.length < 8 || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword))
                    return res.status(400).json({ error: 'Password minimal 8 karakter, huruf kecil & angka' });
            }

            const updates = []; const values = [];
            if (newPassword) {
                const hashed = await bcrypt.hash(newPassword, 10);
                updates.push('kata_sandi = ?'); values.push(hashed);
            }
            if (newEmail) {
                const rows = await new Promise(resolve =>
                    db.query('SELECT id_pengguna FROM data_pengguna WHERE email = ?', [newEmail], (e, r) => resolve(r)));
                if (rows.length > 0) return res.status(400).json({ error: 'Email sudah digunakan akun lain' });
                updates.push('email = ?'); values.push(newEmail);
            }
            if (phone) { updates.push('nomor_telepon = ?'); values.push(phone); }
            if (updates.length === 0) return res.json({ success: true, message: 'Tidak ada perubahan' });

            values.push(userId);
            db.query(`UPDATE data_pengguna SET ${updates.join(', ')} WHERE id_pengguna = ?`, values, (err) => {
                if (err) return res.status(500).json({ error: err.message });
                createNotification(userId, '🔒 Keamanan Diperbarui',
                    'Informasi keamanan akun kamu baru saja berhasil diperbarui.', 'system');
                res.json({ success: true, message: 'Privasi berhasil diperbarui', newEmail: newEmail || userEmail });
            });
        });
    });
});

// ========== AI MOTIVASI PROXY ==========
app.post('/api/ai/motivasi', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { prompt } = req.body;
    if (!userEmail || !prompt) return res.status(400).json({ error: 'Email dan prompt wajib' });

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
    if (!ANTHROPIC_API_KEY) {
        return res.status(503).json({ error: 'AI service tidak tersedia. Set ANTHROPIC_API_KEY di environment.' });
    }

    try {
        const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args)).catch(() => global.fetch(...args));
        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 500,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        const data = await aiRes.json();
        if (!aiRes.ok) return res.status(aiRes.status).json({ error: data.error?.message || 'AI error' });
        const text = (data.content || []).map(c => c.text || '').join('');

        // Log ke DB
        getUserIdFromEmail(userEmail, (userId) => {
            if (!userId) return;
            try {
                const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
                db.query(
                    'INSERT INTO ai_motivasi_log (id_pengguna, prompt, response_icon, response_title, response_msg) VALUES (?, ?, ?, ?, ?)',
                    [userId, prompt.slice(0, 500), parsed.icon || '✨', parsed.title || '', parsed.msg || ''],
                    () => {}
                );
            } catch (_) {}
        });
        res.json({ text });
    } catch (err) {
        res.status(500).json({ error: 'Gagal menghubungi AI: ' + err.message });
    }
});

app.get('/api/ai/motivasi/history', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        const sql = `SELECT response_icon, response_title, response_msg, dibuat_pada
                     FROM ai_motivasi_log WHERE id_pengguna = ?
                     ORDER BY dibuat_pada DESC LIMIT 10`;
        db.query(sql, [userId], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });
});

// ========== STATISTICS SUMMARY ==========
app.get('/api/statistics', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        const sql = `
            SELECT
                COUNT(*) AS total,
                SUM(selesai = 1) AS completed,
                SUM(selesai = 0) AS pending,
                SUM(kategori = 'study') AS study,
                SUM(kategori = 'personal') AS personal,
                SUM(kategori = 'health') AS health,
                SUM(kategori = 'work') AS work,
                SUM(selesai = 1 AND DATE(dibuat_pada) = CURDATE()) AS completed_today,
                SUM(DATE(dibuat_pada) = CURDATE()) AS created_today
            FROM tasks WHERE id_pengguna = ?`;
        db.query(sql, [userId], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results[0]);
        });
    });
});

// ========== RESEND OTP ==========
app.post('/api/resend-otp', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email wajib diisi' });
    db.query('SELECT kode_verifikasi FROM data_pengguna WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Email tidak ditemukan' });
        if (results[0].kode_verifikasi === null) return res.status(400).json({ error: 'Akun sudah terverifikasi' });
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        db.query('UPDATE data_pengguna SET kode_verifikasi = ? WHERE email = ?', [newOtp, email], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            console.log(`🔐 OTP baru untuk ${email}: ${newOtp}`);
            res.json({ message: 'OTP baru berhasil dikirim', otp: newOtp });
        });
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});