import 'server-only'

import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import { CACHE_TAGS, PUBLIC_CACHE_SECONDS } from '@/lib/cache-tags'
import { getDb } from '@/lib/db'
import { safeImage } from '@/lib/public-image'

import { SOCIAL_KEYS } from './schema'

export type PublicImage = {
  url: string
  width: number | null
  height: number | null
  alt_id: string | null
  alt_en: string | null
}

export type PublicProfile = {
  name: string
  headline_id: string
  headline_en: string
  bio_id: string
  bio_en: string
  currentRole_id: string | null
  currentRole_en: string | null
  aboutRoles_id: string | null
  aboutRoles_en: string | null
  cardRole_id: string | null
  cardRole_en: string | null
  availability: 'OPEN' | 'BUSY' | 'NOT_LOOKING'
  availabilityNote_id: string | null
  availabilityNote_en: string | null
  city: string | null
  email: string | null
  whatsapp: string | null
  socials: Partial<Record<(typeof SOCIAL_KEYS)[number], string>>
  photo: PublicImage | null
  hasCv: boolean
  // host link CV di luar (mis. drive.google.com) bila diisi di admin; null bila memakai PDF upload
  cvHost: string | null
  // pendidikan terbaru yang terbit, untuk pelat status "Kampus"
  campus: {
    organization: string
    organization_en: string | null
    title_id: string
    title_en: string
  } | null
}

function urlHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

// Data hasil unstable_cache diserialisasi JSON, jadi hanya berisi nilai sederhana (tanpa Date).
const load = unstable_cache(
  async (): Promise<PublicProfile | null> => {
    const db = getDb()
    const [p, campus] = await Promise.all([
      db.profile.findUnique({
        where: { id: 1 },
        include: {
          photo: { select: { url: true, width: true, height: true, alt_id: true, alt_en: true } },
          cv: { select: { id: true } },
        },
      }),
      db.experience.findFirst({
        where: { type: 'EDUCATION', status: 'PUBLISHED' },
        orderBy: { startDate: 'desc' },
        select: { organization: true, organization_en: true, title_id: true, title_en: true },
      }),
    ])
    if (!p) return null
    const raw = (p.socials ?? {}) as Record<string, unknown>
    const socials: PublicProfile['socials'] = {}
    for (const key of SOCIAL_KEYS)
      if (typeof raw[key] === 'string' && raw[key]) socials[key] = raw[key] as string
    return {
      name: p.name,
      headline_id: p.headline_id,
      headline_en: p.headline_en,
      bio_id: p.bio_id,
      bio_en: p.bio_en,
      currentRole_id: p.currentRole_id,
      currentRole_en: p.currentRole_en,
      aboutRoles_id: p.aboutRoles_id,
      aboutRoles_en: p.aboutRoles_en,
      cardRole_id: p.cardRole_id,
      cardRole_en: p.cardRole_en,
      availability: p.availability,
      availabilityNote_id: p.availabilityNote_id,
      availabilityNote_en: p.availabilityNote_en,
      city: p.city,
      email: p.email,
      whatsapp: p.whatsapp,
      socials,
      photo: safeImage(p.photo),
      hasCv: Boolean(p.cvUrl || p.cv),
      cvHost: p.cvUrl ? urlHost(p.cvUrl) : null,
      campus,
    }
  },
  ['public-profile'],
  { tags: [CACHE_TAGS.profile, CACHE_TAGS.experience], revalidate: PUBLIC_CACHE_SECONDS },
)

export const getPublicProfile = cache(load)

// URL CV terbaru untuk /api/cv (tidak di-cache agar selalu versi terakhir). Link di luar
// (Google Drive) yang diisi di admin didahulukan daripada PDF yang di-upload.
export async function getCvUrl(): Promise<string | null> {
  const p = await getDb().profile.findUnique({
    where: { id: 1 },
    select: { cvUrl: true, cv: { select: { url: true } } },
  })
  return p?.cvUrl ?? p?.cv?.url ?? null
}
