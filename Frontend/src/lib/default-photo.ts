import avatar from '@/assets/profile-avatar.jpg'
import photo from '@/assets/profile-photo.jpg'

// Foto profil bawaan (dari pemilik, 2026-10-01). Dipakai selama belum ada foto yang diunggah
// lewat admin (Cloudinary); foto dari admin selalu didahulukan. Metadata kamera sudah dibuang.
export const DEFAULT_PROFILE_PHOTO = photo
// potongan wajah untuk lingkaran kecil (topbar, login)
export const DEFAULT_PROFILE_AVATAR = avatar

export const DEFAULT_PHOTO_ALT = {
  id: 'Foto Muhammad Mirza Wirya',
  en: 'Photo of Muhammad Mirza Wirya',
} as const
