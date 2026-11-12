import Image from 'next/image'

import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { Card } from '@/components/ui/card'
import { getAdminT } from '@/lib/admin-lang-server'

import { removeAsset } from '../actions'
import { AssetAltForm } from './asset-alt-form'
import { AssetUploader } from './asset-uploader'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'

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

async function NotConfigured() {
  const { t } = await getAdminT()
  return (
    <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted">
      {t('Unggah belum aktif. Isi')} <code className="font-mono">CLOUDINARY_CLOUD_NAME</code>,{' '}
      <code className="font-mono">CLOUDINARY_API_KEY</code>, {t('dan')}{' '}
      <code className="font-mono">CLOUDINARY_API_SECRET</code>{' '}
      {t('di environment, lalu deploy ulang.')}
    </p>
  )
}

function AssetPreview({ asset }: { asset: AssetView }) {
  return (
    <Image
      placeholder={SHIMMER_PLACEHOLDER}
      src={asset.url}
      alt={asset.alt_id ?? ''}
      width={asset.width ?? 640}
      height={asset.height ?? 400}
      sizes="(min-width: 768px) 320px, 100vw"
      className="h-auto w-full max-w-xs rounded-md border border-border object-cover"
    />
  )
}

export async function GalleryPanel({
  projectId,
  images,
  configured,
}: {
  projectId: string
  images: AssetView[]
  configured: boolean
}) {
  const { t } = await getAdminT()
  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-h3 font-semibold">{t('Galeri')}</h2>
        <p className="mt-1 text-sm text-muted">
          {t('Tangkapan layar untuk halaman detail project, tampil sesuai urutan unggah.')}
        </p>
      </div>
      {images.length === 0 ? <p className="text-sm text-muted">{t('Belum ada gambar.')}</p> : null}
      <ul className="grid gap-4 md:grid-cols-2">
        {images.map((image, i) => (
          <li key={image.id} className="flex flex-col gap-3 rounded-md border border-border p-3">
            <AssetPreview asset={image} />
            <AssetAltForm
              assetId={image.id}
              alt_id={image.alt_id ?? ''}
              alt_en={image.alt_en ?? ''}
            />
            <div>
              <ConfirmDelete
                itemLabel={t('gambar galeri {n}', { n: i + 1 })}
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
            buttonLabel={t('Tambah ke galeri')}
          />
        </div>
      ) : (
        <NotConfigured />
      )}
    </Card>
  )
}
