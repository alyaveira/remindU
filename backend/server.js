// ============================================================
// server.js — RemindU Backend v2.0 (COMPLETE & FINAL)
// Node.js + Express + MySQL + Passport Google OAuth2
// + Nodemailer + node-cron
// ============================================================

require('dotenv').config();

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
    cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 hari
}));
app.use(passport.initialize());
app.use(passport.session());

// ============================================================
// HELPERS
// ============================================================
function getUserIdFromEmail(email, callback) {
    db.query('SELECT id_pengguna FROM data_pengguna WHERE email = ?', [email], (err, results) => {
        if (err || results.length === 0) return callback(null);
        callback(results[0].id_pengguna);
    });
}

function getUserById(id, callback) {
    db.query('SELECT * FROM data_pengguna WHERE id_pengguna = ?', [id], (err, results) => {
        if (err || results.length === 0) return callback(null);
        callback(results[0]);
    });
}

function createNotification(userId, judul, pesan, tipe = 'system', idTask = null) {
    const sql = 'INSERT INTO notifications (id_pengguna, judul, pesan, tipe, id_task) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [userId, judul, pesan, tipe, idTask], (err) => {
        if (err) console.error('Notif error:', err.message);
    });
}

// ============================================================
// NODEMAILER — SMTP TRANSPORT
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

// Verifikasi koneksi SMTP saat startup
transporter.verify((err, success) => {
    if (err) console.warn('⚠️  SMTP tidak terhubung:', err.message, '(fitur email dinonaktifkan)');
    else     console.log('✅ SMTP siap mengirim email');
});

// Fungsi kirim email reminder yang indah (HTML)
async function sendReminderEmail(userEmail, userName, taskTitle, taskCategory, dueDate, hoursLeft) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return false;

    const dueFormatted = new Date(dueDate).toLocaleString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long',
        day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const urgencyColor = hoursLeft <= 3 ? '#e53e3e' : hoursLeft <= 24 ? '#f97316' : '#8b5cf6';
    const urgencyText  = hoursLeft <= 3 ? '🚨 SEGERA!' : hoursLeft <= 24 ? '⚡ Hari ini!' : '📅 Mendekat';
    const catEmoji     = { study:'📚', personal:'🧑', health:'💪', work:'💼' }[taskCategory] || '📌';

    const html = `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  body{margin:0;padding:0;background:#f5f7fe;font-family:'Segoe UI',Arial,sans-serif;}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);}
  .header{background:linear-gradient(135deg,#8b5cf6,#6d28d9);padding:32px 28px;text-align:center;color:#fff;}
  .header h1{margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;}
  .header p{margin:8px 0 0;opacity:.85;font-size:14px;}
  .body{padding:28px;}
  .alert-box{background:${urgencyColor}18;border-left:4px solid ${urgencyColor};border-radius:12px;padding:14px 16px;margin-bottom:20px;}
  .alert-box span{color:${urgencyColor};font-weight:700;font-size:15px;}
  .task-card{background:#f8fafc;border-radius:16px;padding:20px;border:1px solid #edf2f7;margin-bottom:20px;}
  .task-title{font-size:20px;font-weight:700;color:#1e293b;margin:0 0 8px;}
  .task-meta{font-size:13px;color:#64748b;display:flex;flex-direction:column;gap:6px;}
  .task-meta span{display:flex;align-items:center;gap:8px;}
  .deadline{font-size:14px;font-weight:600;color:${urgencyColor};}
  .btn{display:block;width:fit-content;margin:0 auto 12px;background:#8b5cf6;color:#fff;text-decoration:none;padding:13px 32px;border-radius:40px;font-weight:700;font-size:15px;text-align:center;}
  .footer{background:#f8fafc;padding:20px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #edf2f7;}
  .logo-text{font-weight:800;background:linear-gradient(135deg,#1e3a8a,#8b5cf6,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>🔔 RemindU</h1>
    <p>Pengingat otomatis untuk produktivitasmu</p>
  </div>
  <div class="body">
    <div class="alert-box"><span>${urgencyText} ${hoursLeft <= 24 ? hoursLeft + ' jam lagi' : Math.ceil(hoursLeft/24) + ' hari lagi'}</span></div>
    <p style="color:#1e293b;margin:0 0 16px;">Hei <strong>${userName}</strong>! 👋 Kamu punya task yang akan segera jatuh tempo:</p>
    <div class="task-card">
      <div class="task-title">${catEmoji} ${taskTitle}</div>
      <div class="task-meta">
        <span>🏷️ Kategori: <strong>${taskCategory.charAt(0).toUpperCase() + taskCategory.slice(1)}</strong></span>
        <span>📅 Deadline: <strong class="deadline">${dueFormatted}</strong></span>
        <span>⏱️ Sisa waktu: <strong style="color:${urgencyColor}">${hoursLeft <= 24 ? hoursLeft + ' jam' : Math.ceil(hoursLeft/24) + ' hari'}</strong></span>
      </div>
    </div>
    <p style="color:#64748b;font-size:13px;line-height:1.6;margin-bottom:24px;">
      Jangan biarkan deadline ini terlewat! Selesaikan task ini tepat waktu untuk menjaga produktivitasmu tetap optimal. Setiap task yang selesai adalah satu langkah maju menuju tujuanmu. 💪
    </p>
    <a class="btn" href="${process.env.FRONTEND_URL || 'http://localhost:5500'}/home.html">Buka RemindU →</a>
  </div>
  <div class="footer">
    <p>Email ini dikirim otomatis oleh <span class="logo-text">RemindU</span></p>
    <p>Kamu menerima email ini karena mengaktifkan notifikasi email di RemindU.</p>
  </div>
</div>
</body></html>`;

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
// CRON JOB — CEK DEADLINE SETIAP 30 MENIT
// ============================================================
function startReminderCron() {
    // Jalankan setiap 30 menit: "*/30 * * * *"
    // Testing: "*/1 * * * *" (setiap menit)
    cron.schedule('*/30 * * * *', async () => {
        console.log(`🕐 [${new Date().toLocaleString('id-ID')}] Cron job: cek deadline task...`);

        const sql = `
            SELECT
                t.id_task, t.judul, t.kategori, t.due_date, t.id_pengguna,
                dp.email, dp.nama_depan, dp.email_notif, dp.notif_h_sebelum
            FROM tasks t
            JOIN data_pengguna dp ON t.id_pengguna = dp.id_pengguna
            WHERE
                t.selesai = 0
                AND t.due_date IS NOT NULL
                AND t.due_date > NOW()
                AND t.due_date <= DATE_ADD(NOW(), INTERVAL 3 DAY)
                AND dp.email_notif = 1
                AND dp.email IS NOT NULL
                AND dp.email != ''`;

        db.query(sql, async (err, tasks) => {
            if (err) { console.error('Cron DB error:', err.message); return; }
            if (tasks.length === 0) { console.log('   Tidak ada task mendekati deadline.'); return; }

            console.log(`   Ditemukan ${tasks.length} task mendekati deadline.`);

            for (const task of tasks) {
                const hoursLeft = Math.round((new Date(task.due_date) - Date.now()) / 3600000);
                const hSebelum  = task.notif_h_sebelum || 1;

                // Tentukan kapan harus kirim berdasarkan preferensi user
                const shouldSend = (
                    (hSebelum >= 72 && hoursLeft <= 72) ||
                    (hSebelum >= 48 && hoursLeft <= 48) ||
                    (hSebelum >= 24 && hoursLeft <= 24) ||
                    (hSebelum >= 3  && hoursLeft <= 3)
                );

                if (!shouldSend) continue;

                // Tentukan tipe reminder
                const tipeReminder = hoursLeft <= 3 ? '3jam' : hoursLeft <= 24 ? '24jam' : hoursLeft <= 48 ? '48jam' : '72jam';

                // Cek apakah sudah pernah kirim (prevent duplicate)
                const checkSql = 'SELECT id_log FROM email_reminder_log WHERE id_task = ? AND tipe_reminder = ?';
                db.query(checkSql, [task.id_task, tipeReminder], async (err2, existing) => {
                    if (err2 || existing.length > 0) return; // Sudah dikirim atau error

                    // Kirim email
                    const sent = await sendReminderEmail(
                        task.email,
                        task.nama_depan,
                        task.judul,
                        task.kategori,
                        task.due_date,
                        hoursLeft
                    );

                    if (sent) {
                        // Catat di log agar tidak double-send
                        db.query(
                            'INSERT INTO email_reminder_log (id_task, id_pengguna, tipe_reminder) VALUES (?, ?, ?)',
                            [task.id_task, task.id_pengguna, tipeReminder],
                            () => {}
                        );
                        // Buat notifikasi in-app juga
                        createNotification(
                            task.id_pengguna,
                            `📧 Email Pengingat Terkirim`,
                            `Email pengingat untuk task "${task.judul}" telah dikirim ke ${task.email}.`,
                            'reminder', task.id_task
                        );
                    }
                });
            }
        });
    });
    console.log('✅ Cron job reminder email aktif (setiap 30 menit)');
}

// ============================================================
// PASSPORT — GOOGLE OAUTH2 STRATEGY
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
            // 1. Cek apakah google_id sudah ada
            db.query('SELECT * FROM data_pengguna WHERE google_id = ?', [googleId], async (err, byGoogle) => {
                if (err) return done(err);

                if (byGoogle.length > 0) {
                    // User sudah ada via Google → update foto terbaru
                    db.query('UPDATE data_pengguna SET google_foto = ? WHERE google_id = ?', [foto, googleId], () => {});
                    return done(null, byGoogle[0]);
                }

                // 2. Cek apakah email sudah terdaftar (via local)
                db.query('SELECT * FROM data_pengguna WHERE email = ?', [email], async (err2, byEmail) => {
                    if (err2) return done(err2);

                    if (byEmail.length > 0) {
                        // Link akun lokal dengan Google
                        db.query(
                            'UPDATE data_pengguna SET google_id = ?, google_foto = ?, login_provider = "google", email_verified = 1 WHERE email = ?',
                            [googleId, foto, email],
                            (err3) => {
                                if (err3) return done(err3);
                                db.query('SELECT * FROM data_pengguna WHERE email = ?', [email], (e, r) => done(null, r[0]));
                            }
                        );
                    } else {
                        // 3. User baru via Google → buat akun baru
                        const sql = `
                            INSERT INTO data_pengguna
                                (nama_depan, nama_belakang, email, google_id, google_foto, login_provider, email_verified, setuju_syarat, kode_verifikasi)
                            VALUES (?, ?, ?, ?, ?, 'google', 1, 1, NULL)`;
                        db.query(sql, [firstName, lastName, email, googleId, foto], (err3, result) => {
                            if (err3) return done(err3);
                            db.query('SELECT * FROM data_pengguna WHERE id_pengguna = ?', [result.insertId], (e, r) => {
                                // Kirim notifikasi selamat datang
                                createNotification(result.insertId, '🎉 Selamat Bergabung!',
                                    `Halo ${firstName}! Akun RemindU kamu berhasil dibuat via Google. Mulai tambahkan task pertamamu!`,
                                    'system');
                                done(null, r[0]);
                            });
                        });
                    }
                });
            });
        } catch (e) { done(e); }
    }));

    passport.serializeUser((user, done) => done(null, user.id_pengguna));
    passport.deserializeUser((id, done) => {
        db.query('SELECT * FROM data_pengguna WHERE id_pengguna = ?', [id], (err, r) =>
            done(err, r[0] || null));
    });
    console.log('✅ Google OAuth2 aktif');
} else {
    console.warn('⚠️  GOOGLE_CLIENT_ID/SECRET tidak ada di .env — Google Login dinonaktifkan');
}

// ============================================================
// AUTH ROUTES — GOOGLE OAUTH2
// ============================================================

// Route: Mulai flow Google Login
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Route: Callback dari Google setelah user authorize
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/google/failed' }),
    (req, res) => {
        // Simpan ke session agar frontend bisa ambil via /auth/me
        const user = req.user;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
        // Redirect ke frontend dengan token info
        const redirectUrl = `${frontendUrl}/auth-callback.html?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.nama_depan)}&provider=google`;
        res.redirect(redirectUrl);
    }
);

// Route: Gagal login Google
app.get('/auth/google/failed', (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
    res.redirect(`${frontendUrl}/login.html?error=google_failed`);
});

// Route: Ambil data user yang sedang login (dari session)
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

// Route: Logout dari session
app.post('/auth/logout', (req, res) => {
    req.logout?.(() => {});
    req.session?.destroy?.(() => {});
    res.json({ success: true });
});

// ============================================================
// API — GOOGLE ONE TAP / TOKEN VERIFY (alternatif tanpa redirect)
// Dipakai oleh tombol Google Sign-In di frontend
// ============================================================
app.post('/api/auth/google-token', async (req, res) => {
    const { credential } = req.body; // JWT token dari Google One Tap
    if (!credential) return res.status(400).json({ error: 'Token Google tidak ada' });
    if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ error: 'Google Login tidak dikonfigurasi' });

    try {
        const client  = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket  = await client.verifyIdToken({
            idToken:  credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload   = ticket.getPayload();
        const googleId  = payload.sub;
        const email     = payload.email || '';
        const firstName = payload.given_name  || payload.name?.split(' ')[0] || 'User';
        const lastName  = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '';
        const foto      = payload.picture     || null;

        // Cek / buat user
        db.query('SELECT * FROM data_pengguna WHERE google_id = ? OR email = ?', [googleId, email], async (err, results) => {
            if (err) return res.status(500).json({ error: err.message });

            let user = results[0];

            if (!user) {
                // Buat user baru
                const sql = `
                    INSERT INTO data_pengguna
                        (nama_depan, nama_belakang, email, google_id, google_foto, login_provider, email_verified, setuju_syarat)
                    VALUES (?, ?, ?, ?, ?, 'google', 1, 1)`;
                const insertResult = await new Promise((resolve, reject) =>
                    db.query(sql, [firstName, lastName, email, googleId, foto], (e, r) => e ? reject(e) : resolve(r)));
                user = { id_pengguna: insertResult.insertId, email, nama_depan: firstName, nama_belakang: lastName, google_foto: foto, login_provider: 'google' };
                createNotification(user.id_pengguna, '🎉 Selamat Bergabung!',
                    `Halo ${firstName}! Akun RemindU kamu berhasil dibuat. Mulai produktif sekarang!`, 'system');
            } else if (!user.google_id) {
                // Link akun lokal
                await new Promise((resolve) =>
                    db.query('UPDATE data_pengguna SET google_id=?, google_foto=?, login_provider="google", email_verified=1 WHERE id_pengguna=?',
                        [googleId, foto, user.id_pengguna], resolve));
            }

            res.json({
                success: true,
                email:      user.email,
                nama_depan: user.nama_depan,
                provider:   'google'
            });
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
    if (!firstName || !lastName) return res.status(400).json({ error: 'Nama depan dan belakang wajib diisi' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email tidak valid' });
    if (!password || password.length < 8 || !/[a-z]/.test(password) || !/[0-9]/.test(password))
        return res.status(400).json({ error: 'Password minimal 8 karakter, huruf kecil & angka' });
    if (!terms) return res.status(400).json({ error: 'Harus menyetujui Terms & Conditions' });

    db.query('SELECT email FROM data_pengguna WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) return res.status(400).json({ error: 'Email sudah terdaftar' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        db.query(
            'INSERT INTO data_pengguna (nama_depan, nama_belakang, email, kata_sandi, kode_verifikasi, setuju_syarat) VALUES (?, ?, ?, ?, ?, ?)',
            [firstName, lastName, email, hashedPassword, otp, terms ? 1 : 0],
            async (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                console.log(`🔐 OTP untuk ${email}: ${otp}`);

                // Kirim OTP via email jika SMTP tersedia
                if (process.env.SMTP_USER) {
                    await transporter.sendMail({
                        from:    process.env.EMAIL_FROM || `"RemindU" <${process.env.SMTP_USER}>`,
                        to:      email,
                        subject: '🔔 RemindU — Kode Verifikasi OTP',
                        html:    `<div style="font-family:sans-serif;max-width:400px;margin:auto;padding:32px;background:#fff;border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,.08)"><h2 style="color:#8b5cf6">RemindU</h2><p>Hei <b>${firstName}</b>! Kode OTP kamu:</p><div style="background:#ede9fe;border-radius:12px;padding:20px;text-align:center;font-size:36px;font-weight:800;letter-spacing:8px;color:#7c3aed">${otp}</div><p style="color:#64748b;font-size:13px">Kode berlaku 10 menit. Jangan berikan ke siapapun.</p></div>`
                    }).catch(e => console.warn('OTP email gagal:', e.message));
                }

                res.status(201).json({ message: 'Registrasi berhasil', otp });
            }
        );
    });
});

app.post('/api/verify', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email dan OTP wajib' });
    db.query('SELECT kode_verifikasi FROM data_pengguna WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!results.length) return res.status(404).json({ error: 'Email tidak ditemukan' });
        if (results[0].kode_verifikasi !== otp) return res.status(400).json({ error: 'OTP salah' });
        db.query('UPDATE data_pengguna SET kode_verifikasi = NULL, email_verified = 1 WHERE email = ?', [email], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Verifikasi berhasil' });
        });
    });
});

app.post('/api/resend-otp', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email wajib' });
    db.query('SELECT nama_depan, kode_verifikasi FROM data_pengguna WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!results.length) return res.status(404).json({ error: 'Email tidak ditemukan' });
        if (!results[0].kode_verifikasi) return res.status(400).json({ error: 'Akun sudah terverifikasi' });

        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        db.query('UPDATE data_pengguna SET kode_verifikasi = ? WHERE email = ?', [newOtp, email], async (err) => {
            if (err) return res.status(500).json({ error: err.message });
            if (process.env.SMTP_USER) {
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || `"RemindU" <${process.env.SMTP_USER}>`,
                    to:   email,
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
    db.query('SELECT * FROM data_pengguna WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!results.length) return res.status(401).json({ error: 'Email atau password salah' });
        const user = results[0];
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
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Email tidak ditemukan' });
    db.query(
        'SELECT nama_depan, nama_belakang, email, nomor_telepon, email_notif, notif_h_sebelum, google_id, google_foto, login_provider FROM data_pengguna WHERE email = ?',
        [userEmail], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!results.length) return res.status(404).json({ error: 'User tidak ditemukan' });
            res.json(results[0]);
        }
    );
});

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
        db.query('UPDATE data_pengguna SET nama_depan=?, nama_belakang=?, kata_sandi=? WHERE email=?',
            [firstName, lastName, hashed, userEmail], (err, r) => {
                if (err) return res.status(500).json({ error: err.message });
                if (!r.affectedRows) return res.status(404).json({ error: 'User tidak ditemukan' });
                res.json({ success: true, message: 'Profil & password diperbarui' });
            });
    } else {
        db.query('UPDATE data_pengguna SET nama_depan=?, nama_belakang=? WHERE email=?',
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
        db.query('SELECT kata_sandi FROM data_pengguna WHERE id_pengguna=?', [userId], async (err, r) => {
            if (err) return res.status(500).json({ error: err.message });
            if (newPassword) {
                if (!currentPassword) return res.status(400).json({ error: 'Password saat ini wajib' });
                if (!r[0].kata_sandi) return res.status(400).json({ error: 'Akun Google tidak bisa ganti password lokal dari sini' });
                const match = await bcrypt.compare(currentPassword, r[0].kata_sandi);
                if (!match) return res.status(401).json({ error: 'Password saat ini salah' });
                if (newPassword.length < 8 || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword))
                    return res.status(400).json({ error: 'Password minimal 8 karakter, huruf kecil & angka' });
            }
            const updates = []; const vals = [];
            if (newPassword) { const h = await bcrypt.hash(newPassword, 10); updates.push('kata_sandi=?'); vals.push(h); }
            if (newEmail) {
                const exist = await new Promise(resolve => db.query('SELECT id_pengguna FROM data_pengguna WHERE email=?', [newEmail], (e,x) => resolve(x)));
                if (exist.length) return res.status(400).json({ error: 'Email sudah digunakan' });
                updates.push('email=?'); vals.push(newEmail);
            }
            if (phone) { updates.push('nomor_telepon=?'); vals.push(phone); }
            if (!updates.length) return res.json({ success: true, message: 'Tidak ada perubahan' });
            vals.push(userId);
            db.query(`UPDATE data_pengguna SET ${updates.join(',')} WHERE id_pengguna=?`, vals, (err, result) => {
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
    db.query('SELECT email_notif, notif_h_sebelum FROM data_pengguna WHERE email=?', [userEmail], (err, r) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!r.length) return res.status(404).json({ error: 'User tidak ditemukan' });
        res.json({ email_notif: !!r[0].email_notif, notif_h_sebelum: r[0].notif_h_sebelum || 1 });
    });
});

app.put('/api/email-settings', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { email_notif, notif_h_sebelum } = req.body;
    if (!userEmail) return res.status(401).json({ error: 'Unauthorized' });
    db.query(
        'UPDATE data_pengguna SET email_notif=?, notif_h_sebelum=? WHERE email=?',
        [email_notif ? 1 : 0, notif_h_sebelum || 1, userEmail],
        (err, r) => {
            if (err) return res.status(500).json({ error: err.message });
            getUserIdFromEmail(userEmail, (userId) => {
                const msg = email_notif ? `Notifikasi email diaktifkan. Kamu akan diingatkan ${notif_h_sebelum || 1} hari sebelum deadline.` : 'Notifikasi email dinonaktifkan.';
                createNotification(userId, '🔔 Pengaturan Notifikasi', msg, 'system');
            });
            res.json({ success: true });
        }
    );
});

// Route: Test kirim email reminder sekarang (untuk debugging)
app.post('/api/email-settings/test', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Unauthorized' });
    if (!process.env.SMTP_USER) return res.status(503).json({ error: 'SMTP belum dikonfigurasi' });
    db.query('SELECT nama_depan FROM data_pengguna WHERE email=?', [userEmail], async (err, r) => {
        if (err || !r.length) return res.status(404).json({ error: 'User tidak ditemukan' });
        const sent = await sendReminderEmail(userEmail, r[0].nama_depan, 'Test Reminder Task', 'study', new Date(Date.now() + 86400000), 24);
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
            'SELECT id_task, judul, notes, due_date, remind_at, kategori, selesai, dibuat_pada FROM tasks WHERE id_pengguna=? ORDER BY dibuat_pada DESC',
            [userId], (err, results) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(results);
            }
        );
    });
});

app.post('/api/tasks', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { judul, kategori, notes, due_date, remind_at } = req.body;
    if (!userEmail) return res.status(401).json({ error: 'Unauthorized' });
    if (!judul?.trim()) return res.status(400).json({ error: 'Judul kosong' });
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        db.query(
            'INSERT INTO tasks (id_pengguna, judul, kategori, notes, due_date, remind_at) VALUES (?,?,?,?,?,?)',
            [userId, judul, kategori || 'personal', notes || null, due_date || null, remind_at || null],
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                createNotification(userId, '✅ Task Baru Ditambahkan', `"${judul}" berhasil ditambahkan ke kategori ${kategori}.`, 'reminder', result.insertId);
                if (due_date && (new Date(due_date) - Date.now()) < 86400000 * 3) {
                    createNotification(userId, '⚡ Deadline Mepet!', `Task "${judul}" yang baru ditambahkan jatuh tempo dalam kurang dari 3 hari!`, 'deadline', result.insertId);
                }
                res.status(201).json({ id_task: result.insertId, judul, kategori, notes, due_date, remind_at, selesai: false });
            }
        );
    });
});

app.put('/api/tasks/:id', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { selesai } = req.body;
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        db.query('UPDATE tasks SET selesai=? WHERE id_task=? AND id_pengguna=?',
            [selesai, req.params.id, userId], (err, r) => {
                if (err) return res.status(500).json({ error: err.message });
                if (!r.affectedRows) return res.status(404).json({ error: 'Task tidak ditemukan' });
                if (selesai) createNotification(userId, '🎉 Task Selesai!', 'Kamu menyelesaikan sebuah task. Kerja bagus!', 'achievement');
                res.json({ success: true });
            });
    });
});

app.delete('/api/tasks/:id', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        db.query('DELETE FROM tasks WHERE id_task=? AND id_pengguna=?', [req.params.id, userId], (err, r) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!r.affectedRows) return res.status(404).json({ error: 'Task tidak ditemukan' });
            res.json({ success: true });
        });
    });
});

// ============================================================
// API — NOTIFICATIONS
// ============================================================
app.get('/api/notifications', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Unauthorized' });
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        db.query(
            'SELECT id_notif, judul, pesan, tipe, waktu_kirim, status_baca FROM notifications WHERE id_pengguna=? ORDER BY waktu_kirim DESC LIMIT 50',
            [userId], (err, results) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(results);
            }
        );
    });
});

app.put('/api/notifications/read-all', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Unauthorized' });
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        db.query('UPDATE notifications SET status_baca=1 WHERE id_pengguna=?', [userId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

app.put('/api/notifications/:id/read', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        db.query('UPDATE notifications SET status_baca=1 WHERE id_notif=? AND id_pengguna=?',
            [req.params.id, userId], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
    });
});

app.delete('/api/notifications/:id', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        db.query('DELETE FROM notifications WHERE id_notif=? AND id_pengguna=?', [req.params.id, userId], (err, r) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!r.affectedRows) return res.status(404).json({ error: 'Notifikasi tidak ditemukan' });
            res.json({ success: true });
        });
    });
});

// ============================================================
// API — STATISTICS
// ============================================================
app.get('/api/statistics', (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ error: 'Unauthorized' });
    getUserIdFromEmail(userEmail, (userId) => {
        if (!userId) return res.status(404).json({ error: 'User tidak ditemukan' });
        db.query(`
            SELECT
                COUNT(*) AS total,
                SUM(selesai=1) AS completed,
                SUM(selesai=0) AS pending,
                SUM(kategori='study') AS study,
                SUM(kategori='personal') AS personal,
                SUM(kategori='health') AS health,
                SUM(kategori='work') AS work,
                SUM(selesai=1 AND DATE(dibuat_pada)=CURDATE()) AS completed_today,
                SUM(DATE(dibuat_pada)=CURDATE()) AS created_today,
                SUM(selesai=0 AND due_date IS NOT NULL AND due_date <= DATE_ADD(NOW(), INTERVAL 3 DAY) AND due_date > NOW()) AS near_deadline
            FROM tasks WHERE id_pengguna=?`, [userId], (err, r) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(r[0]);
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
                db.query('INSERT INTO ai_motivasi_log (id_pengguna,prompt,response_icon,response_title,response_msg) VALUES (?,?,?,?,?)',
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
        db.query('SELECT response_icon,response_title,response_msg,dibuat_pada FROM ai_motivasi_log WHERE id_pengguna=? ORDER BY dibuat_pada DESC LIMIT 10',
            [userId], (err, r) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(r);
            });
    });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log(`\n✅ RemindU Server v2.0 berjalan di http://localhost:${PORT}`);
    console.log(`   Google OAuth : ${process.env.GOOGLE_CLIENT_ID ? '✅ Aktif' : '❌ Nonaktif (set GOOGLE_CLIENT_ID di .env)'}`);
    console.log(`   Email SMTP   : ${process.env.SMTP_USER ? '✅ Aktif (' + process.env.SMTP_USER + ')' : '❌ Nonaktif (set SMTP_USER di .env)'}`);
    console.log(`   AI Anthropic : ${process.env.ANTHROPIC_API_KEY ? '✅ Aktif' : '❌ Nonaktif'}`);
    console.log('');
    startReminderCron();
});