import hero from '@/assets/hero-portrait.webp'
import avatar from '@/assets/profile-avatar.jpg'
import photo from '@/assets/profile-photo.jpg'

// Foto profil bawaan (dari pemilik, diganti 2026-10-19). Dipakai selama belum ada foto yang diunggah
// lewat admin (Cloudinary); foto dari admin selalu didahulukan. Metadata kamera sudah dibuang.
export const DEFAULT_PROFILE_PHOTO = photo
// potongan wajah untuk lingkaran kecil (topbar, login)
export const DEFAULT_PROFILE_AVATAR = avatar
// potret hero beranda (permintaan pemilik 2026-10-19): selalu foto ini, tangan bersilang, latar
// transparan, 4:5 dengan subjek rata bawah. Tidak diganti oleh foto dari admin.
export const HERO_PORTRAIT = hero

export const DEFAULT_PHOTO_ALT = {
  id: 'Foto Muhammad Mirza Wirya',
  en: 'Photo of Muhammad Mirza Wirya',
} as const
