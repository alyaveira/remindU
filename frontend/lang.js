// ═══════════════════════════════════════════════════════════
//  lang.js — RemindU Global Translation File (Multi-Language)
//  Supported: id, en, zh, ja, nl
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
  },

  // ── MANDARIN (zh) ──────────────────────────────────────
  zh: {
    common: {
      save: "保存", cancel: "取消", confirm: "确认", back: "返回",
      next: "下一步", close: "关闭", loading: "加载中...", error: "发生错误",
      success: "成功", search: "搜索", edit: "编辑", delete: "删除", yes: "是", no: "否",
    },
    nav: {
      label_main: "主菜单", label_other: "其他", home: "首页", calendar: "日历",
      notification: "通知", statistic: "统计", settings: "设置", profile: "我的个人资料", logout: "退出登录",
    },
    welcome: {
      subtitle: "从今天开始，减少错过的截止日期，培养更平衡的工作流程。",
      btn_get_started: "现在开始", txt_have_account: "已有账户？", btn_login: "登录",
    },
    verify: {
      title: "账户验证", subtitle: "请输入发送到您注册电子邮箱的 6 位 OTP 验证码以激活您的账户。",
      placeholder_otp: "请输入OTP验证码", btn_submit: "立即验证", txt_no_code: "未收到验证码？", btn_resend: "重新发送",
      err_invalid_length: "OTP 验证码必须正好是 6 位数字！", err_failed: "验证失败，请重新检查您的代码。",
      err_cooldown: "请等待后再重新请求代码！", alert_new_otp: "您的新 OTP 验证码是：",
      alert_production_note: "（在生产模式下，验证码通过电子邮件收件箱发送）", success_msg: "🎉 您的账户已成功验证并激活！"
    },
    tambahtask: {
      title: "添加提醒", btn_back: "返回", label_judul: "提醒/任务标题", placeholder_judul: "例如：软件工程测验",
      label_kategori: "提醒分类", cat_school: "大学/学术", cat_work: "工作", cat_other: "其他",
      label_deadline: "截止日期 (Deadline)", label_remind: "在此时间提醒我", label_catatan: "附加备注说明（可选）",
      placeholder_catatan: "在此处编写任务详细信息或附加信息...", btn_submit: "保存提醒", btn_loading: "保存中...",
      err_remind_time: "⚠️ 闹钟提醒时间不能超过任务截止日期！", success_add: "✅ 成功添加新提醒！"
    },
    task_detail: {
      title: "提醒详情", loading: "正在加载提醒详情...", btn_back: "返回", btn_edit: "编辑任务", no_alarm: "未设置",
      status_done: "已完成", status_pending: "未完成", cat_school: "大学/学术", cat_work: "工作", cat_other: "其他",
      no_notes: "此任务没有其他备注。", label_kategori: "类别", label_deadline: "截止时间",
      label_remind: "闹钟时间", label_status: "状态", label_catatan: "备注描述", progress_label: "距离截止日期的进度",
      progress_desc: "已过去 {percent}% 的时间", edit_coming_soon: "编辑任务功能即将推出。", err_no_id: "无效的任务 ID！", err_load: "加载提醒详细信息失败。"
    },
    profile: {
      title: "个人资料", sub: "你的账号信息", edit: "编辑资料", save: "保存更改", name: "姓名", email: "邮箱",
      lang_modal_title: "选择语言", modal_save: "保存"
    }
  },

  // ── JEPANG (ja) ────────────────────────────────────────
  ja: {
    common: {
      save: "保存", cancel: "キャンセル", confirm: "確認", back: "戻る",
      next: "次へ", close: "閉じる", loading: "読み込み中...", error: "エラーが発生しました",
      success: "成功", search: "検索", edit: "編集", delete: "削除", yes: "はい", no: "いいえ",
    },
    nav: {
      label_main: "メインメニュー", label_other: "その他", home: "ホーム", calendar: "カレンダー",
      notification: "通知", statistic: "統計", settings: "設定", profile: "プロフィール", logout: "ログアウト",
    },
    welcome: {
      subtitle: "今日から締め切り遅れを最小限に抑え、よりバランスの取れたワークフローを構築しましょう。",
      btn_get_started: "今すぐ始める", txt_have_account: "すでにアカウントをお持ちですか？", btn_login: "ログイン",
    },
    verify: {
      title: "アカウント認証", subtitle: "アカウントを有効化するには、登録されたメールアドレスに送信された6桁のOTPコードを入力してください。",
      placeholder_otp: "OTPコードを入力", btn_submit: "今すぐ認証", txt_no_code: "コードが届かない場合", btn_resend: "再送する",
      err_invalid_length: "OTPコードは必ず6桁でなければなりません！", err_failed: "認証に失敗しました。コードを再度確認してください。",
      err_cooldown: "コードを再請求する前にしばらくお待ちください！", alert_new_otp: "あなたの新しいOTPコードは：",
      alert_production_note: "（本番モードでは、コードはメールの受信トレイに送信されます）", success_msg: "🎉 アカウントの認証と有効化が正常に完了しました！"
    },
    tambahtask: {
      title: "リマインダー追加", btn_back: "戻る", label_judul: "リマインダー / タスクのタイトル", placeholder_judul: "例：ソフトウェア工学のテスト",
      label_kategori: "リマインダーカテゴリ", cat_school: "大学・講義", cat_work: "仕事", cat_other: "その他",
      label_deadline: "期日 (締め切り時間)", label_remind: "通知時間", label_catatan: "追加メモ（オプション）",
      placeholder_catatan: "タスクの詳細や追加情報をここに入力...", btn_submit: "リマインダーを保存", btn_loading: "保存中...",
      err_remind_time: "⚠️ 通知時間はタスクの締め切り日時以降に設定することはできません！", success_add: "✅ 新しいリマインダーが正常に追加されました！"
    },
    task_detail: {
      title: "リマインダー詳細", loading: "リマインダー詳細を読み込み中...", btn_back: "戻る", btn_edit: "タスクを編集", no_alarm: "未設定",
      status_done: "完了", status_pending: "未完了", cat_school: "大学・講義", cat_work: "仕事", cat_other: "その他",
      no_notes: "このタスクに追加のメモはありません。", label_kategori: "カテゴリ", label_deadline: "締め切り期日",
      label_remind: "アラーム時刻", label_status: "ステータス", label_catatan: "説明メモ", progress_label: "締め切りまでの時間経過進行度",
      progress_desc: "時間が {percent}% 経過しました", edit_coming_soon: "タスク編集機能はまもなく利用可能になります。", err_no_id: "無効なタスクIDです！", err_load: "リマインダー詳細の読み込みに失敗しました。"
    },
    profile: {
      title: "プロフィール", sub: "アカウント情報", edit: "プロフィールを編集", save: "変更を保存", name: "名前", email: "メール",
      lang_modal_title: "言語を選択", modal_save: "保存"
    }
  },

  // ── BELANDA / DUTCH (nl) ────────────────────────────────
  nl: {
    common: {
      save: "Opslaan", cancel: "Annuleren", confirm: "Bevestigen", back: "Terug",
      next: "Volgende", close: "Sluiten", loading: "Laden...", error: "Er is een fout opgetreden",
      success: "Succes", search: "Zoeken", edit: "Bewerken", delete: "Verwijderen", yes: "Ja", no: "Nee",
    },
    nav: {
      label_main: "Hoofdmenu", label_other: "Overige", home: "Home", calendar: "Kalender",
      notification: "Notificaties", statistic: "Statistieken", settings: "Instellingen", profile: "Mijn Profiel", logout: "Uitloggen",
    },
    welcome: {
      subtitle: "Begin vandaag nog met het minimaliseren van gemiste deadlines en creëer een productievere werkstroom.",
      btn_get_started: "Nu Aan de Slag", txt_have_account: "Heb je al een account?", btn_login: "Inloggen",
    },
    verify: {
      title: "Account Verifiëren", subtitle: "Voer de 6-cijferige OTP-code in die naar je geregistreerde e-mailadres is verzonden om je account te activeren.",
      placeholder_otp: "Voer OTP-code in", btn_submit: "Nu Verifiëren", txt_no_code: "Geen code ontvangen?", btn_resend: "Opnieuw Verzenden",
      err_invalid_length: "OTP-code moet exact 6 cijfers lang zijn!", err_failed: "Verificatie mislukt, controleer je code opnieuw.",
      err_cooldown: "Wacht even voordat je een nieuwe code aanvraagt!", alert_new_otp: "Je nieuwe OTP-code is:",
      alert_production_note: "(In productiemodus wordt de code naar je e-mail verzonden)", success_msg: "🎉 Je account is succesvol geverifieerd en geactiveerd!"
    },
    tambahtask: {
      title: "Herinnering Toevoegen", btn_back: "Terug", label_judul: "Titel van Herinnering / Taak", placeholder_judul: "Bijv: Quiz Software Engineering",
      label_kategori: "Categorie", cat_school: "Studie", cat_work: "Werk", cat_other: "Overige",
      label_deadline: "Vervaldatum (Deadline)", label_remind: "Herinner Mij Om", label_catatan: "Aanvullende Opmerkingen (Optioneel)",
      placeholder_catatan: "Schrijf hier taakdetails of extra info...", btn_submit: "Herinnering Opslaan", btn_loading: "Opslaan...",
      err_remind_time: "⚠️ De herinneringstijd mag niet na de vervaldatum van de taak liggen!", success_add: "✅ Nieuwe herinnering succesvol toegevoegd!"
    },
    task_detail: {
      title: "Details Herinnering", loading: "Herinneringsdetails laden...", btn_back: "Terug", btn_edit: "Taak Bewerken", no_alarm: "Niet ingesteld",
      status_done: "Voltooid", status_pending: "In Afwachting", cat_school: "Studie", cat_work: "Werk", cat_other: "Overige",
      no_notes: "Er zijn geen aanvullende opmerkingen voor deze taak.", label_kategori: "Categorie", label_deadline: "Vervaldatum",
      label_remind: "Alarmtijd", label_status: "Status", label_catatan: "Beschrijving", progress_label: "Tijdsvoortgang richting deadline",
      progress_desc: "{percent}% van de tijd is verstreken", edit_coming_soon: "De functie voor het bewerken van taken is binnenkort beschikbaar.", err_no_id: "Ongeldig taak-ID!", err_load: "Laden van herinneringsdetails mislukt."
    },
    profile: {
      title: "Profiel", sub: "Je accountinformatie", edit: "Profiel bewerken", save: "Wijzigingen opslaan", name: "Naam", email: "E-mail",
      lang_modal_title: "Taal kiezen", modal_save: "Opslaan"
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