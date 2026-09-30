'use server'

import { type ActionResult, fail, ok, toActionError, zodFieldErrors } from '@/lib/action-result'
import { writeAudit } from '@/lib/audit'
import { requireSuperAdmin } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import { revalidateContent } from '@/lib/revalidate'
import { emptyToNull } from '@/lib/validation'

import { profileSchema } from './schema'

export async function saveProfile(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const parsed = profileSchema.safeParse(input)
    if (!parsed.success) return fail('Periksa kembali isian.', zodFieldErrors(parsed.error.issues))
    const v = parsed.data
    // Link sosial yang kosong tidak disimpan.
    const socials = Object.fromEntries(Object.entries(v.socials).filter(([, url]) => url !== ''))
    const data = {
      name: v.name,
      headline_id: v.headline_id,
      headline_en: v.headline_en,
      bio_id: v.bio_id,
      bio_en: v.bio_en,
      currentRole_id: emptyToNull(v.currentRole_id),
      currentRole_en: emptyToNull(v.currentRole_en),
      availability: v.availability,
      availabilityNote_id: emptyToNull(v.availabilityNote_id),
      availabilityNote_en: emptyToNull(v.availabilityNote_en),
      city: emptyToNull(v.city),
      email: emptyToNull(v.email),
      whatsapp: emptyToNull(v.whatsapp),
      socials,
    }
    await getDb().$transaction(async (tx) => {
      const before = await tx.profile.findUnique({ where: { id: 1 } })
      const after = await tx.profile.upsert({
        where: { id: 1 },
        create: { id: 1, ...data },
        update: data,
      })
      await writeAudit(tx, {
        actorId: admin.userId,
        action: before ? 'update' : 'create',
        entity: 'Profile',
        entityId: '1',
        // Email dan WhatsApp tidak dicatat isinya di audit, cukup tanda berubah.
        before: before
          ? {
              ...before,
              email: before.email ? '•••' : null,
              whatsapp: before.whatsapp ? '•••' : null,
            }
          : null,
        after: {
          ...after,
          email: after.email ? (after.email === before?.email ? '•••' : '••• (baru)') : null,
          whatsapp: after.whatsapp
            ? after.whatsapp === before?.whatsapp
              ? '•••'
              : '••• (baru)'
            : null,
        },
      })
    })
    revalidateContent('profile')
    return ok('Profil disimpan.')
  } catch (error) {
    return toActionError(error)
  }
}
