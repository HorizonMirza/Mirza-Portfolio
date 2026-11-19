// Bentuk gambar yang dikirim ke halaman publik dan penyaring asalnya (hanya server). Tinggal di lib/
// karena lib/ tidak boleh mengimpor dari features/; domain di features/ mengimpornya dari sini.

import 'server-only'

export type PublicImage = {
  url: string
  width: number | null
  height: number | null
  alt_id: string | null
  alt_en: string | null
}

// Halaman publik hanya menampilkan gambar dari akun Cloudinary yang diizinkan next/image
// (next.config.ts), ditambah gambar bawaan repo: tangkapan layar project (Frontend/public/images/projects).
// Gambar lain dilewati agar halaman tidak gagal render.
const REPO_IMAGE_PREFIXES = ['/images/projects/']

export function safeImage<T extends PublicImage | null>(image: T): T | null {
  if (!image) return null
  if (REPO_IMAGE_PREFIXES.some((p) => image.url.startsWith(p)) && !image.url.includes('..'))
    return image
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim()
  if (!cloud) return null
  return image.url.startsWith(`https://res.cloudinary.com/${cloud}/`) ? image : null
}
