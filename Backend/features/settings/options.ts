import { z } from 'zod'

// Pengaturan situs yang disimpan otomatis per baris (Admin → Pengaturan, revisi 2026-11-11).
// Dipakai bersama oleh form (klien) dan action (server), jadi tanpa import server.

export const THEME_CHOICES = ['dark', 'light', 'system'] as const
export const LOCALE_CHOICES = ['browser', 'id', 'en'] as const
export const INTRO_FREQUENCIES = ['once', 'visit', 'weekly'] as const
export const RETENTION_CHOICES = [30, 90, 365] as const

export type IntroFrequency = (typeof INTRO_FREQUENCIES)[number]

export const CONTACT_PER_HOUR_MIN = 1
export const CONTACT_PER_HOUR_MAX = 50

// Semua suara di situs (lib/ui-sounds.ts), masing-masing punya volume sendiri 0–100 (revisi pemilik
// 2026-11-16; volume utama "Semua suara" dihapus). Urutan = urutan baris di Admin → Pengaturan, Suara.
export const SOUND_KINDS = [
  'nav',
  'theme',
  'language',
  'experienceToggle',
  'timeline',
  'spotlight',
  'slide',
  'shimmer',
  'lanyard',
] as const
export type SoundKind = (typeof SOUND_KINDS)[number]
export type SoundMix = Record<SoundKind, number>

const volume = z
  .number({ error: 'Volume harus berupa angka' })
  .int('Volume harus bilangan bulat')
  .min(0, 'Volume paling kecil 0')
  .max(100, 'Volume paling besar 100')

// selalu lengkap: form mengirim seluruh campuran suara setiap kali satu geseran berubah
const soundMixSchema = z.strictObject(
  Object.fromEntries(SOUND_KINDS.map((k) => [k, volume])) as Record<SoundKind, typeof volume>,
)

// Satu skema per kolom: action menerima { key, value } dan hanya kolom di sini yang bisa diubah.
export const siteOptionSchema = z.discriminatedUnion('key', [
  z.object({ key: z.literal('soundMix'), value: soundMixSchema }),
  z.object({ key: z.literal('defaultTheme'), value: z.enum(THEME_CHOICES) }),
  z.object({ key: z.literal('heroAnimation'), value: z.boolean() }),
  z.object({ key: z.literal('defaultLocale'), value: z.enum(LOCALE_CHOICES) }),
  z.object({ key: z.literal('introEnabled'), value: z.boolean() }),
  z.object({ key: z.literal('introFrequency'), value: z.enum(INTRO_FREQUENCIES) }),
  z.object({ key: z.literal('whatsappButton'), value: z.boolean() }),
  z.object({ key: z.literal('contactOpen'), value: z.boolean() }),
  z.object({
    key: z.literal('contactPerHour'),
    value: z
      .number({ error: 'Batas harus berupa angka' })
      .int('Batas harus bilangan bulat')
      .min(CONTACT_PER_HOUR_MIN, `Batas paling kecil ${CONTACT_PER_HOUR_MIN}`)
      .max(CONTACT_PER_HOUR_MAX, `Batas paling besar ${CONTACT_PER_HOUR_MAX}`),
  }),
  z.object({ key: z.literal('trackVisits'), value: z.boolean() }),
  z.object({
    key: z.literal('visitRetentionDays'),
    value: z.union(RETENTION_CHOICES.map((d) => z.literal(d))),
  }),
  z.object({ key: z.literal('maintenanceMode'), value: z.boolean() }),
])

export type SiteOptionInput = z.infer<typeof siteOptionSchema>
export type SiteOptionKey = SiteOptionInput['key']
export type SiteOptions = { [K in SiteOptionKey]: Extract<SiteOptionInput, { key: K }>['value'] }

// Nilai bawaan = perilaku situs sebelum halaman ini ada (sama dengan @default di schema.prisma).
export const DEFAULT_SOUND_MIX: SoundMix = Object.fromEntries(
  SOUND_KINDS.map((k) => [k, 100]),
) as SoundMix

export const DEFAULT_SITE_OPTIONS: SiteOptions = {
  soundMix: DEFAULT_SOUND_MIX,
  defaultTheme: 'dark',
  heroAnimation: true,
  defaultLocale: 'browser',
  introEnabled: true,
  introFrequency: 'visit',
  whatsappButton: false,
  contactOpen: true,
  contactPerHour: 5,
  trackVisits: true,
  visitRetentionDays: 90,
  maintenanceMode: false,
}

function pick<T extends string | number>(value: unknown, choices: readonly T[], fallback: T): T {
  return choices.includes(value as T) ? (value as T) : fallback
}

// Baris database → nilai yang pasti sah. Kolom teks yang isinya tidak dikenal (diubah manual di
// database) kembali ke bawaan, bukan merusak halaman.
export function toSiteOptions(row: Partial<Record<SiteOptionKey, unknown>> | null): SiteOptions {
  const d = DEFAULT_SITE_OPTIONS
  if (!row) return { ...d }
  const bool = (v: unknown, f: boolean) => (typeof v === 'boolean' ? v : f)
  const int = (v: unknown, f: number, min: number, max: number) =>
    typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : f
  const mix =
    row.soundMix && typeof row.soundMix === 'object' && !Array.isArray(row.soundMix)
      ? (row.soundMix as Record<string, unknown>)
      : {}
  return {
    // suara yang belum pernah diatur (atau isinya rusak) memakai volume penuh
    soundMix: Object.fromEntries(
      SOUND_KINDS.map((k) => [k, int(mix[k], d.soundMix[k], 0, 100)]),
    ) as SoundMix,
    defaultTheme: pick(row.defaultTheme, THEME_CHOICES, d.defaultTheme),
    heroAnimation: bool(row.heroAnimation, d.heroAnimation),
    defaultLocale: pick(row.defaultLocale, LOCALE_CHOICES, d.defaultLocale),
    introEnabled: bool(row.introEnabled, d.introEnabled),
    introFrequency: pick(row.introFrequency, INTRO_FREQUENCIES, d.introFrequency),
    whatsappButton: bool(row.whatsappButton, d.whatsappButton),
    contactOpen: bool(row.contactOpen, d.contactOpen),
    contactPerHour: int(
      row.contactPerHour,
      d.contactPerHour,
      CONTACT_PER_HOUR_MIN,
      CONTACT_PER_HOUR_MAX,
    ),
    trackVisits: bool(row.trackVisits, d.trackVisits),
    visitRetentionDays: pick(row.visitRetentionDays, RETENTION_CHOICES, d.visitRetentionDays),
    maintenanceMode: bool(row.maintenanceMode, d.maintenanceMode),
  }
}
