import armor from '@/assets/hero-armor.webp'
import hero from '@/assets/hero-portrait.webp'
import avatar from '@/assets/profile-avatar.webp'
import photo from '@/assets/profile-photo.jpg'

// Foto profil bawaan (dari pemilik, diganti 2026-10-19). Dipakai selama belum ada foto yang diunggah
// lewat admin (Cloudinary); foto dari admin selalu didahulukan. Metadata kamera sudah dibuang.
export const DEFAULT_PROFILE_PHOTO = photo
// potongan wajah untuk lingkaran kecil (topbar, footer, login, panel admin): wajah yang sama dengan potret hero
// (revisi pemilik 2026-10-27), 320×320 berlatar transparan; lingkaran di sekitarnya berlatar putih di mode gelap dan hitam di mode terang (bg-text)
export const DEFAULT_PROFILE_AVATAR = avatar
// potret hero beranda (permintaan pemilik 2026-10-19): selalu foto ini, tangan bersilang, latar
// transparan, 4:5 dengan subjek rata bawah. Tidak diganti oleh foto dari admin.
export const HERO_PORTRAIT = hero
// Gambar kedua liquid mask di hero (pemilik 2026-10-19): armor dengan pose yang sama, diskalakan 1,3× dan
// diselaraskan ke HERO_PORTRAIT (mata dan lebar kepala sejajar); dari leher ke bawah (y 560) diregangkan
// vertikal 1,17× agar tangan bersilang jatuh di tangan foto. Bingkainya lebih besar
// 80 px di kiri-kanan dan 200 px di atas (dalam ukuran 1120×1100), agar jambul helm menjulang di atas foto.
export const HERO_ARMOR = armor
export const HERO_ARMOR_BLEED = { x: 80 / 1120, top: 200 / 1100 } as const

export const DEFAULT_PHOTO_ALT = {
  id: 'Foto Muhammad Mirza Wirya',
  en: 'Photo of Muhammad Mirza Wirya',
} as const
