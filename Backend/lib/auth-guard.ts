// Pemeriksaan sesi Super Admin untuk halaman, Server Action, dan route handler admin (hanya server).

import 'server-only'

import { headers } from 'next/headers'
import { forbidden, redirect, unauthorized } from 'next/navigation'
import { cache } from 'react'

import { getAuth } from '@backend/lib/auth'
import { getDb } from '@backend/lib/db'

type AdminSession = {
  userId: string
  name: string
  email: string
  // sesi yang sedang dipakai (Admin → Akun: "Perangkat Ini", tidak bisa dikeluarkan dari daftar)
  sessionId: string
}

// Satu kali per request: sesi Better Auth apa adanya (bisa null).
const getRawSession = cache(async () => getAuth().api.getSession({ headers: await headers() }))

const isSuperAdmin = (user: object) => (user as { role?: string }).role === 'SUPER_ADMIN'

// Satu kali per request: ambil sesi dan pastikan perannya SUPER_ADMIN.
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const session = await getRawSession()
  if (!session || !isSuperAdmin(session.user)) return null
  return {
    userId: session.user.id,
    name: session.user.name,
    email: session.user.email,
    sessionId: session.session.id,
  }
})

// Untuk halaman dan layout admin (memakai halaman status bersama):
// - tanpa cookie sesi: proxy sudah mengarahkan ke login sebelum sampai sini; tetap dijaga di sini.
// - cookie ada tetapi sesinya tidak sah atau berakhir: halaman 401 (app/admin/unauthorized.tsx).
// - sesi sah tetapi bukan Super Admin: halaman 403 (app/admin/forbidden.tsx).
export async function requireSuperAdminPage(): Promise<AdminSession> {
  const session = await getRawSession()
  if (!session) {
    const hasCookie = (await headers()).get('cookie')?.includes('mm.session_token')
    if (!hasCookie) redirect('/admin/login')
    unauthorized()
  }
  if (!isSuperAdmin(session.user)) forbidden()
  const admin = await getAdminSession()
  if (!admin) forbidden()
  return admin
}

// Dilempar requireSuperAdmin; toActionError menerjemahkannya menjadi "Sesi berakhir".
export class UnauthorizedError extends Error {
  constructor() {
    super('Tidak diizinkan')
    this.name = 'UnauthorizedError'
  }
}

// Untuk Server Action dan route handler admin: pemeriksaan ulang di server (pertahanan berlapis).
export async function requireSuperAdmin(): Promise<AdminSession> {
  const admin = await getAdminSession()
  if (!admin) throw new UnauthorizedError()
  return admin
}

// Domain email Super Admin (mis. "gmail.com") untuk tanda di form login: email dengan domain lain
// langsung ditandai tanpa bertanya ke server. Hanya domain yang dikirim ke browser, bukan alamatnya.
// Null bila belum ada admin atau database tidak bisa dihubungi (form lalu hanya memeriksa format).
export async function getAdminEmailDomain(): Promise<string | null> {
  try {
    const admin = await getDb().user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      orderBy: { createdAt: 'asc' },
      select: { email: true },
    })
    const domain = admin?.email.split('@')[1]?.toLowerCase()
    return domain || null
  } catch {
    return null
  }
}
