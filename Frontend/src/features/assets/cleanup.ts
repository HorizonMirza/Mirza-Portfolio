import 'server-only'

import type { Prisma } from '@/generated/prisma/client'
import { destroyRemoteAsset } from '@/lib/cloudinary'

export type RemovedAsset = { id: string; publicId: string; kind: string }

// Hapus baris Asset dari daftar id yang tidak lagi dipakai siapa pun (profil, project, galeri,
// pengalaman, hero). Dipanggil di dalam transaksi yang sama dengan penghapusan pemiliknya, setelah
// pemilik dihapus, sehingga sampul/galeri/logo/foto tidak tertinggal sebagai baris yatim (audit
// 2026-11-02, DB-01). Aset yang masih dipakai pemilik lain dibiarkan.
export async function deleteUnusedAssets(
  tx: Prisma.TransactionClient,
  ids: readonly (string | null | undefined)[],
): Promise<RemovedAsset[]> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))]
  if (unique.length === 0) return []
  const unused = await tx.asset.findMany({
    where: {
      id: { in: unique },
      profilePhoto: { is: null },
      profileCv: { is: null },
      projectCovers: { none: {} },
      projectImages: { none: {} },
      experiences: { none: {} },
      experiencePhotos: { none: {} },
      heroPortraitOf: { is: null },
      heroArmorOf: { is: null },
    },
    select: { id: true, publicId: true, kind: true },
  })
  if (unused.length > 0) {
    await tx.asset.deleteMany({ where: { id: { in: unused.map((a) => a.id) } } })
  }
  return unused
}

// Hapus berkasnya di Cloudinary setelah transaksi berhasil. Gagal tidak menggagalkan aksi admin
// (destroyRemoteAsset hanya mencatat), jadi data di database tetap konsisten.
export async function destroyRemoteAssets(removed: readonly RemovedAsset[]) {
  await Promise.all(
    removed.map((a) => destroyRemoteAsset(a.publicId, a.kind === 'DOCUMENT' ? 'raw' : 'image')),
  )
}
