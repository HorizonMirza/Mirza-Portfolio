// Alur: tanda tangan dari server → unggah langsung ke Cloudinary → server memverifikasi respons lalu
// mencatat Asset. Secret tidak pernah sampai ke browser. Berkas sudah di Cloudinary bila koneksi
// putus saat menyimpan: dicoba sekali lagi, dan yang tetap gagal dibersihkan cron harian setelah 48
// jam.

import type { ActionResult } from '@backend/lib/action-result'
import { attachUploadedAsset, signAssetUpload } from '@backend/features/assets/actions'
import type { UploadTarget } from '@backend/features/assets/targets'

export type UploadStage = 'menyiapkan' | 'mengunggah' | 'menyimpan'

export async function uploadAsset(
  target: UploadTarget,
  targetId: string | undefined,
  file: Blob,
  fileName: string,
  onStage?: (stage: UploadStage) => void,
): Promise<ActionResult | { ok: false; message: string; network: true }> {
  onStage?.('menyiapkan')
  const signed = await signAssetUpload(target)
  if (!signed.ok || !signed.data) return signed.ok ? { ok: false, message: signed.message } : signed
  const s = signed.data
  const body = new FormData()
  body.set('file', file, fileName)
  body.set('api_key', s.apiKey)
  body.set('timestamp', String(s.timestamp))
  body.set('signature', s.signature)
  body.set('folder', s.folder)
  body.set('allowed_formats', s.allowedFormats)
  onStage?.('mengunggah')
  let uploaded: unknown
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/image/upload`, {
      method: 'POST',
      body,
    })
    uploaded = await res.json()
    if (!res.ok) throw new Error('upload')
  } catch {
    return {
      ok: false,
      message: 'Unggah ke Cloudinary gagal. Periksa koneksi lalu coba lagi.',
      network: true,
    }
  }
  onStage?.('menyimpan')
  const attach = () => attachUploadedAsset(target, targetId ?? null, uploaded, null)
  try {
    return await attach()
  } catch {
    try {
      return await attach()
    } catch {
      return {
        ok: false,
        message: 'Berkas terunggah tetapi gagal disimpan. Periksa koneksi lalu unggah lagi.',
        network: true,
      }
    }
  }
}
