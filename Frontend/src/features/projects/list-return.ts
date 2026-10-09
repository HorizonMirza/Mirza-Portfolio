// Posisi gulir daftar project agar tombol "Semua project" di detail kembali ke tempat terakhir
// pengunjung, bukan ke atas (revisi pemilik 2026-10-09). Disimpan di sessionStorage (hanya tab
// ini); bila penyimpanan diblokir, daftar dibuka dari atas seperti biasa.

const SAVED_KEY = 'pj-list-scroll'
const RETURN_KEY = 'pj-list-return'

type Saved = { slug: string; y: number }

// dipanggil saat project di daftar ditekan
export function rememberListPosition(slug: string, y: number) {
  try {
    sessionStorage.setItem(SAVED_KEY, JSON.stringify({ slug, y: Math.round(y) } satisfies Saved))
  } catch {
    // penyimpanan diblokir: kembali ke daftar tetap berjalan, hanya dari atas
  }
}

// dipanggil tombol kembali di detail, tepat sebelum pindah ke daftar
export function markReturnToList(slug: string) {
  try {
    sessionStorage.setItem(RETURN_KEY, slug)
  } catch {
    // lihat di atas
  }
}

// Dibaca daftar saat dibuka. null: bukan kembali dari detail (biarkan gulir apa adanya).
// Angka: posisi tujuan (0 bila project itu tidak dibuka dari daftar di tab ini).
export function takeReturnPosition(): number | null {
  try {
    const slug = sessionStorage.getItem(RETURN_KEY)
    if (slug === null) return null
    sessionStorage.removeItem(RETURN_KEY)
    const saved = JSON.parse(sessionStorage.getItem(SAVED_KEY) ?? 'null') as Saved | null
    return saved && saved.slug === slug && Number.isFinite(saved.y) ? saved.y : 0
  } catch {
    return null
  }
}
