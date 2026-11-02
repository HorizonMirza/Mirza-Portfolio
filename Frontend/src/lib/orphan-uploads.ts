import 'server-only'

import type { PrismaClient } from '@/generated/prisma/client'
import { destroyRemoteAsset, listRemoteResources, type RemoteResource } from '@/lib/cloudinary'

// Berkas di folder unggahan situs (semua target unggah memakai awalan ini, features/assets/targets.ts)
export const UPLOAD_PREFIX = 'portfolio/'
// Unggahan yang lebih muda dari ini dibiarkan: bisa jadi admin masih menyimpan atau baru gagal
// menyimpan dan akan mencoba lagi.
export const ORPHAN_MIN_AGE_MS = 48 * 60 * 60 * 1000
// Batas hapus per hari, agar kesalahan logika tidak pernah menghapus banyak berkas sekaligus.
export const ORPHAN_MAX_PER_RUN = 50

// Pilih berkas yatim: cukup tua dan tidak tercatat di tabel Asset.
export function pickOrphans(
  remote: readonly RemoteResource[],
  knownPublicIds: ReadonlySet<string>,
  now: number = Date.now(),
): RemoteResource[] {
  return remote
    .filter((r) => r.publicId.startsWith(UPLOAD_PREFIX))
    .filter((r) => !knownPublicIds.has(r.publicId))
    .filter((r) => {
      const created = Date.parse(r.createdAt)
      return Number.isFinite(created) && now - created > ORPHAN_MIN_AGE_MS
    })
    .slice(0, ORPHAN_MAX_PER_RUN)
}

// Unggahan ke Cloudinary yang berhasil tetapi tidak pernah tersimpan di database (mis. koneksi
// putus sebelum attachUploadedAsset) menjadi berkas tanpa pemilik. Cron harian menghapusnya
// (audit 2026-11-02, DB-07). Tanpa kunci Cloudinary atau bila API gagal: tidak melakukan apa pun.
export async function removeOrphanUploads(db: PrismaClient): Promise<number> {
  const remote = [
    ...(await listRemoteResources(UPLOAD_PREFIX, 'image')),
    ...(await listRemoteResources(UPLOAD_PREFIX, 'raw')),
  ]
  if (remote.length === 0) return 0
  const known = await db.asset.findMany({
    where: { publicId: { in: remote.map((r) => r.publicId) } },
    select: { publicId: true },
  })
  const orphans = pickOrphans(remote, new Set(known.map((a) => a.publicId)))
  for (const orphan of orphans) await destroyRemoteAsset(orphan.publicId, orphan.resourceType)
  return orphans.length
}
