// Status fitur unggah untuk halaman admin (hanya server).

import 'server-only'

import { getCloudinaryConfig } from '@backend/lib/cloudinary'

// Untuk halaman admin: tampilkan form unggah atau pesan "belum aktif".
export function isUploadConfigured() {
  return getCloudinaryConfig() !== null
}
