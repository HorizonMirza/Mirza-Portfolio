'use client'

import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { authClient } from '@/lib/auth-client'
import { DEFAULT_PROFILE_AVATAR } from '@/lib/default-photo'
import { cn } from '@/lib/utils'

// Kartu login kaca (gaya sign-in-card-2) tanpa efek miring/geser: kartu diam, hanya garis cahaya
// di tepi yang bergerak (CSS, mati pada reduced-motion). Halaman login selalu gelap, jadi warna
// ditulis langsung (putih di atas hitam), tidak memakai token tema. Teks login berbahasa Inggris
// (permintaan pemilik), panel admin di baliknya tetap berbahasa Indonesia.

// Kolom berada di dalam bingkai .login-field yang memberi kilau berjalan mengelilingi kotak.
const inputClass =
  'h-11 w-full rounded-[calc(0.5rem-1px)] border-0 bg-[#111117] pl-10 text-base text-white placeholder:text-white/40 transition-colors outline-none focus:bg-[#16161e] md:text-sm'

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
          ? 'Too many attempts. Try again in 15 minutes.'
          : 'Incorrect email or password.',
      )
      return
    }
    // layout server membaca cookie sesi baru saat navigasi
    router.replace(redirectTo)
    router.refresh()
  }

  const describedBy = error ? 'login-error' : undefined

  return (
    <div lang="en" className="relative w-full max-w-sm">
      {/* garis cahaya yang berjalan di tepi kartu */}
      <div aria-hidden="true" className="absolute -inset-px overflow-hidden rounded-2xl">
        <span className="login-beam login-beam-top" />
        <span className="login-beam login-beam-right" />
        <span className="login-beam login-beam-bottom" />
        <span className="login-beam login-beam-left" />
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/50 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)',
            backgroundSize: '30px 30px',
          }}
        />

        <div className="relative">
          <div className="mb-6 text-center">
            <Image
              src={DEFAULT_PROFILE_AVATAR}
              alt=""
              width={112}
              height={112}
              sizes="56px"
              priority
              className="mx-auto mb-4 size-14 rounded-full border border-white/15 object-cover"
            />
            <p className="font-mono text-label tracking-widest text-white/60 uppercase">
              Super Admin
            </p>
            <h1 className="mt-2 text-h3 font-bold text-white">Welcome Back King!</h1>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-white/80">
                Email
              </label>
              <div className="login-field relative">
                <Mail
                  className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-white/50"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  placeholder="mirzaganteng@gmail.com"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={describedBy}
                  className={cn(inputClass, 'pr-3')}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-white/80">
                Password
              </label>
              <div className="login-field login-field-delay relative">
                <Lock
                  className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-white/50"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  aria-invalid={error ? true : undefined}
                  aria-describedby={describedBy}
                  className={cn(inputClass, 'pr-11')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-pressed={showPassword}
                  aria-controls="password"
                  title="Show password"
                  className="absolute top-1/2 right-1 z-10 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-white/60 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                  <span className="sr-only">Show password</span>
                </button>
              </div>
            </div>

            <p
              id="login-error"
              role="alert"
              aria-live="polite"
              className="min-h-5 text-sm text-red-300"
            >
              {error}
            </p>

            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white text-sm font-semibold text-black transition-colors hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none disabled:opacity-70"
            >
              {pending ? (
                <>
                  <span
                    aria-hidden="true"
                    className="size-4 animate-spin rounded-full border-2 border-black/70 border-t-transparent"
                  />
                  Signing in…
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
