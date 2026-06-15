// ═══════════════════════════════════════════════════════════
//  lang.js — RemindU Global Translation File (Multi-Language)
//  Supported: id, en
// ═══════════════════════════════════════════════════════════

const TRANSLATIONS = {

  // ── INDONESIA ──────────────────────────────────────────
  id: {
    common: {
      save: "Simpan", cancel: "Batal", confirm: "Konfirmasi", back: "Kembali",
      next: "Selanjutnya", close: "Tutup", loading: "Memuat...", error: "Terjadi kesalahan",
      success: "Berhasil", search: "Cari", edit: "Edit", delete: "Hapus", yes: "Ya", no: "Tidak",
    },
    nav: {
      label_main: "Menu Utama", label_other: "Lainnya", home: "Beranda", calendar: "Kalender",
      notification: "Notifikasi", statistic: "Statistik", settings: "Pengaturan", profile: "Profil Saya", logout: "Keluar Akun",
    },
    welcome: {
      subtitle: "Mulai minimalkan tenggat waktu yang terlewat dan bangun alur kerja yang lebih seimbang hari ini.",
      btn_get_started: "Mulai Sekarang", txt_have_account: "Sudah punya akun?", btn_login: "Masuk",
    },
    verify: {
      title: "Verifikasi Akun", subtitle: "Masukkan 6 digit kode OTP yang telah dikirimkan ke alamat email terdaftar Anda untuk mengaktifkan akun.",
      placeholder_otp: "Masukkan kode OTP", btn_submit: "Verifikasi Sekarang", txt_no_code: "Belum menerima kode?", btn_resend: "Kirim Ulang",
      err_invalid_length: "Kode OTP harus berjumlah 6 digit lengkap!", err_failed: "Verifikasi gagal, periksa kode Anda kembali.",
      err_cooldown: "Harap tunggu sebelum meminta kode ulang!", alert_new_otp: "Kode OTP Baru Anda adalah:",
      alert_production_note: "(Pada mode produksi, kode dikirim via kotak masuk email)", success_msg: "🎉 Akun Anda berhasil diverifikasi dan diaktifkan!"
    },
    tambahtask: {
      title: "Tambah Pengingat", btn_back: "Kembali", label_judul: "Judul Pengingat / Tugas", placeholder_judul: "Contoh: Kuis Rekayasa Perangkat Lunak",
      label_kategori: "Kategori Pengingat", cat_school: "Kuliah", cat_work: "Kerja", cat_other: "Lainnya",
      label_deadline: "Waktu Jatuh Tempo (Deadline)", label_remind: "Ingatkan Saya Pada", label_catatan: "Catatan Deskripsi Tambahan (Opsional)",
      placeholder_catatan: "Tulis rincian tugas atau info tambahan di sini...", btn_submit: "Simpan Pengingat", btn_loading: "Menyimpan...",
      err_remind_time: "⚠️ Waktu pengingat alarm tidak boleh melampaui waktu jatuh tempo tugas!", success_add: "✅ Pengingat baru berhasil ditambahkan!"
    },
    task_detail: {
      title: "Detail Pengingat", loading: "Memuat detail pengingat...", btn_back: "Kembali", btn_edit: "Edit Task", no_alarm: "Tidak diatur",
      status_done: "Selesai", status_pending: "Belum Selesai", cat_school: "Kuliah", cat_work: "Kerja", cat_other: "Lainnya",
      no_notes: "Tidak ada catatan tambahan untuk tugas ini.", label_kategori: "Kategori", label_deadline: "Batas Waktu",
      label_remind: "Waktu Alarm", label_status: "Status", label_catatan: "Catatan Deskripsi", progress_label: "Progress waktu menuju deadline",
      progress_desc: "{percent}% waktu telah berlalu", edit_coming_soon: "Fitur edit task akan segera hadir.", err_no_id: "ID tugas tidak valid!", err_load: "Gagal memuat rincian data pengingat."
    },
    profile: {
      title: "Profil", sub: "Informasi akun kamu", edit: "Edit Profil", save: "Simpan Perubahan", name: "Nama", email: "Email",
      lang_modal_title: "Pilih Bahasa", modal_save: "Simpan"
    }
  },

  // ── ENGLISH ────────────────────────────────────────────
  en: {
    common: {
      save: "Save", cancel: "Cancel", confirm: "Confirm", back: "Back",
      next: "Next", close: "Close", loading: "Loading...", error: "An error occurred",
      success: "Success", search: "Search", edit: "Edit", delete: "Delete", yes: "Yes", no: "No",
    },
    nav: {
      label_main: "Main Menu", label_other: "Other", home: "Home", calendar: "Calendar",
      notification: "Notification", statistic: "Statistics", settings: "Settings", profile: "My Profile", logout: "Logout",
    },
    welcome: {
      subtitle: "Start minimizing missed deadlines and foster a more balanced workflow today.",
      btn_get_started: "Get Started", txt_have_account: "Already have an account?", btn_login: "Sign In",
    },
    verify: {
      title: "Account Verification", subtitle: "Enter the 6-digit OTP code sent to your registered email address to activate your account.",
      placeholder_otp: "Enter OTP code", btn_submit: "Verify Now", txt_no_code: "Didn't receive the code?", btn_resend: "Resend",
      err_invalid_length: "OTP code must be exactly 6 digits long!", err_failed: "Verification failed, please check your code again.",
      err_cooldown: "Please wait before requesting a new code!", alert_new_otp: "Your new OTP Code is:",
      alert_production_note: "(In production mode, the code is sent via email inbox)", success_msg: "🎉 Your account has been successfully verified and activated!"
    },
    tambahtask: {
      title: "Add Reminder", btn_back: "Back", label_judul: "Reminder / Task Title", placeholder_judul: "Example: Software Engineering Quiz",
      label_kategori: "Reminder Category", cat_school: "College", cat_work: "Work", cat_other: "Others",
      label_deadline: "Due Date (Deadline)", label_remind: "Remind Me At", label_catatan: "Additional Notes Description (Optional)",
      placeholder_catatan: "Write task details or additional info here...", btn_submit: "Save Reminder", btn_loading: "Saving...",
      err_remind_time: "⚠️ Alarm reminder time cannot exceed the task due date!", success_add: "✅ New reminder added successfully!"
    },
    task_detail: {
      title: "Reminder Details", loading: "Loading reminder details...", btn_back: "Back", btn_edit: "Edit Task", no_alarm: "Not set",
      status_done: "Completed", status_pending: "Pending", cat_school: "College", cat_work: "Work", cat_other: "Others",
      no_notes: "There are no additional notes for this task.", label_kategori: "Category", label_deadline: "Due Date",
      label_remind: "Alarm Time", label_status: "Status", label_catatan: "Notes Description", progress_label: "Time progress towards deadline",
      progress_desc: "{percent}% of time has elapsed", edit_coming_soon: "The edit task feature will be available soon.", err_no_id: "Invalid task ID!", err_load: "Failed to load reminder details."
    },
    profile: {
      title: "Profile", sub: "Your account information", edit: "Edit Profile", save: "Save Changes", name: "Name", email: "Email",
      lang_modal_title: "Choose Language", modal_save: "Save"
    }
  }
};

// ═══════════════════════════════════════════════════════════
//  CORE ENGINE TRANSLATION INTERPRETER
// ═══════════════════════════════════════════════════════════

const DEFAULT_LANG = "id";
let _lang = localStorage.getItem("remindu_lang") || DEFAULT_LANG;

/** Mengubah bahasa aktif sistem */
function setLang(code) {
  if (TRANSLATIONS[code]) {
    _lang = code;
    localStorage.setItem("remindu_lang", code);
  }
}

/** Mengambil kode bahasa aktif saat ini */
function getLang() { 
  return _lang; 
}

/** Menerjemahkan key (menggunakan dot-notation) */
function t(key, params, lang) {
  const dict = TRANSLATIONS[lang || _lang] || TRANSLATIONS[DEFAULT_LANG];
  const parts = key.split('.');
  let value = dict;
  
  for (const p of parts) {
    value = value?.[p];
    if (value === undefined) break;
  }
  
  if (value === undefined) {
    let fb = TRANSLATIONS[DEFAULT_LANG];
    for (const p of parts) { 
      fb = fb?.[p]; 
      if (!fb) break; 
    }
    value = fb || key;
  }
  
  if (params && typeof value === 'string') {
    Object.keys(params).forEach(pKey => {
      value = value.replace(`{${pKey}}`, params[pKey]);
    });
  }
  
  return value;
}

/** Memindai DOM dan otomatis menerjemahkan elemen ber-atribut i18n */
function applyLang(lang) {
  if (lang) setLang(lang);
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key));
  });
}

// Ekspor fungsi global
window.t = t;
window.applyLang = applyLang;
window.setLang = setLang;
window.getLang = getLang;