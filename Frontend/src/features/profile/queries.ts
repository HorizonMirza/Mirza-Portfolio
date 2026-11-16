import 'server-only'

import { CARD_TITLES, CONTACT_LABEL_KEYS, derivedCardValue } from '@/components/site/footer-links'
import { getDb } from '@/lib/db'

import {
  type ContactLinksInput,
  emptyProfile,
  type HeroRolesInput,
  type ProfileInput,
  SOCIAL_KEYS,
} from './schema'

export async function getProfileForEdit(): Promise<ProfileInput> {
  const p = await getDb().profile.findUnique({ where: { id: 1 } })
  if (!p) return emptyProfile
  return {
    name: p.name,
    headline_id: p.headline_id,
    headline_en: p.headline_en,
    bio_id: p.bio_id,
    bio_en: p.bio_en,
    currentRole_id: p.currentRole_id ?? '',
    currentRole_en: p.currentRole_en ?? '',
    aboutBandRoles_id: p.aboutBandRoles_id ?? '',
    aboutBandRoles_en: p.aboutBandRoles_en ?? '',
    aboutChipLabel_id: p.aboutChipLabel_id ?? '',
    aboutChipLabel_en: p.aboutChipLabel_en ?? '',
    showCampusChip: p.showCampusChip,
    showFlag: p.showFlag,
    city: p.city ?? '',
  }
}

export async function getHeroRolesForEdit(): Promise<HeroRolesInput> {
  const p = await getDb().profile.findUnique({
    where: { id: 1 },
    select: { aboutRoles_id: true, aboutRoles_en: true },
  })
  return { aboutRoles_id: p?.aboutRoles_id ?? '', aboutRoles_en: p?.aboutRoles_en ?? '' }
}

export async function getContactLinksForEdit(): Promise<ContactLinksInput> {
  const p = await getDb().profile.findUnique({
    where: { id: 1 },
    select: { email: true, whatsapp: true, cvUrl: true, socials: true, contactLabels: true },
  })
  const socials = (p?.socials ?? {}) as Record<string, unknown>
  const stored = (p?.contactLabels ?? {}) as Record<string, { title?: unknown; value?: unknown }>
  const text = (v: unknown) => (typeof v === 'string' ? v : '')
  const links = {
    whatsapp: p?.whatsapp ?? '',
    email: p?.email ?? '',
    cvUrl: p?.cvUrl ?? '',
    socials: Object.fromEntries(
      SOCIAL_KEYS.map((k) => [k, typeof socials[k] === 'string' ? socials[k] : '']),
    ) as ContactLinksInput['socials'],
  }
  // isian judul dan teks kecil memuat nilai yang tampil di situs (penggantian admin, kalau tidak
  // nama bawaan dan teks dari tautan), supaya yang diketik sama dengan yang tampil
  const labels = Object.fromEntries(
    CONTACT_LABEL_KEYS.map((k) => [
      k,
      {
        title: text(stored[k]?.title) || (k === 'cv' ? '' : CARD_TITLES[k]),
        value: text(stored[k]?.value) || derivedCardValue(k, links),
      },
    ]),
  ) as ContactLinksInput['labels']
  return { ...links, labels }
}
