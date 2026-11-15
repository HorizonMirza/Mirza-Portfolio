'use client'

import { Upload } from 'lucide-react'

import { useAdminT } from '@/components/admin/admin-lang'
import { Button } from '@/components/ui/button'

import type { UploadTarget } from '../targets'
import { useAssetPicker } from './use-asset-picker'

// Tombol unggah untuk panel yang masih berbentuk kartu (galeri project, foto profil di Akun): membuka
// pemilih berkas langsung, lalu pemotong gambar (use-asset-picker). Tanpa teks alternatif.
export function AssetUploader({
  target,
  targetId,
  buttonLabel,
  onDone,
}: {
  target: UploadTarget
  targetId?: string
  buttonLabel?: string
  // dipanggil setelah berkas tersimpan (mis. Admin → Akun memuat ulang data dan kembali)
  onDone?: () => void
}) {
  const t = useAdminT()
  const picker = useAssetPicker({ configured: true, onDone: () => onDone?.() })
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={() => picker.pick(target, targetId)}
        disabled={picker.busy}
      >
        <Upload aria-hidden="true" />
        {picker.busy ? t('Memproses…') : (buttonLabel ?? t('Unggah'))}
      </Button>
      {picker.element}
    </>
  )
}
