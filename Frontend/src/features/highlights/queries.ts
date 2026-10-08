import 'server-only'

import { getDb } from '@/lib/db'

import type { HighlightInput } from './schema'

export async function listHighlightsAdmin() {
  return getDb().highlight.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      value: true,
      suffix: true,
      label_id: true,
      source: true,
      order: true,
      status: true,
    },
  })
}

export async function getHighlightForEdit(id: string): Promise<HighlightInput | null> {
  const h = await getDb().highlight.findUnique({ where: { id } })
  if (!h) return null
  return {
    value: h.value,
    suffix: h.suffix,
    label_id: h.label_id,
    label_en: h.label_en,
    source: h.source ?? '',
    order: h.order,
    status: h.status,
  }
}
