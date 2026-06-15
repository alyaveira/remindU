// theme-init.js — Jalankan SEBELUM render untuk cegah flash
// Taruh <script src="theme-init.js"></script> di dalam <head>, sebelum CSS lain
(function() {
    const theme = localStorage.getItem('remindu_theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
})();
