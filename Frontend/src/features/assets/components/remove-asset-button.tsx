'use client'

import { ConfirmDelete } from '@/components/admin/confirm-delete'

import { removeAsset } from '@backend/features/assets/actions'

// Tombol tong sampah kecil untuk menghapus gambar/berkas yang sedang dipakai (sesudah gambar bisa
// diganti langsung dari pemilih berkas, revisi 2026-11-15); hapus memakai konfirmasi.
export function RemoveAssetButton({
  assetId,
  label,
  onDone,
}: {
  assetId: string
  label: string
  onDone: () => void
}) {
  return (
    <ConfirmDelete
      title="Hapus Gambar"
      iconOnly
      itemLabel={label}
      onConfirm={() => removeAsset(assetId)}
      onDone={onDone}
    />
  )
}
