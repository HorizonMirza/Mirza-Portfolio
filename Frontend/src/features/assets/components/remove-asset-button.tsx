'use client'

// Tombol tong sampah kecil untuk menghapus gambar/berkas yang sedang dipakai (sesudah gambar bisa
// diganti langsung dari pemilih berkas); hapus memakai konfirmasi.

import { ConfirmDelete } from '@/components/admin/confirm-delete'

import { removeAsset } from '@backend/features/assets/actions'

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
