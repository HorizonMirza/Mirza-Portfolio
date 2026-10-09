import 'server-only'

import type { PublicImage } from '@/features/profile/public'

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
