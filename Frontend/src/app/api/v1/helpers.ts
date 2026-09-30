import 'server-only'

import type { AppLocale } from '@/i18n/routing'

// Kontrak API publik (ARCHITECTURE.md bagian 6.4): { data, meta } / { error }, read-only, CORS GET.
export const API_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

export function apiLocale(request: Request): AppLocale | 'all' {
  const v = new URL(request.url).searchParams.get('locale')
  return v === 'id' || v === 'en' ? v : 'all'
}

export function ok(data: unknown, meta: Record<string, unknown> = {}) {
  return Response.json({ data, meta }, { headers: API_HEADERS })
}

export function apiError(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status, headers: API_HEADERS })
}

// Tanpa ?locale → { id, en }. Dengan ?locale=id → string.
export function text(row: Record<string, unknown>, key: string, locale: AppLocale | 'all') {
  const id = (row[`${key}_id`] as string | null) ?? null
  const en = (row[`${key}_en`] as string | null) ?? null
  return locale === 'all' ? { id, en } : locale === 'id' ? id : en
}

export function options() {
  return new Response(null, { status: 204, headers: API_HEADERS })
}
