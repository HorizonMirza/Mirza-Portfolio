import 'server-only'

import type { PublicImage } from '@/features/profile/public'

// Halaman publik hanya menampilkan gambar dari akun Cloudinary yang diizinkan next/image
// (next.config.ts), ditambah gambar bawaan repo: project contoh (public/demo/projects) dan
// tangkapan layar project dari PDF portofolio pemilik (public/images/projects), keduanya permintaan
// pemilik 2026-10-08. Gambar lain dilewati agar halaman tidak gagal render.
export const DEMO_IMAGE_PREFIX = '/demo/projects/'
export const REPO_IMAGE_PREFIXES = [DEMO_IMAGE_PREFIX, '/images/projects/']

export function safeImage<T extends PublicImage | null>(image: T): T | null {
  if (!image) return null
  if (REPO_IMAGE_PREFIXES.some((p) => image.url.startsWith(p)) && !image.url.includes('..'))
    return image
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim()
  if (!cloud) return null
  return image.url.startsWith(`https://res.cloudinary.com/${cloud}/`) ? image : null
}
