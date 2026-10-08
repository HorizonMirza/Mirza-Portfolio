import 'server-only'

import type { PublicImage } from '@/features/profile/public'

// Halaman publik hanya menampilkan gambar dari akun Cloudinary yang diizinkan next/image
// (next.config.ts), ditambah gambar contoh bawaan repo untuk project contoh
// (public/demo/projects, permintaan pemilik 2026-10-08). Gambar lain dilewati agar halaman tidak
// gagal render.
export const DEMO_IMAGE_PREFIX = '/demo/projects/'

export function safeImage<T extends PublicImage | null>(image: T): T | null {
  if (!image) return null
  if (image.url.startsWith(DEMO_IMAGE_PREFIX) && !image.url.includes('..')) return image
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim()
  if (!cloud) return null
  return image.url.startsWith(`https://res.cloudinary.com/${cloud}/`) ? image : null
}
