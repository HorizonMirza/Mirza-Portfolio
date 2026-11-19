// Query berkas untuk halaman admin: foto dan CV profil, foto kartu kontak, foto utama, dan gambar
// project (hanya server).

import 'server-only'

import { getDb } from '@backend/lib/db'

import type { AssetView } from './asset-view'

// Kolom Asset yang membentuk AssetView; dipakai juga query domain lain.
export const assetSelect = {
  id: true,
  url: true,
  kind: true,
  bytes: true,
  width: true,
  height: true,
  alt_id: true,
  alt_en: true,
} as const

export async function getProfileAssets(): Promise<{
  photo: AssetView | null
  cv: AssetView | null
  aboutPhoto: AssetView | null
  aboutChipLogo: AssetView | null
}> {
  const p = await getDb().profile.findUnique({
    where: { id: 1 },
    select: {
      photo: { select: assetSelect },
      cv: { select: assetSelect },
      aboutPhoto: { select: assetSelect },
      aboutChipLogo: { select: assetSelect },
    },
  })
  return {
    photo: p?.photo ?? null,
    cv: p?.cv ?? null,
    aboutPhoto: p?.aboutPhoto ?? null,
    aboutChipLogo: p?.aboutChipLogo ?? null,
  }
}

export async function getContactPhotoAsset(): Promise<AssetView | null> {
  const row = await getDb().siteSetting.findUnique({
    where: { id: 1 },
    select: { contactPhoto: { select: assetSelect } },
  })
  return row?.contactPhoto ?? null
}

export async function getHeroPortraitAsset(): Promise<AssetView | null> {
  const row = await getDb().siteSetting.findUnique({
    where: { id: 1 },
    select: { heroPortrait: { select: assetSelect } },
  })
  return row?.heroPortrait ?? null
}

export async function getProjectAssets(
  projectId: string,
): Promise<{ cover: AssetView | null; images: AssetView[] }> {
  const p = await getDb().project.findUnique({
    where: { id: projectId },
    select: {
      cover: { select: assetSelect },
      images: { orderBy: { order: 'asc' }, select: { asset: { select: assetSelect } } },
    },
  })
  return { cover: p?.cover ?? null, images: p?.images.map((i) => i.asset) ?? [] }
}
