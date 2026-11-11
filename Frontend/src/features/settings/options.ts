import { z } from 'zod'

// Pengaturan situs yang disimpan otomatis per baris (Admin → Pengaturan, DESIGN.md bagian 119).
// Dipakai bersama oleh form (klien) dan action (server), jadi tanpa import server.

export const THEME_CHOICES = ['dark', 'light', 'system'] as const
export const LOCALE_CHOICES = ['browser', 'id', 'en'] as const
export const INTRO_FREQUENCIES = ['once', 'visit', 'weekly'] as const
export const RETENTION_CHOICES = [30, 90, 365] as const

export type DefaultTheme = (typeof THEME_CHOICES)[number]
export type DefaultLocaleChoice = (typeof LOCALE_CHOICES)[number]
export type IntroFrequency = (typeof INTRO_FREQUENCIES)[number]

export const CONTACT_PER_HOUR_MIN = 1
export const CONTACT_PER_HOUR_MAX = 50

// Satu skema per kolom: action menerima { key, value } dan hanya kolom di sini yang bisa diubah.
export const siteOptionSchema = z.discriminatedUnion('key', [
  z.object({
    key: z.literal('soundVolume'),
    value: z
      .number({ error: 'Volume harus berupa angka' })
      .int('Volume harus bilangan bulat')
      .min(0, 'Volume paling kecil 0')
      .max(100, 'Volume paling besar 100'),
  }),
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
  z.object({ key: z.literal('emailOnMessage'), value: z.boolean() }),
  z.object({ key: z.literal('loginNotify'), value: z.boolean() }),
  z.object({ key: z.literal('trackVisits'), value: z.boolean() }),
  z.object({
    key: z.literal('visitRetentionDays'),
    value: z.union(RETENTION_CHOICES.map((d) => z.literal(d))),
  }),
  z.object({ key: z.literal('allowIndexing'), value: z.boolean() }),
  z.object({ key: z.literal('maintenanceMode'), value: z.boolean() }),
])

export type SiteOptionInput = z.infer<typeof siteOptionSchema>
export type SiteOptionKey = SiteOptionInput['key']
export type SiteOptions = { [K in SiteOptionKey]: Extract<SiteOptionInput, { key: K }>['value'] }

// Nilai bawaan = perilaku situs sebelum halaman ini ada (sama dengan @default di schema.prisma).
export const DEFAULT_SITE_OPTIONS: SiteOptions = {
  soundVolume: 80,
  defaultTheme: 'dark',
  heroAnimation: true,
  defaultLocale: 'browser',
  introEnabled: true,
  introFrequency: 'visit',
  whatsappButton: false,
  contactOpen: true,
  contactPerHour: 5,
  emailOnMessage: true,
  loginNotify: true,
  trackVisits: true,
  visitRetentionDays: 90,
  allowIndexing: true,
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
  return {
    soundVolume: int(row.soundVolume, d.soundVolume, 0, 100),
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
    emailOnMessage: bool(row.emailOnMessage, d.emailOnMessage),
    loginNotify: bool(row.loginNotify, d.loginNotify),
    trackVisits: bool(row.trackVisits, d.trackVisits),
    visitRetentionDays: pick(row.visitRetentionDays, RETENTION_CHOICES, d.visitRetentionDays),
    allowIndexing: bool(row.allowIndexing, d.allowIndexing),
    maintenanceMode: bool(row.maintenanceMode, d.maintenanceMode),
  }
}
