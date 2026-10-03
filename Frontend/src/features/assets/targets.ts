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

export function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`
}
