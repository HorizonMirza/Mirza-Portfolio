import 'server-only'

import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'

import { getDb } from '@/lib/db'
import { getAuthEnv, resolveBaseUrl } from '@/lib/env'
import { authRateLimitStorage, hashIdentifier } from '@/lib/rate-limit'

// Batas percobaan login: 5 kali per 15 menit per IP (ARCHITECTURE.md bagian 7).
export const LOGIN_RATE_LIMIT = { window: 15 * 60, max: 5 } as const
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60
export const MIN_PASSWORD_LENGTH = 12

function createAuth() {
  const env = getAuthEnv()
  const baseURL = resolveBaseUrl(env)
  const previewOrigin = env.VERCEL_URL ? `https://${env.VERCEL_URL}` : undefined

  return betterAuth({
    appName: 'Portofolio Muhammad Mirza',
    secret: env.BETTER_AUTH_SECRET,
    baseURL,
    trustedOrigins: [baseURL, previewOrigin].filter((v): v is string => Boolean(v)),
    database: prismaAdapter(getDb(), { provider: 'postgresql' }),
    emailAndPassword: {
      enabled: true,
      // akun admin hanya dibuat lewat seed, tidak ada registrasi publik
      disableSignUp: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
    },
    user: {
      additionalFields: {
        // input: false = tidak bisa diisi dari request klien
        role: { type: 'string', required: false, defaultValue: 'USER', input: false },
      },
    },
    session: {
      expiresIn: SESSION_MAX_AGE_SECONDS,
      updateAge: 60 * 60,
    },
    rateLimit: {
      enabled: true,
      // penyimpanan sendiri: kunci (yang memuat IP) di-hash sebelum masuk database
      customStorage: authRateLimitStorage,
      window: 60,
      max: 100,
      customRules: { '/sign-in/email': LOGIN_RATE_LIMIT },
    },
    databaseHooks: {
      session: {
        create: {
          // simpan hash IP, bukan IP mentah
          before: async (session) => ({
            data: {
              ...session,
              ipAddress: session.ipAddress ? hashIdentifier(session.ipAddress) : null,
            },
          }),
        },
      },
    },
    advanced: {
      cookiePrefix: 'mm',
      // id dibuat Prisma (UUID v7 lewat @default(uuid(7)))
      database: { generateId: false },
    },
    telemetry: { enabled: false },
    // harus plugin terakhir: meneruskan Set-Cookie dari Server Action
    plugins: [nextCookies()],
  })
}

type Auth = ReturnType<typeof createAuth>

const globalForAuth = globalThis as unknown as { auth?: Auth }

// Dibuat saat pertama dipakai, agar build halaman statis tidak butuh kunci auth.
export function getAuth(): Auth {
  globalForAuth.auth ??= createAuth()
  return globalForAuth.auth
}
