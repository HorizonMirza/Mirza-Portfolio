import 'server-only'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { getAuth } from '@/lib/auth'

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
