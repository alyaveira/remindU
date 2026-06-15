// supabase-config.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ⚠️ GANTI dengan URL & anon key dari Supabase dashboard kamu
// Project Settings → API → Project URL & anon public key
const supabaseUrl = 'https://axygxrgqkqcjedrfbpld.supabase.co'; // URL dari pesan user
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4eWd4cmdxa3FjamVkcmZicGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTkwNzYsImV4cCI6MjA5NjkzNTA3Nn0.ue4dCY_GAnbckotqM2IgTT_0vcVkglgQ0Gwst2dGaRk'; // ← Project Settings → API → anon public

export const supabase = createClient(supabaseUrl, supabaseAnonKey);