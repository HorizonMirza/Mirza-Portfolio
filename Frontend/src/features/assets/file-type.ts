// Jenis berkas untuk pemeriksaan awal di pemilih foto. Sebagian browser memberi file.type kosong
// untuk format yang baru (mis. AVIF), sehingga berkas yang sah ditolak (audit 2026-11-17, BUG-10).
// Bila tipe kosong, jenisnya diturunkan dari ekstensi. Ini hanya kemudahan di klien: server tetap
// memeriksa hasil unggahan di Cloudinary (format, ukuran, folder).
const MIME_BY_EXTENSION: Record<string, string> = {
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  pdf: 'application/pdf',
}

export function resolveMime(name: string, type: string): string {
  if (type) return type
  const dot = name.lastIndexOf('.')
  if (dot < 0) return ''
  return MIME_BY_EXTENSION[name.slice(dot + 1).toLowerCase()] ?? ''
}
