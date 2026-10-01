import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { LoginForm } from '@/components/admin/login-form'
import { getAdminSession } from '@/lib/auth-guard'
import { safeAdminRedirect } from '@/lib/safe-redirect'

export const metadata: Metadata = { title: 'Masuk' }

export default async function LoginPage({ searchParams }: PageProps<'/admin/login'>) {
  const { next } = await searchParams
  const target = safeAdminRedirect(typeof next === 'string' ? next : undefined)
  // sudah masuk: langsung ke panel
  if (await getAdminSession()) redirect(target)

  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4 py-12"
    >
      <p className="font-mono text-label tracking-widest text-muted uppercase">Super Admin</p>
      <h1 className="mt-2 text-h2 font-bold">Masuk ke panel admin</h1>
      <LoginForm redirectTo={target} />
    </main>
  )
}
