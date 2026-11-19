'use client'

// Galeri project di Admin → Projects, seperti di situs: bingkai jendela browser (alamat dengan
// slug yang bisa diketik), foto besar, dan deretan gambar kecil. Foto pertama = sampul dan ditekan
// untuk diganti; + menambah gambar; tong sampah menghapus foto yang sedang tampil.

import { ImagePlus, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import type { ReactNode } from 'react'

import { useAdminT } from '@/components/admin/admin-lang'
import { RemoveAssetButton } from '@/features/assets/components/remove-asset-button'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'

import { imageRatio } from '../browser-address'

// satu foto di galeri: gambar tersimpan (assetId) atau gambar baru yang belum diunggah
export type StageItem = {
  key: string
  url: string
  width: number | null
  height: number | null
  assetId?: string
}

export type ImageTarget = 'project-cover' | 'project-gallery'

export function ProjectGalleryEdit({
  items,
  current,
  hasCover,
  busy,
  host,
  slugField,
  onSelect,
  onPick,
  onRemovePending,
  onRefresh,
}: {
  items: StageItem[]
  /** indeks foto yang sedang tampil */
  current: number
  hasCover: boolean
  /** gambar sedang diunggah */
  busy: boolean
  host: string
  /** kolom slug di bilah alamat */
  slugField: ReactNode
  onSelect: (index: number) => void
  onPick: (target: ImageTarget, replaceCover?: boolean) => void
  onRemovePending: (index: number) => void
  onRefresh: () => void
}) {
  const t = useAdminT()
  const shown = items[current] ?? null
  const shownIsCover = hasCover && current === 0
  const galleryNumber = (i: number) => i - (hasCover ? 1 : 0) + 1
  const slotLabel = (i: number) =>
    hasCover && i === 0 ? t('Sampul') : t('gambar galeri {n}', { n: galleryNumber(i) })

  return (
    <div>
      <div className="pj-browser">
        <div className="pj-browser-bar">
          <span className="pj-browser-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          {/* alamat halaman project: bagian akhirnya (slug) diketik di sini seperti kolom alamat */}
          {/* di bilah sempit slug turun ke baris berikutnya utuh, alamat tidak dipatah */}
          <span className="pj-browser-url admin-tight flex flex-wrap items-center">
            <span aria-hidden="true" className="whitespace-nowrap">
              {host}/projects/
            </span>
            {slugField}
          </span>
        </div>
        <div className="group/cover relative">
          {shown ? (
            <div className="pd-stage" style={{ aspectRatio: imageRatio(items[0] ?? null) }}>
              {shown.assetId ? (
                <Image
                  key={shown.key}
                  placeholder={SHIMMER_PLACEHOLDER}
                  src={shown.url}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 1100px, 90vw"
                  className="object-contain"
                />
              ) : (
                // gambar yang baru dipilih (project baru): alamat sementara dari berkas
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={shown.key}
                  src={shown.url}
                  alt=""
                  className="absolute inset-0 size-full object-contain"
                />
              )}
              {/* garis putus-putus 6 px di dalam tepi foto, sama untuk sampul dan gambar galeri;
                  sampul ditekan untuk diganti (membuka pemilih berkas) */}
              {shownIsCover ? (
                <button
                  type="button"
                  onClick={() => onPick('project-cover', true)}
                  className="admin-editable absolute inset-1.5 cursor-pointer rounded-none [--editable-offset:0px] focus-visible:outline-2 focus-visible:outline-current"
                >
                  <span className="sr-only">{t('Ganti Sampul')}</span>
                </button>
              ) : (
                <div
                  aria-hidden="true"
                  className="admin-editable pointer-events-none absolute inset-1.5 rounded-none [--editable-offset:0px]"
                />
              )}
            </div>
          ) : busy ? (
            <span aria-hidden="true" className="skeleton block aspect-video w-full rounded-none" />
          ) : (
            <button
              type="button"
              onClick={() => onPick('project-cover')}
              className="admin-editable relative block aspect-video w-full cursor-pointer bg-surface-2 outline-offset-[-6px] [--editable-offset:-6px] focus-visible:outline-2 focus-visible:outline-current"
            >
              <span className="flex size-full flex-col items-center justify-center gap-2 text-sm text-muted">
                <ImagePlus className="size-6" aria-hidden="true" />
                {t('Sampul')}
              </span>
            </button>
          )}
          {shown ? (
            <span className="absolute top-3 right-3 rounded-md bg-bg/80">
              {shown.assetId ? (
                <RemoveAssetButton
                  assetId={shown.assetId}
                  label={slotLabel(current)}
                  onDone={onRefresh}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onRemovePending(current)}
                  aria-label={t('Hapus {item}', { item: slotLabel(current) })}
                  className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:text-danger"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              )}
            </span>
          ) : null}
        </div>
      </div>
      <div className="pd-thumbs">
        {items.map((img, i) => (
          <button
            key={img.key}
            type="button"
            aria-label={slotLabel(i)}
            aria-pressed={i === current}
            onClick={() => onSelect(i)}
          >
            {img.assetId ? (
              <Image
                placeholder={SHIMMER_PLACEHOLDER}
                src={img.url}
                alt=""
                fill
                sizes="76px"
                className="object-cover object-top"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img.url}
                alt=""
                className="absolute inset-0 size-full object-cover object-top"
              />
            )}
          </button>
        ))}
        {/* gambar yang sedang diunggah */}
        {busy ? (
          <span
            aria-hidden="true"
            className="skeleton shrink-0 rounded-lg"
            style={{ flex: '0 1 4.75rem', minWidth: '2.75rem', aspectRatio: '16 / 10' }}
          />
        ) : null}
        {/* + menambah gambar; tanpa sampul, gambar pertama menjadi sampul seperti di situs */}
        <button
          type="button"
          className="pd-add admin-editable"
          onClick={() => onPick(hasCover ? 'project-gallery' : 'project-cover')}
        >
          <Plus className="size-5" aria-hidden="true" />
          <span className="sr-only">{hasCover ? t('Tambah ke Galeri') : t('Sampul')}</span>
        </button>
      </div>
      {items.length > 1 ? (
        <p className="mt-3 text-center font-display text-base font-medium tracking-wide text-muted">
          {current + 1} / {items.length}
        </p>
      ) : null}
    </div>
  )
}
