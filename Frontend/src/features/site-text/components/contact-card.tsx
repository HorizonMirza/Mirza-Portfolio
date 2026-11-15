'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { useAdminT } from '@/components/admin/admin-lang'
import type { AssetView } from '@/features/assets/components/asset-panels'
import { RemoveAssetButton } from '@/features/assets/components/remove-asset-button'
import { useAssetPicker } from '@/features/assets/components/use-asset-picker'
import { useShownText } from './site-text-live'

// Kartu ID di halaman Kontak untuk admin (DESIGN.md bagian 152): tampil seperti kartu bertali di situs
// (tali pita, kartu kaca atau logam, foto, nama, jabatan, barcode, alamat situs) tetapi diam, supaya
// foto dan jabatannya bisa diedit langsung di tempat. Kartu di situs digambar di kanvas dan tidak
// bisa diketik. Foto ditekan untuk diganti (pemilih berkas lalu pemotong gambar).
export function ContactCard({
  name,
  photo,
  photoCrop,
  asset,
  configured,
  role,
}: {
  name: string
  photo: string
  // bagian foto yang dipakai (hanya untuk potret hero); foto dari admin dipakai utuh
  photoCrop?: { x: number; y: number; w: number; h: number }
  asset: AssetView | null
  configured: boolean
  role: React.ReactNode
}) {
  const t = useAdminT()
  const router = useRouter()
  const site = useShownText('Contact.cardSite')
  const picker = useAssetPicker({ configured, onDone: () => router.refresh() })
  const inset = photoCrop
    ? `inset(${photoCrop.y * 100}% ${(1 - photoCrop.x - photoCrop.w) * 100}% ${(1 - photoCrop.y - photoCrop.h) * 100}% ${photoCrop.x * 100}%)`
    : undefined
  return (
    <div
      className="id-card-admin hidden lg:mt-[calc(5.75rem+0.2*var(--text-h1))] lg:block"
      style={{ ['--editable-color' as string]: '#fff' }}
    >
      {/* tali pita bertulisan alamat situs */}
      <div className="id-card-strap" aria-hidden="true">
        <span>{`${site.toUpperCase()} · ${site.toUpperCase()} · ${site.toUpperCase()}`}</span>
      </div>
      <div className="id-card">
        <span className="id-card-slot" aria-hidden="true" />
        <div className="id-card-photo">
          <button
            type="button"
            onClick={() => picker.pick('contact-photo')}
            className="admin-editable absolute inset-0 block cursor-pointer overflow-hidden rounded-lg bg-linear-to-b from-[#ececee] to-[#d6d6da]"
          >
            <Image
              src={photo}
              alt=""
              fill
              sizes="176px"
              className="object-cover"
              style={{
                objectPosition: '50% 25%',
                // potongan kepala dan bahu dari potret hero
                ...(inset ? { objectViewBox: inset } : null),
              }}
            />
            <span className="sr-only">{t('Ganti foto kartu ID')}</span>
          </button>
          {asset ? (
            <span className="absolute top-1 right-1 z-10 rounded-md bg-black/50">
              <RemoveAssetButton
                assetId={asset.id}
                label={t('Foto kartu ID')}
                onDone={() => router.refresh()}
              />
            </span>
          ) : null}
        </div>
        <p
          className="id-card-name"
          // satu baris: huruf mengecil bila nama panjang, seperti di kanvas (19 px turun sampai 12 px)
          style={{ fontSize: Math.max(12, Math.min(19, 176 / (name.length * 0.53))) }}
        >
          {name}
        </p>
        <div className="id-card-role">{role}</div>
        <span className="id-card-barcode" aria-hidden="true" />
        <p className="id-card-site">{site.toUpperCase().split('').join(' ')}</p>
      </div>
      {picker.element}
    </div>
  )
}
