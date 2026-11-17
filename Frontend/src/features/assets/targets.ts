// Tujuan unggahan dan batasannya. Dipakai di klien (cek awal) dan server (cek ulang).
export const UPLOAD_TARGETS = {
  'profile-photo': {
    label: 'Foto Profil',
    aspect: 1,
    kind: 'IMAGE',
    resourceType: 'image',
    folder: 'portfolio/profile',
    maxBytes: 5 * 1024 * 1024,
    // sisi terpanjang hasil potong (piksel), ditulis langsung per tujuan (audit 2026-11-17, EFF-05)
    maxSide: 2000,
    formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    accept: 'image/jpeg,image/png,image/webp,image/avif',
  },
  // kartu foto halaman Tentang (2026-11-10); kosong = foto profil
  'about-photo': {
    label: 'Foto Kartu About',
    aspect: 4 / 5,
    kind: 'IMAGE',
    resourceType: 'image',
    folder: 'portfolio/profile',
    maxBytes: 5 * 1024 * 1024,
    // sisi terpanjang hasil potong (piksel), ditulis langsung per tujuan (audit 2026-11-17, EFF-05)
    maxSide: 2000,
    formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    accept: 'image/jpeg,image/png,image/webp,image/avif',
  },
  'profile-cv': {
    label: 'CV (PDF)',
    kind: 'DOCUMENT',
    resourceType: 'raw',
    folder: 'portfolio/cv',
    maxBytes: 5 * 1024 * 1024,
    formats: ['pdf'],
    accept: 'application/pdf',
  },
  'project-cover': {
    label: 'Sampul Project',
    aspect: 16 / 9,
    kind: 'IMAGE',
    resourceType: 'image',
    folder: 'portfolio/projects',
    maxBytes: 5 * 1024 * 1024,
    // sisi terpanjang hasil potong (piksel), ditulis langsung per tujuan (audit 2026-11-17, EFF-05)
    maxSide: 2000,
    formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    accept: 'image/jpeg,image/png,image/webp,image/avif',
  },
  'project-gallery': {
    label: 'Galeri Project',
    aspect: 16 / 9,
    kind: 'IMAGE',
    resourceType: 'image',
    folder: 'portfolio/projects',
    maxBytes: 5 * 1024 * 1024,
    // sisi terpanjang hasil potong (piksel), ditulis langsung per tujuan (audit 2026-11-17, EFF-05)
    maxSide: 2000,
    formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    accept: 'image/jpeg,image/png,image/webp,image/avif',
  },
  // logo instansi di simpul timeline pengalaman (DESIGN.md bagian 38); PNG transparan paling rapi
  'experience-logo': {
    label: 'Logo Instansi',
    aspect: 1,
    kind: 'IMAGE',
    resourceType: 'image',
    folder: 'portfolio/experience',
    maxBytes: 2 * 1024 * 1024,
    // sisi terpanjang hasil potong (piksel), ditulis langsung per tujuan (audit 2026-11-17, EFF-05)
    maxSide: 512,
    formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    accept: 'image/jpeg,image/png,image/webp,image/avif',
  },
  'experience-photo': {
    label: 'Foto Kegiatan',
    aspect: 4 / 3,
    kind: 'IMAGE',
    resourceType: 'image',
    folder: 'portfolio/experience',
    maxBytes: 5 * 1024 * 1024,
    // sisi terpanjang hasil potong (piksel), ditulis langsung per tujuan (audit 2026-11-17, EFF-05)
    maxSide: 2000,
    formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    accept: 'image/jpeg,image/png,image/webp,image/avif',
  },
  // logo skill di globe Keahlian Teknis dan chip teknologi project (Admin → Home → Skill teknis,
  // 2026-11-12). Hiasan: nama skill selalu tertulis di sebelahnya, jadi tanpa teks alternatif.
  // Persegi dengan latar transparan paling rapi.
  'skill-logo': {
    label: 'Logo Skill',
    aspect: 1,
    kind: 'IMAGE',
    resourceType: 'image',
    folder: 'portfolio/skills',
    maxBytes: 1024 * 1024,
    // sisi terpanjang hasil potong (piksel), ditulis langsung per tujuan (audit 2026-11-17, EFF-05)
    maxSide: 512,
    formats: ['png', 'webp', 'avif', 'jpg', 'jpeg'],
    accept: 'image/png,image/webp,image/avif,image/jpeg',
    decorative: true,
  },
  // logo chip di kartu foto halaman Tentang (2026-11-15): logo kampus, perusahaan, atau lainnya;
  // hiasan karena nama chip selalu tertulis di sebelahnya
  'about-chip-logo': {
    label: 'Logo chip kartu',
    kind: 'IMAGE',
    resourceType: 'image',
    folder: 'portfolio/profile',
    maxBytes: 1024 * 1024,
    // sisi terpanjang hasil potong (piksel), ditulis langsung per tujuan (audit 2026-11-17, EFF-05)
    maxSide: 512,
    formats: ['png', 'webp', 'avif', 'jpg', 'jpeg'],
    accept: 'image/png,image/webp,image/avif,image/jpeg',
    aspect: 1,
    decorative: true,
  },
  // foto di kartu ID bertali halaman Kontak (Admin → Contact, 2026-11-15); kosong = potret hero
  'contact-photo': {
    label: 'Foto Kartu ID',
    aspect: 176 / 160,
    kind: 'IMAGE',
    resourceType: 'image',
    folder: 'portfolio/contact',
    maxBytes: 2 * 1024 * 1024,
    // sisi terpanjang hasil potong (piksel), ditulis langsung per tujuan (audit 2026-11-17, EFF-05)
    maxSide: 1024,
    formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    accept: 'image/jpeg,image/png,image/webp,image/avif',
  },
  // Potret dan armor hero beranda (Admin → Pengaturan). Pembingkaian halaman (lubang wajah di nama,
  // posisi kepala, intip visor) dihitung dari foto bawaan, jadi pengganti harus berukuran sebanding
  // dan dibingkai sama. Latar transparan, maka tanpa JPG.
  'hero-portrait': {
    label: 'Potret Hero',
    aspect: 1120 / 1100,
    kind: 'IMAGE',
    resourceType: 'image',
    folder: 'portfolio/hero',
    maxBytes: 4 * 1024 * 1024,
    // sisi terpanjang hasil potong (piksel), ditulis langsung per tujuan (audit 2026-11-17, EFF-05)
    maxSide: 2000,
    formats: ['png', 'webp', 'avif'],
    accept: 'image/png,image/webp,image/avif',
    ratio: { w: 1120, h: 1100, tolerance: 0.03, minWidth: 700 },
  },
} as const

export type UploadTarget = keyof typeof UPLOAD_TARGETS

// Sisi terpanjang gambar hasil potong (piksel), dari maxSide tiap tujuan: logo 512, foto 2000, foto
// kartu ID 1024. Dulu ditebak dari batas ukuran berkas (<= 2 MB berarti 512), sehingga foto kartu ID
// ikut 512 px hanya karena batas berkasnya 2 MB. Tujuan tanpa maxSide (PDF) tidak melewati pemotong
// gambar.
export function maxSideOf(target: UploadTarget): number {
  const spec = UPLOAD_TARGETS[target]
  return 'maxSide' in spec ? spec.maxSide : 2000
}
export const UPLOAD_TARGET_KEYS = Object.keys(UPLOAD_TARGETS) as UploadTarget[]

export type UploadSignature = {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
  resourceType: 'image' | 'raw'
  allowedFormats: string | null
}

type Spec = (typeof UPLOAD_TARGETS)[UploadTarget]

// Gambar yang butuh teks alternatif dua bahasa (semua gambar kecuali yang hiasan).
export function needsAlt(spec: Spec) {
  return spec.kind === 'IMAGE' && !('decorative' in spec)
}

// Pemeriksaan bentuk gambar untuk target yang punya `ratio`. Dipakai di browser (sebelum mengunggah)
// dan di server (sumber kebenaran). Mengembalikan pesan galat, atau null bila sesuai.
export function checkImageShape(
  spec: Spec,
  width: number | null | undefined,
  height: number | null | undefined,
): string | null {
  if (!('ratio' in spec)) return null
  if (!width || !height) return 'Ukuran gambar tidak terbaca.'
  const { w, h, tolerance, minWidth } = spec.ratio
  const target = w / h
  const actual = width / height
  if (Math.abs(actual / target - 1) > tolerance)
    return `Perbandingan gambar harus ${w}:${h} (sekitar ${target.toFixed(2)}), gambar ini ${width}×${height}.`
  if (width < minWidth) return `Lebar gambar minimal ${minWidth} px, gambar ini ${width} px.`
  return null
}
