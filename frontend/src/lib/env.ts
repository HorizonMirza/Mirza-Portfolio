import { z } from 'zod'

// Skema variabel lingkungan sisi server. Kunci milestone berikutnya sengaja opsional
// dulu dan akan diwajibkan saat fiturnya dibuat (lihat documentation/ARCHITECTURE.md bagian 8).
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL wajib diisi')
    .refine((v) => v.startsWith('postgres://') || v.startsWith('postgresql://'), {
      message: 'DATABASE_URL harus berupa URL PostgreSQL',
    }),
  DIRECT_URL: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = serverEnvSchema.safeParse(source)
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
