import 'server-only'

import type { Prisma } from '@/generated/prisma/client'
import { adminT } from '@/lib/admin-i18n'
import { getDb } from '@/lib/db'
import { findModule } from '@/features/site-text/catalog'

import { ENTITY_LABEL, ENTITY_NOUN } from './labels'

// Umpan dimuat 50 baris dulu; "Muat lagi" menambah 50 sampai paling banyak AUDIT_MAX_ROWS.
export const AUDIT_STEP = 50
export const AUDIT_MAX_ROWS = 2000
// batas id hasil pencarian di isi perubahan dan nama target
const SEARCH_LIMIT = 1000

export type AuditFilter = {
  q: string | null
  action: string | null
  entity: string | null
  take: number
}

export type AuditTarget = {
  // nama yang dikenal (judul project, nama skill, ...), null = tidak ada
  name: string | null
  // tautan ke halaman admin datanya, null = sudah dihapus atau tidak punya halaman
  href: string | null
  // pengalaman berjenis pendidikan disebut "pendidikan" di kalimat
  noun: string | null
}

function likePattern(q: string) {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
}

const contains = (q: string) => ({ contains: q, mode: 'insensitive' as const })

// Id data yang namanya cocok dengan kata pencarian, per entitas.
async function idsByName(q: string) {
  const db = getDb()
  const [projects, experiences, skills, categories, messages] = await Promise.all([
    db.project.findMany({
      where: { OR: [{ title_id: contains(q) }, { title_en: contains(q) }, { slug: contains(q) }] },
      select: { id: true },
      take: SEARCH_LIMIT,
    }),
    db.experience.findMany({
      where: {
        OR: [
          { title_id: contains(q) },
          { title_en: contains(q) },
          { organization: contains(q) },
          { organization_en: contains(q) },
        ],
      },
      select: { id: true },
      take: SEARCH_LIMIT,
    }),
    db.skill.findMany({ where: { name: contains(q) }, select: { id: true }, take: SEARCH_LIMIT }),
    db.skillCategory.findMany({
      where: { OR: [{ name_id: contains(q) }, { name_en: contains(q) }] },
      select: { id: true },
      take: SEARCH_LIMIT,
    }),
    db.message.findMany({
      where: { OR: [{ name: contains(q) }, { subject: contains(q) }] },
      select: { id: true },
      take: SEARCH_LIMIT,
    }),
  ])
  return [...projects, ...experiences, ...skills, ...categories, ...messages].map((r) => r.id)
}

// Nama entitas (Indonesia atau Inggris) yang cocok dengan kata pencarian, mis. "project", "skill".
function entitiesByLabel(q: string) {
  const needle = q.toLowerCase()
  return Object.keys(ENTITY_LABEL).filter((entity) =>
    [ENTITY_LABEL[entity]!, ENTITY_NOUN[entity]!].some(
      (label) =>
        label.toLowerCase().includes(needle) || adminT('en', label).toLowerCase().includes(needle),
    ),
  )
}

async function searchWhere(q: string): Promise<Prisma.AuditLogWhereInput> {
  // Isi perubahan (JSON) dicari dengan SQL berparameter; % dan _ dari pengguna di-escape.
  const [byDiff, byName] = await Promise.all([
    getDb().$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "AuditLog"
      WHERE "diff"::text ILIKE ${likePattern(q)}
      ORDER BY "createdAt" DESC
      LIMIT ${SEARCH_LIMIT}
    `,
    idsByName(q),
  ])
  const entities = entitiesByLabel(q)
  return {
    OR: [
      { id: { in: byDiff.map((r) => r.id) } },
      { entityId: { in: byName } },
      { entityId: { startsWith: q } },
      ...(entities.length > 0 ? [{ entity: { in: entities } }] : []),
    ],
  }
}

export async function listAuditFeed(filter: AuditFilter) {
  const db = getDb()
  const and: Prisma.AuditLogWhereInput[] = []
  if (filter.action) and.push({ action: filter.action })
  if (filter.entity) and.push({ entity: filter.entity })
  if (filter.q) and.push(await searchWhere(filter.q))
  const where: Prisma.AuditLogWhereInput = and.length > 0 ? { AND: and } : {}

  const [rows, entities] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      // satu baris lebih untuk mengetahui masih ada lagi atau tidak
      take: filter.take + 1,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        diff: true,
        createdAt: true,
        actor: { select: { name: true } },
      },
    }),
    db.auditLog.findMany({
      distinct: ['entity'],
      select: { entity: true },
      orderBy: { entity: 'asc' },
    }),
  ])
  const hasMore = rows.length > filter.take
  const shown = hasMore ? rows.slice(0, filter.take) : rows
  return {
    rows: shown,
    hasMore,
    entities: entities.map((e) => e.entity),
  }
}

// Nama dan tautan data yang disebut tiap baris, diambil sekali per entitas. Data yang sudah dihapus
// tidak punya tautan; namanya diambil dari isi perubahan baris itu (lihat page).
export async function resolveAuditTargets(
  rows: { entity: string; entityId: string | null }[],
  lang: 'id' | 'en',
): Promise<Map<string, AuditTarget>> {
  const db = getDb()
  const idsOf = (entity: string) => [
    ...new Set(rows.filter((r) => r.entity === entity && r.entityId).map((r) => r.entityId!)),
  ]
  const uuid = (ids: string[]) =>
    ids.filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
  const [projects, experiences, skills, categories, messages] = await Promise.all([
    db.project.findMany({
      where: { id: { in: uuid(idsOf('Project')) } },
      select: { id: true, title_id: true, title_en: true },
    }),
    db.experience.findMany({
      where: { id: { in: uuid(idsOf('Experience')) } },
      select: { id: true, type: true, title_id: true, title_en: true, organization: true },
    }),
    db.skill.findMany({
      where: { id: { in: uuid(idsOf('Skill')) } },
      select: { id: true, name: true },
    }),
    db.skillCategory.findMany({
      where: { id: { in: uuid(idsOf('SkillCategory')) } },
      select: { id: true, name_id: true, name_en: true },
    }),
    db.message.findMany({
      where: { id: { in: uuid(idsOf('Message')) } },
      select: { id: true, name: true, subject: true },
    }),
  ])
  const key = (entity: string, id: string) => `${entity}:${id}`
  const map = new Map<string, AuditTarget>()
  const en = lang === 'en'
  for (const p of projects)
    map.set(key('Project', p.id), {
      name: (en ? p.title_en : p.title_id) || p.title_id,
      href: `/admin/projects/${p.id}`,
      noun: null,
    })
  for (const x of experiences) {
    const education = x.type === 'EDUCATION'
    map.set(key('Experience', x.id), {
      name: education ? x.organization : `${(en ? x.title_en : x.title_id) || x.title_id}`,
      href: `/admin/${education ? 'education' : 'experience'}/${x.id}`,
      noun: education ? 'pendidikan' : null,
    })
  }
  for (const s of skills)
    map.set(key('Skill', s.id), { name: s.name, href: '/admin/skills', noun: null })
  for (const c of categories)
    map.set(key('SkillCategory', c.id), {
      name: (en ? c.name_en : c.name_id) || c.name_id,
      href: '/admin/skills',
      noun: null,
    })
  for (const m of messages)
    map.set(key('Message', m.id), {
      name: m.subject || m.name,
      href: `/admin/messages/${m.id}`,
      noun: null,
    })
  // teks situs: entityId = modul halaman (home, about, ...)
  for (const id of idsOf('SiteText')) {
    const mod = findModule(id)
    if (mod)
      map.set(key('SiteText', id), { name: mod.label, href: `/admin/pages/${id}`, noun: null })
  }
  return map
}

export function auditTargetKey(entity: string, entityId: string | null) {
  return entityId ? `${entity}:${entityId}` : null
}

// Halaman admin untuk entitas tanpa id (satu baris saja).
export const SINGLE_ENTITY_HREF: Record<string, string> = {
  SiteSetting: '/admin/settings',
  Profile: '/admin/profile',
  User: '/admin/account',
  Session: '/admin/account',
}
