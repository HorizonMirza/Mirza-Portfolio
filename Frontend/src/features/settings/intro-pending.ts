// Penanda "sudah dilihat" per sesi browser: pemberitahuan pembuka muncul sekali setiap situs dibuka
// (tab baru), tidak muncul lagi saat berpindah halaman (pilihan pemilik 2026-10-12).
export const INTRO_SEEN_KEY = 'intro-notice-seen'

// Atribut di <html> yang dipasang INTRO_PENDING_SCRIPT sebelum halaman tampil. Selama atribut ada,
// halaman ditutup layar hitam (globals.css), agar beranda tidak sempat terlihat sebelum kartu terbuka
// (permintaan pemilik 2026-10-19). IntroNotice melepasnya tepat sebelum kartu dibuka, atau bila kartu
// tidak dibuka.
export const INTRO_PENDING_ATTR = 'data-intro'

// Skrip sebaris di awal <body> (CSP halaman publik mengizinkan 'unsafe-inline'). Isinya tetap, bukan
// masukan pengguna. Browser otomatis (tes, Lighthouse) dan sesi yang sudah melihat kartu dilewati.
// Pengaman 5 detik: bila JavaScript gagal dimuat, layar hitam dilepas sendiri.
export const INTRO_PENDING_SCRIPT = `try{if(!navigator.webdriver&&sessionStorage.getItem('${INTRO_SEEN_KEY}')!=='1'){var d=document.documentElement;d.setAttribute('${INTRO_PENDING_ATTR}','pending');setTimeout(function(){d.removeAttribute('${INTRO_PENDING_ATTR}')},5000)}}catch(e){}`
