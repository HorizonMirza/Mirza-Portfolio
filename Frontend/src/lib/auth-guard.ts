import 'server-only'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { getAuth } from '@/lib/auth'
import { getDb } from '@/lib/db'

export type AdminSession = {
  userId: string
  name: string
  email: string
}

// Satu kali per request: ambil sesi dan pastikan perannya SUPER_ADMIN.
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const session = await getAuth().api.getSession({ headers: await headers() })
  if (!session) return null
  const role = (session.user as { role?: string }).role
  if (role !== 'SUPER_ADMIN') return null
  return { userId: session.user.id, name: session.user.name, email: session.user.email }
})

// Untuk halaman dan layout admin: arahkan ke login bila belum masuk.
export async function requireSuperAdminPage(): Promise<AdminSession> {
  const admin = await getAdminSession()
  if (!admin) redirect('/admin/login')
  return admin
}

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
