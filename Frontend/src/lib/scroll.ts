// Gulir ke bagian paling atas halaman yang sedang dibuka (menu aktif dan foto profil di topbar).
// Halus, kecuali pengguna meminta gerak dikurangi. Hash (mis. #skills) dibuang agar URL ikut kembali
// ke atas halaman.
export function scrollToTop() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (window.location.hash) {
    history.replaceState(history.state, '', window.location.pathname + window.location.search)
  }
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
}
