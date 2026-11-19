// Tujuan unggahan gambar dan batasannya. Dipakai di klien (cek awal) dan server (cek ulang).
// Tiap tujuan: label, aspect (rasio pemotong gambar), folder Cloudinary, maxBytes, maxSide (sisi
// terpanjang hasil potong dalam piksel), formats, accept (input berkas), dan decorative (hiasan tanpa
// teks alternatif). Semua berupa gambar; CV diisi sebagai link, foto utama beranda dari repo.
export const UPLOAD_TARGETS = {
  'profile-photo': {
    label: 'Foto Profil',
    aspect: 1,
    folder: 'portfolio/profile',
    maxBytes: 5 * 1024 * 1024,
    maxSide: 2000,
    formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    accept: 'image/jpeg,image/png,image/webp,image/avif',
  },
  // kartu foto halaman About; kosong = foto profil
  'about-photo': {
    label: 'Foto Kartu About',
    aspect: 4 / 5,
    folder: 'portfolio/profile',
    maxBytes: 5 * 1024 * 1024,
    maxSide: 2000,
    formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    accept: 'image/jpeg,image/png,image/webp,image/avif',
  },
  'project-cover': {
    label: 'Sampul Project',
    aspect: 16 / 9,
    folder: 'portfolio/projects',
    maxBytes: 5 * 1024 * 1024,
    maxSide: 2000,
    formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    accept: 'image/jpeg,image/png,image/webp,image/avif',
  },
  'project-gallery': {
    label: 'Galeri Project',
    aspect: 16 / 9,
    folder: 'portfolio/projects',
    maxBytes: 5 * 1024 * 1024,
    maxSide: 2000,
    formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    accept: 'image/jpeg,image/png,image/webp,image/avif',
  },
  // logo instansi di simpul timeline pengalaman; PNG transparan paling rapi
  'experience-logo': {
    label: 'Logo Instansi',
    aspect: 1,
    folder: 'portfolio/experience',
    maxBytes: 2 * 1024 * 1024,
    maxSide: 512,
    formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    accept: 'image/jpeg,image/png,image/webp,image/avif',
  },
  'experience-photo': {
    label: 'Foto Kegiatan',
    aspect: 4 / 3,
    folder: 'portfolio/experience',
    maxBytes: 5 * 1024 * 1024,
    maxSide: 2000,
    formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    accept: 'image/jpeg,image/png,image/webp,image/avif',
  },
  // logo skill di globe Keahlian Teknis dan chip teknologi project (Admin → Home → Skill teknis).
  // Hiasan: nama skill selalu tertulis di sebelahnya, jadi tanpa teks alternatif. Persegi dengan
  // latar transparan paling rapi.
  'skill-logo': {
    label: 'Logo Skill',
    aspect: 1,
    folder: 'portfolio/skills',
    maxBytes: 1024 * 1024,
    maxSide: 512,
    formats: ['png', 'webp', 'avif', 'jpg', 'jpeg'],
    accept: 'image/png,image/webp,image/avif,image/jpeg',
    decorative: true,
  },
  // logo chip di kartu foto halaman About (kampus, perusahaan, atau lainnya); hiasan karena nama chip
  // selalu tertulis di sebelahnya
  'about-chip-logo': {
    label: 'Logo Chip Kartu',
    folder: 'portfolio/profile',
    maxBytes: 1024 * 1024,
    maxSide: 512,
    formats: ['png', 'webp', 'avif', 'jpg', 'jpeg'],
    accept: 'image/png,image/webp,image/avif,image/jpeg',
    aspect: 1,
    decorative: true,
  },
  // foto di kartu ID bertali halaman Contact (Admin → Contact); kosong = foto utama beranda
  'contact-photo': {
    label: 'Foto Kartu ID',
    aspect: 176 / 160,
    folder: 'portfolio/contact',
    maxBytes: 2 * 1024 * 1024,
    maxSide: 1024,
    formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    accept: 'image/jpeg,image/png,image/webp,image/avif',
  },
} as const

export type UploadTarget = keyof typeof UPLOAD_TARGETS

// Sisi terpanjang gambar hasil potong (piksel): logo 512, foto 2000, foto kartu ID 1024.
export function maxSideOf(target: UploadTarget): number {
  return UPLOAD_TARGETS[target].maxSide
}

export const UPLOAD_TARGET_KEYS = Object.keys(UPLOAD_TARGETS) as UploadTarget[]

export type UploadSignature = {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
  allowedFormats: string
}

type Spec = (typeof UPLOAD_TARGETS)[UploadTarget]

// Gambar yang butuh teks alternatif dua bahasa (semua gambar kecuali yang hiasan).
export function needsAlt(spec: Spec) {
  return !('decorative' in spec)
}
