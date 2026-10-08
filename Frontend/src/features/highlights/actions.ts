'use server'

import { z } from 'zod'

import { type ActionResult, fail, ok, toActionError, zodFieldErrors } from '@/lib/action-result'
import { writeAudit } from '@/lib/audit'
import { requireSuperAdmin } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import { revalidateContent } from '@/lib/revalidate'
import { emptyToNull } from '@/lib/validation'

import { highlightSchema } from './schema'

const idSchema = z.uuid()

export async function saveHighlight(
  highlightId: string | null,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireSuperAdmin()
    if (highlightId !== null && !idSchema.safeParse(highlightId).success)
      return fail('Data tidak valid.')
    const parsed = highlightSchema.safeParse(input)
    if (!parsed.success) return fail('Periksa kembali isian.', zodFieldErrors(parsed.error.issues))
    const data = { ...parsed.data, source: emptyToNull(parsed.data.source) }
    const saved = await getDb().$transaction(async (tx) => {
      if (highlightId) {
        const before = await tx.highlight.findUniqueOrThrow({ where: { id: highlightId } })
        const after = await tx.highlight.update({ where: { id: highlightId }, data })
        await writeAudit(tx, {
          actorId: admin.userId,
          action: 'update',
          entity: 'Highlight',
          entityId: highlightId,
          before,
          after,
        })
        return after
      }
      const created = await tx.highlight.create({ data })
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'create',
        entity: 'Highlight',
        entityId: created.id,
        after: created,
      })
      return created
    })
    revalidateContent('highlights')
    return ok(highlightId ? 'Angka disimpan.' : 'Angka ditambahkan.', { id: saved.id })
  } catch (error) {
    return toActionError(error)
  }
}

export async function deleteHighlight(highlightId: string): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    if (!idSchema.safeParse(highlightId).success) return fail('Data tidak valid.')
    await getDb().$transaction(async (tx) => {
      const before = await tx.highlight.findUniqueOrThrow({ where: { id: highlightId } })
      await tx.highlight.delete({ where: { id: highlightId } })
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'delete',
        entity: 'Highlight',
        entityId: highlightId,
        before,
      })
    })
    revalidateContent('highlights')
    return ok('Angka dihapus.')
  } catch (error) {
    return toActionError(error)
  }
}
