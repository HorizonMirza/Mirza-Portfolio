import 'server-only'

import { getDb } from '@/lib/db'

import { emptyProfile, type ProfileInput, SOCIAL_KEYS } from './schema'

export async function getProfileForEdit(): Promise<ProfileInput> {
  const p = await getDb().profile.findUnique({ where: { id: 1 } })
  if (!p) return emptyProfile
  const socials = (p.socials ?? {}) as Record<string, unknown>
  return {
    name: p.name,
    headline_id: p.headline_id,
    headline_en: p.headline_en,
    bio_id: p.bio_id,
    bio_en: p.bio_en,
    currentRole_id: p.currentRole_id ?? '',
    currentRole_en: p.currentRole_en ?? '',
    availability: p.availability,
    availabilityNote_id: p.availabilityNote_id ?? '',
    availabilityNote_en: p.availabilityNote_en ?? '',
    city: p.city ?? '',
    email: p.email ?? '',
    whatsapp: p.whatsapp ?? '',
    cvUrl: p.cvUrl ?? '',
    socials: Object.fromEntries(
      SOCIAL_KEYS.map((k) => [k, typeof socials[k] === 'string' ? socials[k] : '']),
    ) as ProfileInput['socials'],
  }
}
