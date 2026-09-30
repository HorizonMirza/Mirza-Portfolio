import 'server-only'

import { getCloudinaryConfig } from '@/lib/cloudinary'

// Untuk halaman admin: tampilkan form unggah atau pesan "belum aktif".
export function isUploadConfigured() {
  return getCloudinaryConfig() !== null
}
