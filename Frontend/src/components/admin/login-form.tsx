'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    setError(null)
    const { error: signInError } = await authClient.signIn.email({
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
    })
    if (signInError) {
      setPending(false)
      // pesan yang sama untuk email maupun password salah
      setError(
        signInError.status === 429
          ? 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.'
          : 'Email atau password salah.',
      )
      return
    }
    // layout server membaca cookie sesi baru saat navigasi
    router.replace(redirectTo)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'login-error' : undefined}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'login-error' : undefined}
        />
      </div>
      <p id="login-error" role="alert" aria-live="polite" className="min-h-6 text-sm text-danger">
        {error}
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? 'Memproses…' : 'Masuk'}
      </Button>
    </form>
  )
}
