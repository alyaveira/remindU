<<<<<<< HEAD
// server.js — RemindU Backend v2.0 (PostgreSQL / Supabase)
require('dotenv').config({ path: './api.env' });
=======
require('dotenv').config({ path: './api.env' });
const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
>>>>>>> ca92e4ea01d740428cdafd5aff9a5c43050739f6

const express        = require('express');
const bcrypt         = require('bcryptjs');
const cors           = require('cors');
const bodyParser     = require('body-parser');
const session        = require('express-session');
const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const nodemailer     = require('nodemailer');
const cron           = require('node-cron');
const { OAuth2Client } = require('google-auth-library');
const db             = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

<<<<<<< HEAD
// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:5500', 'http://localhost:3000', 'http://127.0.0.1:5500'],
    credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'remindu_secret_key_2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());

// ============================================================
// HELPERS
// ============================================================
function getUserIdFromEmail(email, callback) {
    db.query('SELECT id_pengguna FROM data_pengguna WHERE email = $1', [email], (err, results) => {
        if (err || results.rows.length === 0) return callback(null);
        callback(results.rows[0].id_pengguna);
    });
=======
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
>>>>>>> ca92e4ea01d740428cdafd5aff9a5c43050739f6
}

function getUserById(id, callback) {
    db.query('SELECT * FROM data_pengguna WHERE id_pengguna = $1', [id], (err, results) => {
        if (err || results.rows.length === 0) return callback(null);
        callback(results.rows[0]);
    });
}

function createNotification(userId, judul, pesan, tipe = 'system', idTask = null) {
    const sql = 'INSERT INTO notifications (id_pengguna, judul, pesan, tipe, id_task) VALUES ($1, $2, $3, $4, $5)';
    db.query(sql, [userId, judul, pesan, tipe, idTask], (err) => {
        if (err) console.error('Notif error:', err.message);
    });
}

// ============================================================
// NODEMAILER — SMTP TRANSPORT (sama seperti sebelumnya)
// ============================================================
const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: { rejectUnauthorized: false }
});

transporter.verify((err, success) => {
    if (err) console.warn('⚠️  SMTP tidak terhubung:', err.message, '(fitur email dinonaktifkan)');
    else     console.log('✅ SMTP siap mengirim email');
});

async function sendReminderEmail(userEmail, userName, taskTitle, taskCategory, dueDate, hoursLeft) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return false;
    // ... (fungsi HTML sama seperti sebelumnya, tidak diubah)
    const dueFormatted = new Date(dueDate).toLocaleString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long',
        day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const urgencyColor = hoursLeft <= 3 ? '#e53e3e' : hoursLeft <= 24 ? '#f97316' : '#8b5cf6';
    const urgencyText  = hoursLeft <= 3 ? '🚨 SEGERA!' : hoursLeft <= 24 ? '⚡ Hari ini!' : '📅 Mendekat';
    const catEmoji     = { study:'📚', personal:'🧑', health:'💪', work:'💼' }[taskCategory] || '📌';
    const html = `...`; // (salin dari kode lama, tidak berubah)
    try {
        await transporter.sendMail({
            from:    process.env.EMAIL_FROM || `"RemindU App" <${process.env.SMTP_USER}>`,
            to:      userEmail,
            subject: `🔔 [RemindU] ${urgencyText} — "${taskTitle}" deadline ${hoursLeft <= 24 ? 'hari ini!' : 'mendekat!'}`,
            html
        });
        console.log(`📧 Email terkirim ke ${userEmail} — task: ${taskTitle}`);
        return true;
    } catch (err) {
        console.error(`❌ Gagal kirim email ke ${userEmail}:`, err.message);
        return false;
    }
}

// ============================================================
// CRON JOB — CEK DEADLINE SETIAP 30 MENIT (PostgreSQL)
// ============================================================
function startReminderCron() {
    cron.schedule('*/30 * * * *', async () => {
        console.log(`🕐 [${new Date().toLocaleString('id-ID')}] Cron job: cek deadline task...`);
        const sql = `
            SELECT
                t.id_task, t.judul, t.kategori, t.due_date, t.id_pengguna,
                dp.email, dp.nama_depan, dp.email_notif, dp.notif_h_sebelum
            FROM tasks t
            JOIN data_pengguna dp ON t.id_pengguna = dp.id_pengguna
            WHERE
                t.selesai = false
                AND t.due_date IS NOT NULL
                AND t.due_date > NOW()
                AND t.due_date <= NOW() + INTERVAL '3 days'
                AND dp.email_notif = true
                AND dp.email IS NOT NULL
                AND dp.email != ''
        `;
        db.query(sql, async (err, result) => {
            if (err) { console.error('Cron DB error:', err.message); return; }
            const tasks = result.rows;
            if (tasks.length === 0) { console.log('   Tidak ada task mendekati deadline.'); return; }
            console.log(`   Ditemukan ${tasks.length} task mendekati deadline.`);
            for (const task of tasks) {
                const hoursLeft = Math.round((new Date(task.due_date) - Date.now()) / 3600000);
                const hSebelum  = task.notif_h_sebelum || 1;
                const shouldSend = (
                    (hSebelum >= 72 && hoursLeft <= 72) ||
                    (hSebelum >= 48 && hoursLeft <= 48) ||
                    (hSebelum >= 24 && hoursLeft <= 24) ||
                    (hSebelum >= 3  && hoursLeft <= 3)
                );
                if (!shouldSend) continue;
                const tipeReminder = hoursLeft <= 3 ? '3jam' : hoursLeft <= 24 ? '24jam' : hoursLeft <= 48 ? '48jam' : '72jam';
                const checkSql = 'SELECT id_log FROM email_reminder_log WHERE id_task = $1 AND tipe_reminder = $2';
                db.query(checkSql, [task.id_task, tipeReminder], async (err2, existing) => {
                    if (err2 || existing.rows.length > 0) return;
                    const sent = await sendReminderEmail(
                        task.email, task.nama_depan, task.judul, task.kategori, task.due_date, hoursLeft
                    );
                    if (sent) {
                        db.query(
                            'INSERT INTO email_reminder_log (id_task, id_pengguna, tipe_reminder) VALUES ($1, $2, $3)',
                            [task.id_task, task.id_pengguna, tipeReminder],
                            () => {}
                        );
                        createNotification(task.id_pengguna, '📧 Email Pengingat Terkirim',
                            `Email pengingat untuk task "${task.judul}" telah dikirim ke ${task.email}.`,
                            'reminder', task.id_task);
                    }
                });
            }
        });
    });
    console.log('✅ Cron job reminder email aktif (setiap 30 menit)');
}

// ============================================================
// PASSPORT — GOOGLE OAUTH2 STRATEGY (sama seperti sebelumnya, tapi query disesuaikan)
// ============================================================
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
        const googleId  = profile.id;
        const email     = profile.emails?.[0]?.value || '';
        const firstName = profile.name?.givenName   || profile.displayName?.split(' ')[0] || 'User';
        const lastName  = profile.name?.familyName  || profile.displayName?.split(' ').slice(1).join(' ') || '';
        const foto      = profile.photos?.[0]?.value || null;
        try {
            db.query('SELECT * FROM data_pengguna WHERE google_id = $1', [googleId], async (err, byGoogle) => {
                if (err) return done(err);
                if (byGoogle.rows.length > 0) {
                    db.query('UPDATE data_pengguna SET google_foto = $1 WHERE google_id = $2', [foto, googleId], () => {});
                    return done(null, byGoogle.rows[0]);
                }
                db.query('SELECT * FROM data_pengguna WHERE email = $1', [email], async (err2, byEmail) => {
                    if (err2) return done(err2);
                    if (byEmail.rows.length > 0) {
                        db.query('UPDATE data_pengguna SET google_id = $1, google_foto = $2, login_provider = \'google\', email_verified = true WHERE email = $3',
                            [googleId, foto, email], (err3) => {
                                if (err3) return done(err3);
                                db.query('SELECT * FROM data_pengguna WHERE email = $1', [email], (e, r) => done(null, r.rows[0]));
                            });
                    } else {
                        const sql = `INSERT INTO data_pengguna
                            (nama_depan, nama_belakang, email, google_id, google_foto, login_provider, email_verified, setuju_syarat, kode_verifikasi)
                            VALUES ($1, $2, $3, $4, $5, 'google', true, true, NULL) RETURNING *`;
                        db.query(sql, [firstName, lastName, email, googleId, foto], (err3, result) => {
                            if (err3) return done(err3);
                            const newUser = result.rows[0];
                            createNotification(newUser.id_pengguna, '🎉 Selamat Bergabung!',
                                `Halo ${firstName}! Akun RemindU kamu berhasil dibuat via Google. Mulai tambahkan task pertamamu!`,
                                'system');
                            done(null, newUser);
                        });
                    }
                });
            });
        } catch (e) { done(e); }
    }));

    passport.serializeUser((user, done) => done(null, user.id_pengguna));
    passport.deserializeUser((id, done) => {
        db.query('SELECT * FROM data_pengguna WHERE id_pengguna = $1', [id], (err, r) =>
            done(err, r.rows[0] || null));
    });
    console.log('✅ Google OAuth2 aktif');
} else {
    console.warn('⚠️  GOOGLE_CLIENT_ID/SECRET tidak ada di .env — Google Login dinonaktifkan');
}

// ============================================================
// AUTH ROUTES — GOOGLE OAUTH2
// ============================================================
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/google/failed' }),
    (req, res) => {
        const user = req.user;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
        const redirectUrl = `${frontendUrl}/auth-callback.html?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.nama_depan)}&provider=google`;
        res.redirect(redirectUrl);
    });
app.get('/auth/google/failed', (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
    res.redirect(`${frontendUrl}/login.html?error=google_failed`);
});
app.get('/auth/me', (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        const u = req.user;
        return res.json({
            id: u.id_pengguna,
            email: u.email,
            nama_depan: u.nama_depan,
            nama_belakang: u.nama_belakang,
            foto: u.google_foto,
            provider: u.login_provider
        });
    }
    res.status(401).json({ error: 'Tidak terautentikasi' });
});
app.post('/auth/logout', (req, res) => {
    req.logout?.(() => {});
    req.session?.destroy?.(() => {});
    res.json({ success: true });
});

// ============================================================
// API — GOOGLE ONE TAP / TOKEN VERIFY
// ============================================================
app.post('/api/auth/google-token', async (req, res) => {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Token Google tidak ada' });
    if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ error: 'Google Login tidak dikonfigurasi' });
    try {
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        const googleId = payload.sub;
        const email = payload.email || '';
        const firstName = payload.given_name || payload.name?.split(' ')[0] || 'User';
        const lastName = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '';
        const foto = payload.picture || null;
        db.query('SELECT * FROM data_pengguna WHERE google_id = $1 OR email = $2', [googleId, email], async (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            let user = results.rows[0];
            if (!user) {
                const sql = `INSERT INTO data_pengguna
                    (nama_depan, nama_belakang, email, google_id, google_foto, login_provider, email_verified, setuju_syarat)
                    VALUES ($1, $2, $3, $4, $5, 'google', true, true) RETURNING *`;
                const insertResult = await db.query(sql, [firstName, lastName, email, googleId, foto]);
                user = insertResult.rows[0];
                createNotification(user.id_pengguna, '🎉 Selamat Bergabung!',
                    `Halo ${firstName}! Akun RemindU kamu berhasil dibuat. Mulai produktif sekarang!`, 'system');
            } else if (!user.google_id) {
                await db.query('UPDATE data_pengguna SET google_id=$1, google_foto=$2, login_provider=\'google\', email_verified=true WHERE id_pengguna=$3',
                    [googleId, foto, user.id_pengguna]);
            }
            res.json({ success: true, email: user.email, nama_depan: user.nama_depan, provider: 'google' });
        });
    } catch (err) {
        console.error('Google token verify error:', err.message);
        res.status(401).json({ error: 'Token Google tidak valid: ' + err.message });
    }
});

// ============================================================
// API — AUTH LOKAL (Register / Login / Verify OTP)
// ============================================================
app.post('/api/register', async (req, res) => {
    const { firstName, lastName, email, password, terms } = req.body;
<<<<<<< HEAD
=======

>>>>>>> ca92e4ea01d740428cdafd5aff9a5c43050739f6
    if (!firstName || !lastName) return res.status(400).json({ error: 'Nama depan dan belakang wajib diisi' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email tidak valid' });
    if (!password || password.length < 8 || !/[a-z]/.test(password) || !/[0-9]/.test(password))
        return res.status(400).json({ error: 'Password minimal 8 karakter, huruf kecil & angka' });
    if (!terms) return res.status(400).json({ error: 'Harus menyetujui Terms & Conditions' });

<<<<<<< HEAD
    db.query('SELECT email FROM data_pengguna WHERE email = $1', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.rows.length > 0) return res.status(400).json({ error: 'Email sudah terdaftar' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const sql = `INSERT INTO data_pengguna (nama_depan, nama_belakang, email, kata_sandi, kode_verifikasi, setuju_syarat)
                     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_pengguna`;
        db.query(sql, [firstName, lastName, email, hashedPassword, otp, terms ? 1 : 0], async (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            console.log(`🔐 OTP untuk ${email}: ${otp}`);
            if (process.env.SMTP_USER) {
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || `"RemindU" <${process.env.SMTP_USER}>`,
                    to: email,
                    subject: '🔔 RemindU — Kode Verifikasi OTP',
                    html: `<div style="font-family:sans-serif;max-width:400px;margin:auto;padding:32px;background:#fff;border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,.08)"><h2 style="color:#8b5cf6">RemindU</h2><p>Hei <b>${firstName}</b>! Kode OTP kamu:</p><div style="background:#ede9fe;border-radius:12px;padding:20px;text-align:center;font-size:36px;font-weight:800;letter-spacing:8px;color:#7c3aed">${otp}</div><p style="color:#64748b;font-size:13px">Kode berlaku 10 menit. Jangan berikan ke siapapun.</p></div>`
                }).catch(e => console.warn('OTP email gagal:', e.message));
            }
            res.status(201).json({ message: 'Registrasi berhasil', otp });
        });
    });
});

app.post('/api/verify', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email dan OTP wajib' });
    db.query('SELECT kode_verifikasi FROM data_pengguna WHERE email = $1', [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.rows.length === 0) return res.status(404).json({ error: 'Email tidak ditemukan' });
        if (results.rows[0].kode_verifikasi !== otp) return res.status(400).json({ error: 'OTP salah' });
        db.query('UPDATE data_pengguna SET kode_verifikasi = NULL, email_verified = true WHERE email = $1', [email], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Verifikasi berhasil' });
        });
    });
});

app.post('/api/resend-otp', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email wajib' });
    db.query('SELECT nama_depan, kode_verifikasi FROM data_pengguna WHERE email = $1', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.rows.length === 0) return res.status(404).json({ error: 'Email tidak ditemukan' });
        if (!results.rows[0].kode_verifikasi) return res.status(400).json({ error: 'Akun sudah terverifikasi' });

        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        db.query('UPDATE data_pengguna SET kode_verifikasi = $1 WHERE email = $2', [newOtp, email], async (err) => {
            if (err) return res.status(500).json({ error: err.message });
            if (process.env.SMTP_USER) {
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || `"RemindU" <${process.env.SMTP_USER}>`,
                    to: email,
                    subject: '🔔 RemindU — OTP Baru',
                    html: `<div style="font-family:sans-serif;padding:24px"><h2 style="color:#8b5cf6">OTP Baru Kamu: <span style="letter-spacing:6px;">${newOtp}</span></h2><p>Berlaku 10 menit.</p></div>`
                }).catch(() => {});
            }
            res.json({ message: 'OTP baru terkirim', otp: newOtp });
        });
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib' });
    db.query('SELECT * FROM data_pengguna WHERE email = $1', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.rows.length === 0) return res.status(401).json({ error: 'Email atau password salah' });
        const user = results.rows[0];
        if (user.kode_verifikasi !== null) return res.status(403).json({ error: 'Akun belum diverifikasi. Cek OTP.' });
        if (!user.kata_sandi) return res.status(401).json({ error: 'Akun ini menggunakan Google Login. Silakan login via Google.' });
        const match = await bcrypt.compare(password, user.kata_sandi);
        if (!match) return res.status(401).json({ error: 'Email atau password salah' });
        res.json({ success: true, email: user.email, nama_depan: user.nama_depan });
    });
});

// ============================================================
// API — PROFILE
// ============================================================
app.get('/api/profile', (req, res) => {
=======
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
>>>>>>> ca92e4ea01d740428cdafd5aff9a5c43050739f6
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });
    db.query(
        'SELECT nama_depan, nama_belakang, email, nomor_telepon, email_notif, notif_h_sebelum, google_id, google_foto, login_provider FROM data_pengguna WHERE email = $1',
        [userEmail], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
            res.json(results.rows[0]);
        }
    );
});

<<<<<<< HEAD
app.put('/api/profile', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { firstName, lastName, newPassword, confirmPassword } = req.body;
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });
    if (!firstName || !lastName) return res.status(400).json({ error: 'Nama depan & belakang wajib' });

    if (newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) return res.status(400).json({ error: 'Konfirmasi password tidak cocok' });
        if (newPassword.length < 8 || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword))
            return res.status(400).json({ error: 'Password minimal 8 karakter, huruf kecil & angka' });
        const hashed = await bcrypt.hash(newPassword, 10);
        db.query('UPDATE data_pengguna SET nama_depan=$1, nama_belakang=$2, kata_sandi=$3 WHERE email=$4',
            [firstName, lastName, hashed, userEmail], (err, r) => {
                if (err) return res.status(500).json({ error: err.message });
                if (r.rowCount === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
                res.json({ success: true, message: 'Profil & password diperbarui' });
            });
    } else {
        db.query('UPDATE data_pengguna SET nama_depan=$1, nama_belakang=$2 WHERE email=$3',
            [firstName, lastName, userEmail], (err, r) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, message: 'Profil diperbarui' });
            });
    }
});

// ============================================================
// API — PRIVACY (email, password, telepon)
// ============================================================
app.put('/api/privacy', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { currentPassword, newPassword, newEmail, phone } = req.body;
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });

    getUserIdFromEmail(userEmail, async (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        db.query('SELECT kata_sandi FROM data_pengguna WHERE id_pengguna=$1', [userId], async (err, r) => {
            if (err) return res.status(500).json({ error: err.message });
            if (newPassword) {
                if (!currentPassword) return res.status(400).json({ error: 'Password saat ini wajib' });
                if (!r.rows[0].kata_sandi) return res.status(400).json({ error: 'Akun Google tidak bisa ganti password lokal dari sini' });
                const match = await bcrypt.compare(currentPassword, r.rows[0].kata_sandi);
                if (!match) return res.status(401).json({ error: 'Password saat ini salah' });
                if (newPassword.length < 8 || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword))
                    return res.status(400).json({ error: 'Password minimal 8 karakter, huruf kecil & angka' });
            }
            const updates = [];
            const vals = [];
            let idx = 1;
            if (newPassword) {
                const h = await bcrypt.hash(newPassword, 10);
                updates.push(`kata_sandi = $${idx++}`);
                vals.push(h);
            }
            if (newEmail) {
                const exist = await db.query('SELECT id_pengguna FROM data_pengguna WHERE email=$1', [newEmail]);
                if (exist.rows.length) return res.status(400).json({ error: 'Email sudah digunakan' });
                updates.push(`email = $${idx++}`);
                vals.push(newEmail);
            }
            if (phone) {
                updates.push(`nomor_telepon = $${idx++}`);
                vals.push(phone);
            }
            if (updates.length === 0) return res.json({ success: true, message: 'Tidak ada perubahan' });
            vals.push(userId);
            const sql = `UPDATE data_pengguna SET ${updates.join(', ')} WHERE id_pengguna = $${idx}`;
            db.query(sql, vals, (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                createNotification(userId, '🔒 Keamanan Diperbarui', 'Informasi keamanan akun berhasil diperbarui.', 'system');
                res.json({ success: true, newEmail: newEmail || userEmail });
            });
        });
    });
});

// ============================================================
// API — PENGATURAN NOTIFIKASI EMAIL
// ============================================================
app.get('/api/email-settings', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Unauthorized' });
    db.query('SELECT email_notif, notif_h_sebelum FROM data_pengguna WHERE email=$1', [userEmail], (err, r) => {
        if (err) return res.status(500).json({ error: err.message });
        if (r.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
        res.json({ email_notif: !!r.rows[0].email_notif, notif_h_sebelum: r.rows[0].notif_h_sebelum || 1 });
    });
});

app.put('/api/email-settings', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { email_notif, notif_h_sebelum } = req.body;
    if (!userEmail) return res.status(401).json({ error: 'Unauthorized' });
    db.query('UPDATE data_pengguna SET email_notif=$1, notif_h_sebelum=$2 WHERE email=$3',
        [email_notif, notif_h_sebelum, userEmail], (err, r) => {
            if (err) return res.status(500).json({ error: err.message });
            getUserIdFromEmail(userEmail, (userId) => {
                const msg = email_notif ? `Notifikasi email diaktifkan. Kamu akan diingatkan ${notif_h_sebelum} hari sebelum deadline.` : 'Notifikasi email dinonaktifkan.';
                createNotification(userId, '🔔 Pengaturan Notifikasi', msg, 'system');
            });
            res.json({ success: true });
        });
});

app.post('/api/email-settings/test', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Unauthorized' });
    if (!process.env.SMTP_USER) return res.status(503).json({ error: 'SMTP belum dikonfigurasi' });
    db.query('SELECT nama_depan FROM data_pengguna WHERE email=$1', [userEmail], async (err, r) => {
        if (err || r.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
        const sent = await sendReminderEmail(userEmail, r.rows[0].nama_depan, 'Test Reminder Task', 'study', new Date(Date.now() + 86400000), 24);
        res.json({ success: sent, message: sent ? 'Email test terkirim! Cek inbox kamu.' : 'Gagal kirim email. Cek konfigurasi SMTP.' });
    });
});

// ============================================================
// API — TASKS
// ============================================================
app.get('/api/tasks', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Unauthorized' });
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        db.query(
            'SELECT id_task, judul, notes, due_date, remind_at, kategori, selesai, dibuat_pada FROM tasks WHERE id_pengguna=$1 ORDER BY dibuat_pada DESC',
            [userId], (err, results) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(results.rows);
            }
        );
    });
=======
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
>>>>>>> ca92e4ea01d740428cdafd5aff9a5c43050739f6
});

app.post('/api/tasks', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { judul, kategori, notes, due_date, remind_at } = req.body;
<<<<<<< HEAD
    if (!userEmail) return res.status(401).json({ error: 'Unauthorized' });
    if (!judul?.trim()) return res.status(400).json({ error: 'Judul kosong' });
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        const sql = `INSERT INTO tasks (id_pengguna, judul, kategori, notes, due_date, remind_at)
                     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_task`;
        db.query(sql, [userId, judul, kategori || 'personal', notes || null, due_date || null, remind_at || null],
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                const newId = result.rows[0].id_task;
                createNotification(userId, '✅ Task Baru Ditambahkan', `"${judul}" berhasil ditambahkan ke kategori ${kategori}.`, 'reminder', newId);
                if (due_date && (new Date(due_date) - Date.now()) < 86400000 * 3) {
                    createNotification(userId, '⚡ Deadline Mepet!', `Task "${judul}" yang baru ditambahkan jatuh tempo dalam kurang dari 3 hari!`, 'deadline', newId);
                }
                res.status(201).json({ id_task: newId, judul, kategori, notes, due_date, remind_at, selesai: false });
            });
    });
=======
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
>>>>>>> ca92e4ea01d740428cdafd5aff9a5c43050739f6
});

app.put('/api/tasks/:id', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { selesai } = req.body;
<<<<<<< HEAD
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        db.query('UPDATE tasks SET selesai=$1 WHERE id_task=$2 AND id_pengguna=$3',
            [selesai, req.params.id, userId], (err, r) => {
                if (err) return res.status(500).json({ error: err.message });
                if (r.rowCount === 0) return res.status(404).json({ error: 'Task tidak ditemukan' });
                if (selesai) createNotification(userId, '🎉 Task Selesai!', 'Kamu menyelesaikan sebuah task. Kerja bagus!', 'achievement');
                res.json({ success: true });
            });
    });
});

app.delete('/api/tasks/:id', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        db.query('DELETE FROM tasks WHERE id_task=$1 AND id_pengguna=$2', [req.params.id, userId], (err, r) => {
            if (err) return res.status(500).json({ error: err.message });
            if (r.rowCount === 0) return res.status(404).json({ error: 'Task tidak ditemukan' });
            res.json({ success: true });
        });
    });
});

// ============================================================
// API — NOTIFICATIONS (semua query disesuaikan)
// ============================================================
app.get('/api/notifications', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Unauthorized' });
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        db.query(
            'SELECT id_notif, judul, pesan, tipe, waktu_kirim, status_baca FROM notifications WHERE id_pengguna=$1 ORDER BY waktu_kirim DESC LIMIT 50',
            [userId], (err, results) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(results.rows);
            }
        );
    });
=======
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
>>>>>>> ca92e4ea01d740428cdafd5aff9a5c43050739f6
});

app.put('/api/notifications/read-all', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
<<<<<<< HEAD
    if (!userEmail) return res.status(401).json({ error: 'Unauthorized' });
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        db.query('UPDATE notifications SET status_baca=true WHERE id_pengguna=$1', [userId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
=======
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });

    try {
        const userId = await getUserIdFromEmail(userEmail);
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });

        await db.query('UPDATE notifications SET status_baca = true WHERE id_pengguna = $1', [userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
>>>>>>> ca92e4ea01d740428cdafd5aff9a5c43050739f6
});

app.put('/api/notifications/:id/read', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
<<<<<<< HEAD
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        db.query('UPDATE notifications SET status_baca=true WHERE id_notif=$1 AND id_pengguna=$2',
            [req.params.id, userId], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
    });
=======
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
>>>>>>> ca92e4ea01d740428cdafd5aff9a5c43050739f6
});

app.delete('/api/notifications/:id', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
<<<<<<< HEAD
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        db.query('DELETE FROM notifications WHERE id_notif=$1 AND id_pengguna=$2', [req.params.id, userId], (err, r) => {
            if (err) return res.status(500).json({ error: err.message });
            if (r.rowCount === 0) return res.status(404).json({ error: 'Notifikasi tidak ditemukan' });
            res.json({ success: true });
        });
    });
});

// ============================================================
// API — STATISTICS (disesuaikan untuk PostgreSQL)
// ============================================================
app.get('/api/statistics', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Unauthorized' });
    getUserIdFromEmail(userEmail, (userId) => {
=======
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
>>>>>>> ca92e4ea01d740428cdafd5aff9a5c43050739f6
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });

        const result = await db.query(
            `SELECT
                COUNT(*) AS total,
<<<<<<< HEAD
                SUM(CASE WHEN selesai THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN NOT selesai THEN 1 ELSE 0 END) AS pending,
=======
                SUM(CASE WHEN selesai = true THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN selesai = false THEN 1 ELSE 0 END) AS pending,
>>>>>>> ca92e4ea01d740428cdafd5aff9a5c43050739f6
                SUM(CASE WHEN kategori = 'study' THEN 1 ELSE 0 END) AS study,
                SUM(CASE WHEN kategori = 'personal' THEN 1 ELSE 0 END) AS personal,
                SUM(CASE WHEN kategori = 'health' THEN 1 ELSE 0 END) AS health,
                SUM(CASE WHEN kategori = 'work' THEN 1 ELSE 0 END) AS work,
<<<<<<< HEAD
                SUM(CASE WHEN selesai AND dibuat_pada::date = CURRENT_DATE THEN 1 ELSE 0 END) AS completed_today,
                SUM(CASE WHEN dibuat_pada::date = CURRENT_DATE THEN 1 ELSE 0 END) AS created_today,
                SUM(CASE WHEN NOT selesai AND due_date IS NOT NULL AND due_date <= NOW() + INTERVAL '3 days' AND due_date > NOW() THEN 1 ELSE 0 END) AS near_deadline
            FROM tasks WHERE id_pengguna = $1
        `;
        db.query(sql, [userId], (err, r) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(r.rows[0]);
        });
    });
});

// ============================================================
// API — AI MOTIVASI PROXY
// ============================================================
app.post('/api/ai/motivasi', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { prompt } = req.body;
    if (!userEmail || !prompt) return res.status(400).json({ error: 'Email dan prompt wajib' });
    if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'AI service tidak tersedia' });
    try {
        const fetch = (await import('node-fetch')).default;
        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 500, messages: [{ role: 'user', content: prompt }] })
        });
        const data = await aiRes.json();
        if (!aiRes.ok) return res.status(aiRes.status).json({ error: data.error?.message || 'AI error' });
        const text = (data.content || []).map(c => c.text || '').join('');
        getUserIdFromEmail(userEmail, (userId) => {
            if (!userId) return;
            try {
                const p = JSON.parse(text.replace(/```json|```/g, '').trim());
                db.query('INSERT INTO ai_motivasi_log (id_pengguna, prompt, response_icon, response_title, response_msg) VALUES ($1, $2, $3, $4, $5)',
                    [userId, prompt.slice(0,500), p.icon||'✨', p.title||'', p.msg||''], () => {});
            } catch(_) {}
        });
        res.json({ text });
    } catch (err) {
        res.status(500).json({ error: 'AI error: ' + err.message });
    }
});

app.get('/api/ai/motivasi/history', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Unauthorized' });
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        db.query('SELECT response_icon, response_title, response_msg, dibuat_pada FROM ai_motivasi_log WHERE id_pengguna=$1 ORDER BY dibuat_pada DESC LIMIT 10',
            [userId], (err, r) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(r.rows);
            });
    });
=======
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
>>>>>>> ca92e4ea01d740428cdafd5aff9a5c43050739f6
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log(`\n✅ RemindU Server v2.0 berjalan di http://localhost:${PORT}`);
    console.log(`   Google OAuth : ${process.env.GOOGLE_CLIENT_ID ? '✅ Aktif' : '❌ Nonaktif'}`);
    console.log(`   Email SMTP   : ${process.env.SMTP_USER ? '✅ Aktif' : '❌ Nonaktif'}`);
    console.log(`   AI Anthropic : ${process.env.ANTHROPIC_API_KEY ? '✅ Aktif' : '❌ Nonaktif'}`);
    console.log('');
    startReminderCron();
});