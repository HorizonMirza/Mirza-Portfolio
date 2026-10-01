// Transisi "lingkaran meluas" dari sebuah tombol, dipakai tombol tema.
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
