import 'server-only'

// Bentuk gambar yang dikirim ke halaman publik. Tinggal di lib/ karena lib/ tidak boleh mengimpor
// dari features/ (CLAUDE.md, audit 2026-10-31 GAP-13); domain di features/ mengimpornya dari sini.
export type PublicImage = {
  url: string
  width: number | null
  height: number | null
  alt_id: string | null
  alt_en: string | null
}

// Halaman publik hanya menampilkan gambar dari akun Cloudinary yang diizinkan next/image
// (next.config.ts), ditambah gambar bawaan repo: tangkapan layar project (public/images/projects,
// permintaan pemilik 2026-10-08). Gambar lain dilewati agar halaman tidak gagal render.
// Gambar project contoh (public/demo/projects) dihapus 2026-10-09: barisnya sudah dihapus migrasi
// 20261008170000_delete_all_projects dan tidak ada baris lain yang bisa merujuknya.
export const REPO_IMAGE_PREFIXES = ['/images/projects/']

export function safeImage<T extends PublicImage | null>(image: T): T | null {
  if (!image) return null
  if (REPO_IMAGE_PREFIXES.some((p) => image.url.startsWith(p)) && !image.url.includes('..'))
    return image
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim()
  if (!cloud) return null
  return image.url.startsWith(`https://res.cloudinary.com/${cloud}/`) ? image : null
}
