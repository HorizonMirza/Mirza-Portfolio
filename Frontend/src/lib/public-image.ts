import 'server-only'

import type { PublicImage } from '@/features/profile/public'

// Halaman publik hanya menampilkan gambar dari akun Cloudinary yang diizinkan next/image
// (next.config.ts). Gambar lain dilewati agar halaman tidak gagal render.
export function safeImage<T extends PublicImage | null>(image: T): T | null {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim()
  if (!image || !cloud) return null
  return image.url.startsWith(`https://res.cloudinary.com/${cloud}/`) ? image : null
}
