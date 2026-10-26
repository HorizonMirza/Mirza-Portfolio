// Tujuan unggahan dan batasannya. Dipakai di klien (cek awal) dan server (cek ulang).
export const UPLOAD_TARGETS = {
  'profile-photo': {
    label: 'Foto profil',
    kind: 'IMAGE',
    resourceType: 'image',
    folder: 'portfolio/profile',
    maxBytes: 5 * 1024 * 1024,
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
    label: 'Sampul project',
    kind: 'IMAGE',
    resourceType: 'image',
    folder: 'portfolio/projects',
    maxBytes: 5 * 1024 * 1024,
    formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    accept: 'image/jpeg,image/png,image/webp,image/avif',
  },
  'project-gallery': {
    label: 'Galeri project',
    kind: 'IMAGE',
    resourceType: 'image',
    folder: 'portfolio/projects',
    maxBytes: 5 * 1024 * 1024,
    formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    accept: 'image/jpeg,image/png,image/webp,image/avif',
  },
  // logo instansi di simpul timeline pengalaman (DESIGN.md bagian 38); PNG transparan paling rapi
  'experience-logo': {
    label: 'Logo instansi',
    kind: 'IMAGE',
    resourceType: 'image',
    folder: 'portfolio/experience',
    maxBytes: 2 * 1024 * 1024,
    formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    accept: 'image/jpeg,image/png,image/webp,image/avif',
  },
  'experience-photo': {
    label: 'Foto kegiatan',
    kind: 'IMAGE',
    resourceType: 'image',
    folder: 'portfolio/experience',
    maxBytes: 5 * 1024 * 1024,
    formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    accept: 'image/jpeg,image/png,image/webp,image/avif',
  },
  // Potret dan armor hero beranda (Admin → Pengaturan). Pembingkaian halaman (lubang wajah di nama,
  // posisi kepala, intip visor) dihitung dari foto bawaan, jadi pengganti harus berukuran sebanding
  // dan dibingkai sama. Latar transparan, maka tanpa JPG.
  'hero-portrait': {
    label: 'Potret hero',
    kind: 'IMAGE',
    resourceType: 'image',
    folder: 'portfolio/hero',
    maxBytes: 4 * 1024 * 1024,
    formats: ['png', 'webp', 'avif'],
    accept: 'image/png,image/webp,image/avif',
    ratio: { w: 1120, h: 1100, tolerance: 0.03, minWidth: 700 },
  },
  'hero-armor': {
    label: 'Armor hero',
    kind: 'IMAGE',
    resourceType: 'image',
    folder: 'portfolio/hero',
    maxBytes: 4 * 1024 * 1024,
    formats: ['png', 'webp', 'avif'],
    accept: 'image/png,image/webp,image/avif',
    ratio: { w: 1280, h: 1300, tolerance: 0.03, minWidth: 800 },
    // hiasan: tidak dibacakan pembaca layar, jadi tanpa teks alternatif
    decorative: true,
  },
} as const

export type UploadTarget = keyof typeof UPLOAD_TARGETS
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

export function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`
}
