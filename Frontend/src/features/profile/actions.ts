'use server'

import { type ActionResult, fail, ok, toActionError, zodFieldErrors } from '@/lib/action-result'
import { writeAudit } from '@/lib/audit'
import { requireSuperAdmin } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import { revalidateContent } from '@/lib/revalidate'
import { emptyToNull } from '@/lib/validation'

import { contactLinksSchema, heroRolesSchema, profileSchema } from './schema'

export async function saveProfile(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const parsed = profileSchema.safeParse(input)
    if (!parsed.success) return fail('Periksa kembali isian.', zodFieldErrors(parsed.error.issues))
    const v = parsed.data
    const data = {
      name: v.name,
      headline_id: v.headline_id,
      headline_en: v.headline_en,
      bio_id: v.bio_id,
      bio_en: v.bio_en,
      currentRole_id: emptyToNull(v.currentRole_id),
      currentRole_en: emptyToNull(v.currentRole_en),
      cardRole_id: emptyToNull(v.cardRole_id),
      cardRole_en: emptyToNull(v.cardRole_en),
      city: emptyToNull(v.city),
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
        before: before ? maskContacts(before) : null,
        after: maskContacts(after, before),
      })
    })
    revalidateContent('profile')
    return ok('Profil disimpan.')
  } catch (error) {
    return toActionError(error)
  }
}

// Email dan WhatsApp tidak dicatat isinya di audit, cukup tanda berubah.
function maskContacts<T extends { email: string | null; whatsapp: string | null }>(
  row: T,
  before?: { email: string | null; whatsapp: string | null } | null,
): T {
  const mark = (value: string | null, old: string | null | undefined) =>
    value ? (before === undefined || value === old ? '•••' : '••• (baru)') : null
  return {
    ...row,
    email: mark(row.email, before?.email),
    whatsapp: mark(row.whatsapp, before?.whatsapp),
  }
}

// Kontak dan Resume CV di footer (Admin → Footer). Profil harus sudah ada (dibuat seed).
export async function saveContactLinks(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const parsed = contactLinksSchema.safeParse(input)
    if (!parsed.success) return fail('Periksa kembali isian.', zodFieldErrors(parsed.error.issues))
    const v = parsed.data
    // Link sosial yang kosong tidak disimpan.
    const socials = Object.fromEntries(Object.entries(v.socials).filter(([, url]) => url !== ''))
    const data = {
      email: emptyToNull(v.email),
      whatsapp: emptyToNull(v.whatsapp),
      cvUrl: emptyToNull(v.cvUrl),
      socials,
    }
    const saved = await getDb().$transaction(async (tx) => {
      const before = await tx.profile.findUnique({
        where: { id: 1 },
        select: { email: true, whatsapp: true, cvUrl: true, socials: true },
      })
      if (!before) return false
      const after = await tx.profile.update({
        where: { id: 1 },
        data,
        select: { email: true, whatsapp: true, cvUrl: true, socials: true },
      })
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'update',
        entity: 'Profile',
        entityId: '1',
        before: maskContacts(before),
        after: maskContacts(after, before),
      })
      return true
    })
    if (!saved) return fail('Isi profil di About → Profil dulu.')
    revalidateContent('profile')
    return ok('Kontak disimpan.')
  } catch (error) {
    return toActionError(error)
  }
}

// Peran di bawah foto beranda (Admin → Home). Profil harus sudah ada (dibuat seed), karena kolom
// wajibnya (nama, headline, bio) diisi di About → Profil.
export async function saveHeroRoles(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const parsed = heroRolesSchema.safeParse(input)
    if (!parsed.success) return fail('Periksa kembali isian.', zodFieldErrors(parsed.error.issues))
    const data = {
      aboutRoles_id: emptyToNull(parsed.data.aboutRoles_id),
      aboutRoles_en: emptyToNull(parsed.data.aboutRoles_en),
    }
    const saved = await getDb().$transaction(async (tx) => {
      const before = await tx.profile.findUnique({
        where: { id: 1 },
        select: { aboutRoles_id: true, aboutRoles_en: true },
      })
      if (!before) return false
      await tx.profile.update({ where: { id: 1 }, data })
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'update',
        entity: 'Profile',
        entityId: '1',
        before,
        after: data,
      })
      return true
    })
    if (!saved) return fail('Isi profil di About → Profil dulu.')
    revalidateContent('profile')
    return ok('Peran disimpan.')
  } catch (error) {
    return toActionError(error)
  }
}
