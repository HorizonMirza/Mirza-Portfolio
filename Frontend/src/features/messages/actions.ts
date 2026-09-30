'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { type ActionResult, fail, ok, toActionError } from '@/lib/action-result'
import { writeAudit } from '@/lib/audit'
import { requireSuperAdmin } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'

import { MESSAGE_STATUSES } from './schema'

const idSchema = z.uuid()
const statusSchema = z.enum(MESSAGE_STATUSES)

// Isi pesan, nama, dan email pengirim tidak pernah masuk log audit, hanya status.
export async function setMessageStatus(messageId: string, status: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const parsed = statusSchema.safeParse(status)
    if (!idSchema.safeParse(messageId).success || !parsed.success)
      return fail('Permintaan tidak valid.')
    await getDb().$transaction(async (tx) => {
      const before = await tx.message.findUniqueOrThrow({
        where: { id: messageId },
        select: { status: true, readAt: true },
      })
      if (before.status === parsed.data) return
      const after = await tx.message.update({
        where: { id: messageId },
        data: {
          status: parsed.data,
          readAt: parsed.data === 'NEW' ? null : (before.readAt ?? new Date()),
        },
        select: { status: true, readAt: true },
      })
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'update',
        entity: 'Message',
        entityId: messageId,
        before,
        after,
      })
    })
    revalidatePath('/admin', 'layout')
    const label = {
      NEW: 'Ditandai belum dibaca.',
      READ: 'Ditandai sudah dibaca.',
      ARCHIVED: 'Pesan diarsipkan.',
    }
    return ok(label[parsed.data])
  } catch (error) {
    return toActionError(error)
  }
}

export async function deleteMessage(messageId: string): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    if (!idSchema.safeParse(messageId).success) return fail('Permintaan tidak valid.')
    await getDb().$transaction(async (tx) => {
      const before = await tx.message.findUniqueOrThrow({
        where: { id: messageId },
        select: { status: true, createdAt: true },
      })
      await tx.message.delete({ where: { id: messageId } })
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'delete',
        entity: 'Message',
        entityId: messageId,
        before,
      })
    })
    revalidatePath('/admin', 'layout')
    return ok('Pesan dihapus.')
  } catch (error) {
    return toActionError(error)
  }
}
