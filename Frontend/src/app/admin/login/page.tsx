import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { LoginForm } from '@/components/admin/login-form'
import { NeuralVortexBackground } from '@/components/admin/neural-vortex-background'
import { getAdminSession } from '@/lib/auth-guard'
import { safeAdminRedirect } from '@/lib/safe-redirect'

export const metadata: Metadata = { title: 'Login' }

export default async function LoginPage({ searchParams }: PageProps<'/admin/login'>) {
  const { next } = await searchParams
  const target = safeAdminRedirect(typeof next === 'string' ? next : undefined)
  // sudah masuk: langsung ke panel
  if (await getAdminSession()) redirect(target)

  return (
    // Selalu hitam (permintaan pemilik), tidak mengikuti tema terang/gelap panel admin.
    <div className="relative min-h-dvh overflow-hidden bg-black text-white [color-scheme:dark]">
      <NeuralVortexBackground />
      <main
        id="main"
        className="relative z-10 flex min-h-dvh w-full flex-col items-center justify-center px-4 py-12"
      >
        <LoginForm redirectTo={target} />
      </main>
    </div>
  )
}
