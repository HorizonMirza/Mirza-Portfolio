import 'server-only'

import { getDb } from '@/lib/db'

import type { AssetView } from './components/asset-panels'

const assetSelect = {
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
}> {
  const p = await getDb().profile.findUnique({
    where: { id: 1 },
    select: { photo: { select: assetSelect }, cv: { select: assetSelect } },
  })
  return { photo: p?.photo ?? null, cv: p?.cv ?? null }
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
