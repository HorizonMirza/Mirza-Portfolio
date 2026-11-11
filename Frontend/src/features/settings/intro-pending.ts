import type { IntroFrequency } from './options'

// Penanda "sudah dilihat" kartu pembuka. Frekuensinya diatur di Admin → Pengaturan (2026-11-11):
// - visit (bawaan, pilihan pemilik 2026-10-12): sekali setiap situs dibuka (tab baru), lewat sessionStorage
// - once: sekali saja di browser itu, lewat localStorage
// - weekly: muncul lagi bila terakhir dilihat lebih dari 7 hari lalu, lewat localStorage
// Kunci yang sama dipakai di kedua penyimpanan; localStorage berisi waktu terakhir dilihat (ms).
export const INTRO_SEEN_KEY = 'intro-notice-seen'
export const INTRO_WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function introSeen(frequency: IntroFrequency, now: number = Date.now()): boolean {
  try {
    if (frequency === 'visit') return sessionStorage.getItem(INTRO_SEEN_KEY) === '1'
    const last = localStorage.getItem(INTRO_SEEN_KEY)
    if (frequency === 'once') return last !== null
    return now - Number(last ?? 0) < INTRO_WEEK_MS
  } catch {
    return false
  }
}

export function markIntroSeen(frequency: IntroFrequency, now: number = Date.now()): void {
  try {
    if (frequency === 'visit') sessionStorage.setItem(INTRO_SEEN_KEY, '1')
    else localStorage.setItem(INTRO_SEEN_KEY, String(now))
  } catch {
    // penyimpanan diblokir: pemberitahuan bisa muncul lagi di halaman berikutnya
  }
}

// Atribut di <html> yang dipasang skrip di bawah sebelum halaman tampil. Selama atribut ada,
// kartu pemberitahuan (sudah ada di HTML) langsung ditampilkan menutupi layar lewat CSS (globals.css),
// agar beranda tidak sempat terlihat sebelum kartu terbuka (permintaan pemilik 2026-10-19) dan
// pengunjung tidak menunggu JavaScript untuk melihat isi (PERF-02). IntroNotice melepasnya tepat
// sebelum kartu dibuka sebagai modal, atau bila kartu tidak dibuka.
export const INTRO_PENDING_ATTR = 'data-intro'

// Versi sebaris introSeen untuk skrip di bawah (harus sama logikanya; diuji di tests/unit).
function seenExpression(frequency: IntroFrequency): string {
  const key = `'${INTRO_SEEN_KEY}'`
  if (frequency === 'visit') return `sessionStorage.getItem(${key})==='1'`
  if (frequency === 'once') return `localStorage.getItem(${key})!==null`
  return `Date.now()-Number(localStorage.getItem(${key})||0)<${INTRO_WEEK_MS}`
}

// Skrip sebaris di awal <body> (CSP halaman publik mengizinkan 'unsafe-inline'). Isinya dari daftar
// pilihan tetap, bukan masukan pengguna. Browser otomatis (tes, Lighthouse) dan pengunjung yang sudah
// melihat kartu dilewati. Pengaman 5 detik: bila JavaScript gagal dimuat, layar hitam dilepas sendiri.
export function introPendingScript(frequency: IntroFrequency): string {
  return `try{if(!navigator.webdriver&&!(${seenExpression(frequency)})){var d=document.documentElement;d.setAttribute('${INTRO_PENDING_ATTR}','pending');setTimeout(function(){d.removeAttribute('${INTRO_PENDING_ATTR}')},5000)}}catch(e){}`
}
