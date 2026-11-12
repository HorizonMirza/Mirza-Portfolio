'use client'

import { FileText } from 'lucide-react'
import type { ReactNode } from 'react'

import { useAdminT } from '@/components/admin/admin-lang'
import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

import { removeAsset } from '../actions'
import { needsAlt, UPLOAD_TARGETS, type UploadTarget } from '../targets'
import { AssetAltForm } from './asset-alt-form'
import type { AssetView } from './asset-panels'
import { AssetUploader } from './asset-uploader'

// Jendela kecil untuk berkas yang ditekan di pratinjau (DESIGN.md bagian 133 dan 136): teks
// alternatif, hapus, dan unggah pengganti. Dipakai foto beranda, foto kartu About, sampul project,
// dan berkas lain yang tampil di pratinjau.
export function AssetEditDialog({
  open,
  onClose,
  onDone,
  title,
  description,
  note,
  target,
  targetId,
  asset,
  configured,
}: {
  open: boolean
  onClose: () => void
  // setelah berkas tersimpan atau dihapus (muat ulang data)
  onDone: () => void
  title: string
  description?: string
  note?: ReactNode
  target: UploadTarget
  targetId?: string
  asset: AssetView | null
  configured: boolean
}) {
  const t = useAdminT()
  return (
    <Dialog open={open} onOpenChange={(value) => (value ? null : onClose())}>
      {open ? (
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogTitle>{t(title)}</DialogTitle>
          {description ? (
            <DialogDescription className="mt-1 text-sm text-muted">
              {t(description)}
            </DialogDescription>
          ) : null}
          {note ? <div className="mt-2 text-sm text-muted">{note}</div> : null}
          <div className="mt-5 flex flex-col gap-5">
            {asset ? (
              <div className="flex flex-col gap-3">
                {/* dokumen (mis. PDF CV): tautan untuk membuka berkas yang sedang dipakai */}
                {asset.kind === 'DOCUMENT' ? (
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md border border-border px-3 text-sm hover:bg-surface-2"
                  >
                    <FileText className="size-4" aria-hidden="true" />
                    {t('Buka berkas')}
                    <span className="sr-only">{t('(membuka tab baru)')}</span>
                  </a>
                ) : null}
                {needsAlt(UPLOAD_TARGETS[target]) ? (
                  <AssetAltForm
                    key={asset.id}
                    assetId={asset.id}
                    alt_id={asset.alt_id ?? ''}
                    alt_en={asset.alt_en ?? ''}
                  />
                ) : null}
                <div>
                  <ConfirmDelete
                    itemLabel={t(title).toLowerCase()}
                    onConfirm={removeAsset.bind(null, asset.id)}
                    onDone={onDone}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">{t('Belum ada berkas.')}</p>
            )}
            {configured ? (
              <div className="border-t border-border pt-4">
                <AssetUploader
                  target={target}
                  targetId={targetId}
                  buttonLabel={asset ? t('Ganti berkas') : t('Unggah')}
                  onDone={onDone}
                />
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted">
                {t('Unggah belum aktif. Isi')}{' '}
                <code className="font-mono">CLOUDINARY_CLOUD_NAME</code>,{' '}
                <code className="font-mono">CLOUDINARY_API_KEY</code>, {t('dan')}{' '}
                <code className="font-mono">CLOUDINARY_API_SECRET</code>{' '}
                {t('di environment, lalu deploy ulang.')}
              </p>
            )}
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}
