// Bantuan kecil seputar View Transitions API (DESIGN.md bagian 2.4).

// HP dan tablet: layar sentuh tanpa hover. Laptop berlayar sentuh tetap dianggap desktop karena
// pointer utamanya halus (mouse/touchpad).
export function touchFirstDevice() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: none) and (pointer: coarse)').matches
  )
}

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

// Fungsi asli browser. Di perangkat sentuh document.startViewTransition sengaja ditutup agar React
// tidak memakainya untuk pindah halaman (components/site/page-transitions.tsx), tetapi tombol tema
// tetap boleh memakainya.
export function nativeStartViewTransition(): ((update: () => void) => ViewTransition) | null {
  if (typeof Document === 'undefined') return null
  const native = Document.prototype.startViewTransition
  return typeof native === 'function' ? (update) => native.call(document, update) : null
}
