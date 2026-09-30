import { FileText } from 'lucide-react'
import Image from 'next/image'

import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { Card } from '@/components/ui/card'

import { removeAsset } from '../actions'
import { formatBytes, type UploadTarget } from '../targets'
import { AssetAltForm } from './asset-alt-form'
import { AssetUploader } from './asset-uploader'

export type AssetView = {
  id: string
  url: string
  kind: 'IMAGE' | 'DOCUMENT'
  bytes: number | null
  width: number | null
  height: number | null
  alt_id: string | null
  alt_en: string | null
}

function NotConfigured() {
  return (
    <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted">
      Unggah belum aktif. Isi <code className="font-mono">CLOUDINARY_CLOUD_NAME</code>,{' '}
      <code className="font-mono">CLOUDINARY_API_KEY</code>, dan{' '}
      <code className="font-mono">CLOUDINARY_API_SECRET</code> di environment, lalu deploy ulang.
    </p>
  )
}

function AssetPreview({ asset, label }: { asset: AssetView; label: string }) {
  if (asset.kind === 'DOCUMENT') {
    return (
      <a
        href={asset.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm hover:bg-surface-2"
      >
        <FileText className="size-4" aria-hidden="true" />
        Lihat {label}
        {asset.bytes ? <span className="text-muted">({formatBytes(asset.bytes)})</span> : null}
      </a>
    )
  }
  return (
    <Image
      src={asset.url}
      alt={asset.alt_id ?? ''}
      width={asset.width ?? 640}
      height={asset.height ?? 400}
      sizes="(min-width: 768px) 320px, 100vw"
      className="h-auto w-full max-w-xs rounded-md border border-border object-cover"
    />
  )
}

// Satu slot berkas (foto profil, CV, sampul project): pratinjau, teks alternatif, ganti, hapus.
export function AssetSlot({
  title,
  description,
  target,
  targetId,
  asset,
  configured,
}: {
  title: string
  description?: string
  target: UploadTarget
  targetId?: string
  asset: AssetView | null
  configured: boolean
}) {
  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-h3 font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {asset ? (
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <AssetPreview asset={asset} label={title.toLowerCase()} />
          <div className="flex flex-1 flex-col gap-3">
            {asset.kind === 'IMAGE' ? (
              <AssetAltForm
                key={asset.id}
                assetId={asset.id}
                alt_id={asset.alt_id ?? ''}
                alt_en={asset.alt_en ?? ''}
              />
            ) : null}
            <div>
              <ConfirmDelete
                itemLabel={title.toLowerCase()}
                onConfirm={removeAsset.bind(null, asset.id)}
              />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">Belum ada berkas.</p>
      )}
      {configured ? (
        <div className="border-t border-border pt-4">
          <AssetUploader
            target={target}
            targetId={targetId}
            buttonLabel={asset ? 'Ganti berkas' : 'Unggah'}
          />
        </div>
      ) : (
        <NotConfigured />
      )}
    </Card>
  )
}

export function GalleryPanel({
  projectId,
  images,
  configured,
}: {
  projectId: string
  images: AssetView[]
  configured: boolean
}) {
  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-h3 font-semibold">Galeri</h2>
        <p className="mt-1 text-sm text-muted">
          Tangkapan layar untuk halaman detail project, tampil sesuai urutan unggah.
        </p>
      </div>
      {images.length === 0 ? <p className="text-sm text-muted">Belum ada gambar.</p> : null}
      <ul className="grid gap-4 md:grid-cols-2">
        {images.map((image, i) => (
          <li key={image.id} className="flex flex-col gap-3 rounded-md border border-border p-3">
            <AssetPreview asset={image} label={`gambar ${i + 1}`} />
            <AssetAltForm
              assetId={image.id}
              alt_id={image.alt_id ?? ''}
              alt_en={image.alt_en ?? ''}
            />
            <div>
              <ConfirmDelete
                itemLabel={`gambar galeri ${i + 1}`}
                onConfirm={removeAsset.bind(null, image.id)}
              />
            </div>
          </li>
        ))}
      </ul>
      {configured ? (
        <div className="border-t border-border pt-4">
          <AssetUploader
            target="project-gallery"
            targetId={projectId}
            buttonLabel="Tambah ke galeri"
          />
        </div>
      ) : (
        <NotConfigured />
      )}
    </Card>
  )
}
