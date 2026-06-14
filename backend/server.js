require('dotenv').config({ path: './api.env' });
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
async function getUserIdFromEmail(email) {
    const result = await db.query('SELECT id_pengguna FROM data_pengguna WHERE email = $1', [email]);
    if (result.rows.length === 0) return null;
    return result.rows[0].id_pengguna;
}

function createNotification(userId, judul, pesan, tipe = 'system', idTask = null) {
    db.query(
        'INSERT INTO notifications (id_pengguna, judul, pesan, tipe, id_task) VALUES ($1, $2, $3, $4, $5)',
        [userId, judul, pesan, tipe, idTask]
    ).catch(err => console.error('Gagal buat notifikasi:', err.message));
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

    try {
        const cek = await db.query('SELECT email FROM data_pengguna WHERE email = $1', [email]);
        if (cek.rows.length > 0) return res.status(400).json({ error: 'Email sudah terdaftar' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await db.query(
            `INSERT INTO data_pengguna (nama_depan, nama_belakang, email, kata_sandi, kode_verifikasi, setuju_syarat)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [firstName, lastName, email, hashedPassword, otp, terms ? true : false]
        );

        console.log(`🔐 OTP untuk ${email}: ${otp}`);
        res.status(201).json({ message: 'Registrasi berhasil', otp });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== VERIFY OTP ==========
app.post('/api/verify', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email dan OTP wajib diisi' });

    try {
        const result = await db.query('SELECT kode_verifikasi FROM data_pengguna WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Email tidak ditemukan' });
        if (result.rows[0].kode_verifikasi !== otp) return res.status(400).json({ error: 'OTP salah' });

        await db.query('UPDATE data_pengguna SET kode_verifikasi = NULL WHERE email = $1', [email]);
        res.json({ success: true, message: 'Verifikasi berhasil' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== LOGIN ==========
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib diisi' });

    try {
        const result = await db.query(
            'SELECT id_pengguna, email, kata_sandi, kode_verifikasi FROM data_pengguna WHERE email = $1',
            [email]
        );
        if (result.rows.length === 0) return res.status(401).json({ error: 'Email atau password salah' });

        const user = result.rows[0];
        if (user.kode_verifikasi !== null) return res.status(403).json({ error: 'Akun belum diverifikasi. Cek OTP.' });

        const match = await bcrypt.compare(password, user.kata_sandi);
        if (!match) return res.status(401).json({ error: 'Email atau password salah' });

        res.json({ success: true, email: user.email });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== TASKS ==========
app.get('/api/tasks', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });

    try {
        const userId = await getUserIdFromEmail(userEmail);
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });

        const result = await db.query(
            `SELECT id_task, judul, notes, due_date, remind_at, kategori, selesai
             FROM tasks WHERE id_pengguna = $1 ORDER BY dibuat_pada DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/tasks', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { judul, kategori, notes, due_date, remind_at } = req.body;
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });
    if (!judul || judul.trim() === '') return res.status(400).json({ error: 'Judul kosong' });

    try {
        const userId = await getUserIdFromEmail(userEmail);
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });

        const result = await db.query(
            `INSERT INTO tasks (id_pengguna, judul, kategori, notes, due_date, remind_at)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_task`,
            [userId, judul, kategori, notes || null, due_date || null, remind_at || null]
        );

        const id_task = result.rows[0].id_task;

        // Notifikasi otomatis
        createNotification(userId, 'Task Baru Ditambahkan',
            `Task "${judul}" berhasil ditambahkan ke kategori ${kategori}.`, 'reminder', id_task);

        if (due_date) {
            const diff = new Date(due_date) - Date.now();
            if (diff > 0 && diff < 86400000 * 3) {
                createNotification(userId, '⚡ Deadline Mepet!',
                    `Task "${judul}" jatuh tempo dalam kurang dari 3 hari!`, 'deadline', id_task);
            }
        }

        res.status(201).json({ id_task, judul, kategori, notes, due_date, remind_at, selesai: false });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/tasks/:id', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const taskId = req.params.id;
    const { selesai } = req.body;
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });

    try {
        const userId = await getUserIdFromEmail(userEmail);
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });

        const result = await db.query(
            'UPDATE tasks SET selesai = $1 WHERE id_task = $2 AND id_pengguna = $3',
            [selesai, taskId, userId]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Task tidak ditemukan' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const taskId = req.params.id;
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });

    try {
        const userId = await getUserIdFromEmail(userEmail);
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });

        const result = await db.query(
            'DELETE FROM tasks WHERE id_task = $1 AND id_pengguna = $2',
            [taskId, userId]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Task tidak ditemukan' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== PROFILE ==========
app.get('/api/profile', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });

    try {
        const result = await db.query(
            'SELECT nama_depan, nama_belakang, email FROM data_pengguna WHERE email = $1',
            [userEmail]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/profile', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { firstName, lastName, newPassword, confirmPassword } = req.body;
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });
    if (!firstName || !lastName) return res.status(400).json({ error: 'Nama depan dan belakang wajib diisi' });

    try {
        if (newPassword || confirmPassword) {
            if (newPassword !== confirmPassword) return res.status(400).json({ error: 'Konfirmasi password tidak cocok' });
            if (newPassword.length < 8 || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword))
                return res.status(400).json({ error: 'Password minimal 8 karakter, huruf kecil & angka' });

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const result = await db.query(
                'UPDATE data_pengguna SET nama_depan = $1, nama_belakang = $2, kata_sandi = $3 WHERE email = $4',
                [firstName, lastName, hashedPassword, userEmail]
            );
            if (result.rowCount === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
        } else {
            const result = await db.query(
                'UPDATE data_pengguna SET nama_depan = $1, nama_belakang = $2 WHERE email = $3',
                [firstName, lastName, userEmail]
            );
            if (result.rowCount === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
        }
        res.json({ success: true, message: 'Profil berhasil diperbarui' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== NOTIFICATIONS ==========
app.get('/api/notifications', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });

    try {
        const userId = await getUserIdFromEmail(userEmail);
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });

        const result = await db.query(
            `SELECT id_notif, judul, pesan, tipe, waktu_kirim, status_baca
             FROM notifications WHERE id_pengguna = $1
             ORDER BY waktu_kirim DESC LIMIT 50`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/notifications/read-all', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });

    try {
        const userId = await getUserIdFromEmail(userEmail);
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });

        await db.query('UPDATE notifications SET status_baca = true WHERE id_pengguna = $1', [userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/notifications/:id/read', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const notifId = req.params.id;
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });

    try {
        const userId = await getUserIdFromEmail(userEmail);
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });

        await db.query(
            'UPDATE notifications SET status_baca = true WHERE id_notif = $1 AND id_pengguna = $2',
            [notifId, userId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/notifications/:id', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const notifId = req.params.id;
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });

    try {
        const userId = await getUserIdFromEmail(userEmail);
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });

        const result = await db.query(
            'DELETE FROM notifications WHERE id_notif = $1 AND id_pengguna = $2',
            [notifId, userId]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Notifikasi tidak ditemukan' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== PRIVACY ==========
app.put('/api/privacy', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { currentPassword, newPassword, newEmail, phone } = req.body;
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });

    try {
        const userId = await getUserIdFromEmail(userEmail);
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });

        const userResult = await db.query('SELECT kata_sandi FROM data_pengguna WHERE id_pengguna = $1', [userId]);
        const user = userResult.rows[0];

        if (newPassword) {
            if (!currentPassword) return res.status(400).json({ error: 'Password saat ini wajib diisi' });
            const match = await bcrypt.compare(currentPassword, user.kata_sandi);
            if (!match) return res.status(401).json({ error: 'Password saat ini salah' });
            if (newPassword.length < 8 || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword))
                return res.status(400).json({ error: 'Password minimal 8 karakter, huruf kecil & angka' });
        }

        const updates = []; const values = [];
        let paramCount = 1;

        if (newPassword) {
            const hashed = await bcrypt.hash(newPassword, 10);
            updates.push(`kata_sandi = $${paramCount++}`); values.push(hashed);
        }
        if (newEmail) {
            const cek = await db.query('SELECT id_pengguna FROM data_pengguna WHERE email = $1', [newEmail]);
            if (cek.rows.length > 0) return res.status(400).json({ error: 'Email sudah digunakan akun lain' });
            updates.push(`email = $${paramCount++}`); values.push(newEmail);
        }
        if (phone) { updates.push(`nomor_telepon = $${paramCount++}`); values.push(phone); }

        if (updates.length === 0) return res.json({ success: true, message: 'Tidak ada perubahan' });

        values.push(userId);
        await db.query(`UPDATE data_pengguna SET ${updates.join(', ')} WHERE id_pengguna = $${paramCount}`, values);

        createNotification(userId, '🔒 Keamanan Diperbarui',
            'Informasi keamanan akun kamu baru saja berhasil diperbarui.', 'system');

        res.json({ success: true, message: 'Privasi berhasil diperbarui', newEmail: newEmail || userEmail });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== AI MOTIVASI ==========
app.post('/api/ai/motivasi', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { prompt } = req.body;
    if (!userEmail || !prompt) return res.status(400).json({ error: 'Email dan prompt wajib' });

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
    if (!GEMINI_API_KEY) return res.status(503).json({ error: 'AI service tidak tersedia.' });

    try {
        const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args)).catch(() => global.fetch(...args));
        const aiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            }
        );
        const data = await aiRes.json();
        if (!aiRes.ok) return res.status(aiRes.status).json({ error: data.error?.message || 'AI error' });

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        const userId = await getUserIdFromEmail(userEmail);
        if (userId) {
            try {
                const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
                await db.query(
                    'INSERT INTO ai_motivasi_log (id_pengguna, prompt, response_icon, response_title, response_msg) VALUES ($1, $2, $3, $4, $5)',
                    [userId, prompt.slice(0, 500), parsed.icon || '✨', parsed.title || '', parsed.msg || '']
                );
            } catch (_) {}
        }

        res.json({ text });
    } catch (err) {
        res.status(500).json({ error: 'Gagal menghubungi AI: ' + err.message });
    }
});

app.get('/api/ai/motivasi/history', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });

    try {
        const userId = await getUserIdFromEmail(userEmail);
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });

        const result = await db.query(
            `SELECT response_icon, response_title, response_msg, dibuat_pada
             FROM ai_motivasi_log WHERE id_pengguna = $1
             ORDER BY dibuat_pada DESC LIMIT 10`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== STATISTICS ==========
app.get('/api/statistics', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });

    try {
        const userId = await getUserIdFromEmail(userEmail);
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });

        const result = await db.query(
            `SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN selesai = true THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN selesai = false THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN kategori = 'study' THEN 1 ELSE 0 END) AS study,
                SUM(CASE WHEN kategori = 'personal' THEN 1 ELSE 0 END) AS personal,
                SUM(CASE WHEN kategori = 'health' THEN 1 ELSE 0 END) AS health,
                SUM(CASE WHEN kategori = 'work' THEN 1 ELSE 0 END) AS work,
                SUM(CASE WHEN selesai = true AND DATE(dibuat_pada) = CURRENT_DATE THEN 1 ELSE 0 END) AS completed_today,
                SUM(CASE WHEN DATE(dibuat_pada) = CURRENT_DATE THEN 1 ELSE 0 END) AS created_today
             FROM tasks WHERE id_pengguna = $1`,
            [userId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== RESEND OTP ==========
app.post('/api/resend-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email wajib diisi' });

    try {
        const result = await db.query('SELECT kode_verifikasi FROM data_pengguna WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Email tidak ditemukan' });
        if (result.rows[0].kode_verifikasi === null) return res.status(400).json({ error: 'Akun sudah terverifikasi' });

        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        await db.query('UPDATE data_pengguna SET kode_verifikasi = $1 WHERE email = $2', [newOtp, email]);

        console.log(`🔐 OTP baru untuk ${email}: ${newOtp}`);
        res.json({ message: 'OTP baru berhasil dikirim', otp: newOtp });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});