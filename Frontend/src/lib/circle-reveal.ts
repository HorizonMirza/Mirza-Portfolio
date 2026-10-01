// Transisi "lingkaran meluas" dari sebuah tombol, dipakai tombol tema dan tombol bahasa.
// Memakai View Transitions API bawaan browser + Web Animations (tanpa library). Tampilan lama diam
// di bawah, tampilan baru tampil lewat lingkaran yang tumbuh dari ukuran tombol sampai menutup layar.

const DURATION = 750
const EASING = 'cubic-bezier(0.65, 0, 0.35, 1)'

type Origin = { x: number; y: number; radius: number }

export function canAnimateViewTransition() {
  return (
    typeof document !== 'undefined' &&
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

// titik tengah dan jari-jari tombol, diukur saat ditekan (sebelum DOM berubah)
export function originOf(element: Element): Origin {
  const rect = element.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    radius: rect.width / 2,
  }
}

function animateReveal({ x, y, radius }: Origin) {
  const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  const root = document.documentElement
  root.animate(
    { clipPath: [`circle(${radius}px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
    { duration: DURATION, easing: EASING, pseudoElement: '::view-transition-new(root)' },
  )
  // menimpa fade bawaan (opacity + mix-blend-mode plus-lighter): tampilan lama tetap utuh sampai
  // tertutup lingkaran, tanpa tulisan lama dan baru bertumpuk
  for (const pseudoElement of ['::view-transition-old(root)', '::view-transition-new(root)']) {
    root.animate(
      { opacity: [1, 1], mixBlendMode: ['normal', 'normal'] },
      { duration: DURATION, pseudoElement },
    )
  }
}

// Untuk perubahan yang kita jalankan sendiri (ganti tema).
export function revealChange(origin: Origin, update: () => void) {
  const transition = document.startViewTransition(update)
  transition.ready.then(() => animateReveal(origin)).catch(() => {})
}

// Untuk ganti bahasa: halaman bahasa baru dimuat penuh, lalu browser menampilkannya lewat
// transisi antar-dokumen (cross-document view transition). Titik asal disimpan di sessionStorage
// dan dibaca skrip LANG_REVEAL_SCRIPT di halaman baru (event pagereveal).
export const LANG_REVEAL_KEY = 'mm-lang-reveal'

export function supportsCrossDocumentReveal() {
  return canAnimateViewTransition() && 'PageRevealEvent' in window
}

export function revealNextPage(origin: Origin, href: string) {
  try {
    sessionStorage.setItem(LANG_REVEAL_KEY, JSON.stringify(origin))
  } catch {
    // sessionStorage diblokir: tetap pindah bahasa, hanya tanpa animasi lingkaran
  }
  window.location.assign(href)
}

// Skrip statis (bukan isi dari pengguna) yang dipasang di <head> layout publik. Harus berjalan
// sebelum render pertama agar event pagereveal tertangkap. pageswap membatalkan transisi untuk
// pemuatan penuh lain, jadi hanya ganti bahasa yang memakai lingkaran.
export const LANG_REVEAL_SCRIPT = `(function(){var K='${LANG_REVEAL_KEY}';
addEventListener('pageswap',function(e){try{if(e.viewTransition&&!sessionStorage.getItem(K))e.viewTransition.skipTransition()}catch(_){}});
addEventListener('pagereveal',function(e){var raw=null;try{raw=sessionStorage.getItem(K);sessionStorage.removeItem(K)}catch(_){}
if(!e.viewTransition)return;if(!raw){e.viewTransition.skipTransition();return}
var o=JSON.parse(raw);e.viewTransition.ready.then(function(){var d=document.documentElement,
end=Math.hypot(Math.max(o.x,innerWidth-o.x),Math.max(o.y,innerHeight-o.y)),t={duration:${DURATION},easing:'${EASING}'};
d.animate({clipPath:['circle('+o.radius+'px at '+o.x+'px '+o.y+'px)','circle('+end+'px at '+o.x+'px '+o.y+'px)']},Object.assign({pseudoElement:'::view-transition-new(root)'},t));
['::view-transition-old(root)','::view-transition-new(root)'].forEach(function(p){d.animate({opacity:[1,1],mixBlendMode:['normal','normal']},{duration:${DURATION},pseudoElement:p})});}).catch(function(){})});})();`
