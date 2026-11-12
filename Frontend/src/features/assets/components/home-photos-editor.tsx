'use client'

import Image, { type StaticImageData } from 'next/image'
import { useRouter } from 'next/navigation'
import { type ReactNode, useState } from 'react'

import { useAdminT } from '@/components/admin/admin-lang'
import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { HeroPreview } from '@/components/admin/hero-preview'
import { LiveStage } from '@/components/admin/live-edit'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'

import { removeAsset } from '../actions'
import type { UploadTarget } from '../targets'
import { AssetAltForm } from './asset-alt-form'
import type { AssetView } from './asset-panels'
import { AssetUploader } from './asset-uploader'

type Slot = 'profile' | 'hero'

const SLOTS: Record<
  Slot,
  { title: string; description: string; target: UploadTarget; label: string }
> = {
  profile: {
    title: 'Foto profil',
    description:
      'Foto bulat di kiri atas. Juga tampil di footer, kartu halaman Tentang, dan kartu ID halaman Kontak. Rasio persegi atau potret.',
    target: 'profile-photo',
    label: 'Ganti foto profil',
  },
  hero: {
    title: 'Foto utama',
    description:
      'Foto besar di beranda. WebP, PNG, atau AVIF dengan perbandingan sekitar 1120:1100, lebar minimal 700 px.',
    target: 'hero-portrait',
    label: 'Ganti foto utama',
  },
}

// Admin → Home, tab Foto beranda (DESIGN.md bagian 133): hero beranda tampil seperti di situs, dengan
// foto profil bulat di kiri atas seperti navbar. Foto ditekan untuk mengganti, menghapus, atau
// mengubah teks alternatifnya di jendela kecil; tanpa form di halaman.
export function HomePhotosEditor({
  name,
  profilePhoto,
  heroPortrait,
  defaultAvatar,
  defaultPortrait,
  configured,
}: {
  name: string
  profilePhoto: AssetView | null
  heroPortrait: AssetView | null
  defaultAvatar: StaticImageData
  defaultPortrait: StaticImageData
  configured: boolean
}) {
  const t = useAdminT()
  const router = useRouter()
  const [open, setOpen] = useState<Slot | null>(null)
  const done = () => {
    setOpen(null)
    router.refresh()
  }
  const assets: Record<Slot, AssetView | null> = { profile: profilePhoto, hero: heroPortrait }
  const ring =
    'rounded-md outline-offset-4 transition-[outline-color] hover:outline-2 hover:outline-current/30 focus-visible:outline-2 focus-visible:outline-current'

  function slotButton(slot: Slot, child: ReactNode, className?: string) {
    return (
      <button
        type="button"
        aria-label={t(SLOTS[slot].label)}
        onClick={() => setOpen(slot)}
        className={`${ring} ${className ?? ''}`}
      >
        {child}
      </button>
    )
  }

  const current = open ? SLOTS[open] : null
  const asset = open ? assets[open] : null

  return (
    <>
      <LiveStage>
        <HeroPreview
          name={name}
          portrait={heroPortrait?.url ?? defaultPortrait}
          portraitSlot={(image) => slotButton('hero', image, 'block size-full cursor-pointer')}
        >
          {/* foto profil bulat di kiri atas, seperti di navbar situs */}
          {slotButton(
            'profile',
            <Image
              placeholder={SHIMMER_PLACEHOLDER}
              src={profilePhoto?.url ?? defaultAvatar}
              alt=""
              width={56}
              height={56}
              sizes="56px"
              className="size-12 rounded-full bg-text object-cover sm:size-14"
            />,
            'absolute top-4 left-4 cursor-pointer rounded-full',
          )}
        </HeroPreview>
      </LiveStage>
      <Dialog open={open !== null} onOpenChange={(value) => (value ? null : setOpen(null))}>
        {current && open ? (
          <DialogContent className="max-h-[90dvh] overflow-y-auto">
            <DialogTitle>{t(current.title)}</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted">
              {t(current.description)}
            </DialogDescription>
            {open === 'hero' ? (
              <p className="mt-2 text-sm text-muted">
                {t(
                  'Pembingkaian halaman dan gambar armor dihitung dari foto bawaan, jadi pengganti harus dibingkai sama: kepala, wajah, dan tangan di posisi yang sama, rata bawah, latar transparan.',
                )}{' '}
                <a
                  href={defaultPortrait.src}
                  download
                  className="text-text underline underline-offset-4"
                >
                  {t('Unduh foto bawaan sebagai acuan')}
                </a>
                . {t('Hapus berkas untuk kembali ke foto bawaan.')}
              </p>
            ) : null}
            <div className="mt-5 flex flex-col gap-5">
              {asset ? (
                <div className="flex flex-col gap-3">
                  <AssetAltForm
                    key={asset.id}
                    assetId={asset.id}
                    alt_id={asset.alt_id ?? ''}
                    alt_en={asset.alt_en ?? ''}
                  />
                  <div>
                    <ConfirmDelete
                      itemLabel={t(current.title).toLowerCase()}
                      onConfirm={removeAsset.bind(null, asset.id)}
                      onDone={done}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted">{t('Belum ada berkas.')}</p>
              )}
              {configured ? (
                <div className="border-t border-border pt-4">
                  <AssetUploader
                    target={current.target}
                    buttonLabel={asset ? t('Ganti berkas') : t('Unggah')}
                    onDone={done}
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
    </>
  )
}
