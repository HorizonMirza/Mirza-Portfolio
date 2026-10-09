import type { AppLocale } from '@/i18n/routing'

type Localized<K extends string> = { [P in `${K}_id` | `${K}_en`]: string | null }

// Ambil kolom dua bahasa sesuai locale: loc(project, 'title', 'en') → project.title_en
export function loc<K extends string>(row: Localized<K>, key: K, locale: AppLocale): string {
  return row[`${key}_${locale}` as `${K}_id`] ?? ''
}

const intlLocale: Record<AppLocale, string> = { id: 'id-ID', en: 'en-GB' }

// "2025-07" → "Jul 2025". Kolom tanggal disimpan tanpa zona waktu, jadi diformat dengan UTC.
export function formatMonth(month: string, locale: AppLocale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T00:00:00Z`))
}

export function formatDateShort(iso: string, locale: AppLocale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(iso))
}
