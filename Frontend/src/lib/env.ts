import { z } from 'zod'

// Skema variabel lingkungan sisi server. Kunci milestone berikutnya sengaja opsional
// dulu dan akan diwajibkan saat fiturnya dibuat (lihat Documentation/ARCHITECTURE.md bagian 8).
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL wajib diisi')
    .refine((v) => v.startsWith('postgres://') || v.startsWith('postgresql://'), {
      message: 'DATABASE_URL harus berupa URL PostgreSQL',
    }),
  DIRECT_URL: z.string().optional(),
  // diisi otomatis oleh integrasi Neon di Vercel, dipakai untuk migrasi
  DATABASE_URL_UNPOOLED: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

// Nilai kosong ("") dianggap tidak diisi, supaya .env.example yang disalin apa adanya
// dan env Vercel yang dikosongkan tidak menggagalkan validasi kunci opsional.
function withoutEmpty(source: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(source).filter(([, v]) => v !== undefined && v.trim() !== ''),
  )
}

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = serverEnvSchema.safeParse(withoutEmpty(source))
  if (!result.success) {
    // pesan hanya menyebut nama kunci, tidak pernah nilainya
    const detail = result.error.issues
      .map((issue) => `- ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Variabel lingkungan tidak valid:\n${detail}`)
  }
  return result.data
}

let cached: ServerEnv | undefined

// Divalidasi saat pertama dipakai, bukan saat modul diimpor, agar build statis
// tidak gagal hanya karena halaman tersebut tidak butuh database.
export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env)
  return cached
}

// Kunci khusus autentikasi. Dipisah agar halaman publik tidak gagal hanya karena kunci auth
// belum diisi, sedangkan panel admin menolak berjalan tanpa kunci yang layak.
export const authEnvSchema = z.object({
  BETTER_AUTH_SECRET: z
    .string({ error: 'BETTER_AUTH_SECRET wajib diisi' })
    .min(32, 'BETTER_AUTH_SECRET minimal 32 karakter (buat dengan: openssl rand -base64 32)'),
  BETTER_AUTH_URL: z.url().optional(),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
  VERCEL_URL: z.string().optional(),
  // kunci terpisah untuk hash IP di rate limit publik; bila kosong diturunkan dari BETTER_AUTH_SECRET
  HASH_SALT_SECRET: z.string().min(32).optional(),
})

export type AuthEnv = z.infer<typeof authEnvSchema>

export function parseAuthEnv(source: Record<string, string | undefined>): AuthEnv {
  const result = authEnvSchema.safeParse(withoutEmpty(source))
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `- ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Variabel lingkungan auth tidak valid:\n${detail}`)
  }
  return result.data
}

let cachedAuth: AuthEnv | undefined

export function getAuthEnv(): AuthEnv {
  cachedAuth ??= parseAuthEnv(process.env)
  return cachedAuth
}

// URL dasar aplikasi untuk auth: BETTER_AUTH_URL > NEXT_PUBLIC_SITE_URL > URL deployment Vercel.
export function resolveBaseUrl(env: AuthEnv): string | undefined {
  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`
  return undefined
}

// URL publik situs untuk tautan absolut (email, sitemap). Urutan: domain yang diatur,
// domain production Vercel, URL deployment, lalu localhost.
export function siteUrl(source: Record<string, string | undefined> = process.env): string {
  const pick = (v: string | undefined) => (v && v.trim() !== '' ? v.trim() : undefined)
  const explicit = pick(source.NEXT_PUBLIC_SITE_URL)
  if (explicit) return explicit.replace(/\/$/, '')
  const production = pick(source.VERCEL_PROJECT_PRODUCTION_URL)
  if (production) return `https://${production}`
  const deployment = pick(source.VERCEL_URL)
  if (deployment) return `https://${deployment}`
  return 'http://localhost:3000'
}
