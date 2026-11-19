// Kolom dua bahasa (*_id/*_en) dan format tanggal sesuai bahasa situs. Tanpa impor server.

import type { AppLocale } from '@backend/i18n/routing'

type Localized<K extends string> = { [P in `${K}_id` | `${K}_en`]: string | null }

// Ambil kolom dua bahasa sesuai locale: loc(project, 'title', 'en') → project.title_en
export function loc<K extends string>(row: Localized<K>, key: K, locale: AppLocale): string {
  return row[`${key}_${locale}` as `${K}_id`] ?? ''
}

const intlLocale: Record<AppLocale, string> = { id: 'id-ID', en: 'en-GB' }

// Formatter disimpan per locale: dipanggil dua kali per entri pengalaman di setiap render.
const monthFormatters: Record<AppLocale, Intl.DateTimeFormat> = {
  id: new Intl.DateTimeFormat(intlLocale.id, { month: 'short', year: 'numeric', timeZone: 'UTC' }),
  en: new Intl.DateTimeFormat(intlLocale.en, { month: 'short', year: 'numeric', timeZone: 'UTC' }),
}

// "2025-07" → "Jul 2025". Kolom tanggal disimpan tanpa zona waktu, jadi diformat dengan UTC.
export function formatMonth(month: string, locale: AppLocale): string {
  return monthFormatters[locale].format(new Date(`${month}-01T00:00:00Z`))
}

// Seperti monthFormatters: pemformat dibuat sekali per bahasa, bukan tiap panggilan (membuat
// Intl.DateTimeFormat jauh lebih mahal daripada memakainya).
const dateShortFormatters: Record<AppLocale, Intl.DateTimeFormat> = {
  id: shortDateFormatter(intlLocale.id),
  en: shortDateFormatter(intlLocale.en),
}

function shortDateFormatter(locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
}

// "19 Nov 2026" dari waktu ISO, dalam zona Asia/Jakarta.
export function formatDateShort(iso: string, locale: AppLocale): string {
  return dateShortFormatters[locale].format(new Date(iso))
}
