(function () {
    var supabaseUrl = 'https://axygxrgqkqcjedrfbpld.supabase.co';
    var supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4eWd4cmdxa3FjamVkcmZicGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTkwNzYsImV4cCI6MjA5NjkzNTA3Nn0.ue4dCY_GAnbckotqM2IgTT_0vcVkglgQ0Gwst2dGaRk';

    if (!window.supabase || !window.supabase.createClient) {
        console.error('Supabase SDK belum ke-load. Pastikan <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> ada SEBELUM supabase-config.js');
        return;
    }
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
})();