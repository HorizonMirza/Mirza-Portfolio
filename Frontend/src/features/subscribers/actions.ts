'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { type ActionResult, fail, ok, toActionError } from '@/lib/action-result'
import { writeAudit } from '@/lib/audit'
import { requireSuperAdmin } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'

// Hapus permanen (misalnya atas permintaan pemilik email). Email tidak dicatat di audit.
export async function deleteSubscriber(subscriberId: string): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    if (!z.uuid().safeParse(subscriberId).success) return fail('Permintaan tidak valid.')
    await getDb().$transaction(async (tx) => {
      const before = await tx.subscriber.findUniqueOrThrow({
        where: { id: subscriberId },
        select: { status: true, locale: true, createdAt: true },
      })
      await tx.subscriber.delete({ where: { id: subscriberId } })
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'delete',
        entity: 'Subscriber',
        entityId: subscriberId,
        before,
      })
    })
    revalidatePath('/admin', 'layout')
    return ok('Pelanggan dihapus.')
  } catch (error) {
    return toActionError(error)
  }
}
