import { supabase } from './supabase-config.js';

/* ─── AUTH HELPERS ─────────────────────────────────────────── */

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = 'welcome.html';
        return null;
    }
    // Sync ke localStorage (untuk kompatibilitas kode lama)
    const stored = JSON.parse(localStorage.getItem('remindu_user') || '{}');
    if (!stored.email) {
        localStorage.setItem('remindu_user', JSON.stringify({
            email: user.email,
            uid: user.id,
            firstName: user.user_metadata?.nama_depan || user.email.split('@')[0]
        }));
    }
    return user;
}

export async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem('remindu_user');
    window.location.href = 'welcome.html';
}

/* ─── TASK HELPERS ─────────────────────────────────────────── */

export async function getTasks() {
    const user = await getCurrentUser();
    if (!user) return [];
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    if (error) { console.error('getTasks:', error); return []; }
    // Normalisasi field agar kompatibel dengan kode lama
    return (data || []).map(t => ({
        ...t,
        id_task: t.id,
        judul: t.title || t.judul,
        selesai: t.completed || t.selesai || false,
        due_date: t.due_date,
        kategori: t.category || t.kategori || 'personal',
        notes: t.notes,
        remind_at: t.remind_at,
        created_at: t.created_at
    }));
}

export async function createTask(payload) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Tidak terautentikasi');
    const { data, error } = await supabase
        .from('tasks')
        .insert([{
            user_id: user.id,
            judul: payload.judul,
            kategori: payload.kategori || 'personal',
            notes: payload.notes || null,
            due_date: payload.due_date || null,
            remind_at: payload.remind_at || null,
            selesai: false
        }])
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateTask(id, payload) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Tidak terautentikasi');
    const updateData = {};
    if ('selesai' in payload) { updateData.selesai = payload.selesai; }
    if ('judul' in payload) { updateData.judul = payload.judul; }
    if ('kategori' in payload) { updateData.kategori = payload.kategori; }
    if ('notes' in payload) updateData.notes = payload.notes;
    if ('due_date' in payload) updateData.due_date = payload.due_date;
    if ('remind_at' in payload) updateData.remind_at = payload.remind_at;
    const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteTask(id) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Tidak terautentikasi');
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    if (error) throw error;
}

/* ─── PROFILE HELPERS ──────────────────────────────────────── */

export async function getProfile() {
    const user = await getCurrentUser();
    if (!user) return null;
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    if (error && error.code !== 'PGRST116') { console.error('getProfile:', error); return null; }
    return data;
}

export async function updateProfile(payload) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Tidak terautentikasi');
    const { data, error } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            nama_depan: payload.firstName,
            nama_belakang: payload.lastName,
            nomor_telepon: payload.phone || null,
            updated_at: new Date().toISOString()
        })
        .select()
        .single();
    if (error) throw error;
    // Update display name di auth
    await supabase.auth.updateUser({
        data: { nama_depan: payload.firstName, nama_belakang: payload.lastName }
    });
    return data;
}

export async function changePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
}

export async function changeEmail(newEmail) {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
}

/* ─── DARK MODE HELPER ─────────────────────────────────────── */

export function applyTheme() {
    const theme = localStorage.getItem('remindu_theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
}

// Panggil ini di setiap halaman:
applyTheme();
