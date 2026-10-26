'use server'

import { type ActionResult, fail, ok, toActionError } from '@/lib/action-result'
import { writeAudit } from '@/lib/audit'
import { requireSuperAdmin } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import { revalidateContent } from '@/lib/revalidate'

import { siteTextsSchema } from './schema'

// Audit membandingkan objek datar: satu entri per kunci dan bahasa, hanya yang terisi.
function snapshot(rows: { key: string; value_id: string | null; value_en: string | null }[]) {
  const out: Record<string, string> = {}
  for (const row of rows) {
    if (row.value_id) out[`${row.key}.id`] = row.value_id
    if (row.value_en) out[`${row.key}.en`] = row.value_en
  }
  return out
}

export async function saveSiteTexts(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const parsed = siteTextsSchema.safeParse(input)
    if (!parsed.success) {
      // path galat: values.<kunci>.<bahasa>; kunci memuat titik, jadi diambil dari belakang
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path.slice(1).join('.')
        if (path && !(path in fieldErrors)) fieldErrors[`values.${path}`] = issue.message
      }
      return fail('Periksa kembali isian.', fieldErrors)
    }
    await getDb().$transaction(async (tx) => {
      const before = await tx.siteText.findMany()
      const beforeByKey = new Map(before.map((row) => [row.key, row]))
      for (const [key, value] of Object.entries(parsed.data.values)) {
        const value_id = value.id || null
        const value_en = value.en || null
        const current = beforeByKey.get(key)
        if (!value_id && !value_en) {
          // dua-duanya kosong: kembali ke teks bawaan
          if (current) await tx.siteText.delete({ where: { key } })
          continue
        }
        if (current && current.value_id === value_id && current.value_en === value_en) continue
        await tx.siteText.upsert({
          where: { key },
          create: { key, value_id, value_en },
          update: { value_id, value_en },
        })
      }
      const after = await tx.siteText.findMany()
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'update',
        entity: 'SiteText',
        entityId: 'all',
        before: snapshot(before),
        after: snapshot(after),
      })
    })
    revalidateContent('siteText')
    return ok('Teks situs disimpan.')
  } catch (error) {
    return toActionError(error)
  }
}
