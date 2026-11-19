// Penulisan baris SiteSetting bersama log auditnya (hanya server).

import 'server-only'

import type { Prisma } from '@backend/generated/prisma/client'
import { writeAudit } from '@backend/lib/audit'

import type { introSchema } from './schema'

// Satu baris SiteSetting (id 1) dipakai bersama oleh semua pengaturan, kartu pembuka, foto, dan warna
// GitHub. Menerima klien transaksi agar bisa disimpan bersama data lain dalam satu transaksi.
// Pemanggil yang me-revalidate cache 'settings'.
export async function writeSetting(
  tx: Prisma.TransactionClient,
  actorId: string,
  data: Prisma.SiteSettingUncheckedUpdateInput,
): Promise<void> {
  const before = await tx.siteSetting.findUnique({ where: { id: 1 } })
  const after = await tx.siteSetting.upsert({
    where: { id: 1 },
    create: { id: 1, ...data } as Prisma.SiteSettingUncheckedCreateInput,
    update: data,
  })
  await writeAudit(tx, {
    actorId,
    action: before ? 'update' : 'create',
    entity: 'SiteSetting',
    entityId: '1',
    before,
    after,
  })
}

// Isi kartu pembuka yang sudah lolos introSchema → kolom SiteSetting.
export function introSettingData(
  values: ReturnType<typeof introSchema.parse>,
): Prisma.SiteSettingUncheckedUpdateInput {
  return { introBody_id: values.introBody_id, introBody_en: values.introBody_en }
}
