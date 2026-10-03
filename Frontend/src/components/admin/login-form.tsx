'use client'

import { Check, CircleAlert, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { authClient } from '@/lib/auth-client'
import { DEFAULT_PROFILE_AVATAR } from '@/lib/default-photo'
import { cn } from '@/lib/utils'

import { emailIssue } from './login-validation'

// Kartu login kaca (gaya sign-in-card-2) tanpa efek miring/geser: kartu diam, hanya garis cahaya
// di tepi yang berputar mengikuti sudut kartu (CSS, diam pada reduced-motion). Halaman login selalu
// gelap, jadi warna ditulis langsung (putih di atas hitam), tidak memakai token tema. Teks login
// berbahasa Inggris (permintaan pemilik), panel admin di baliknya tetap berbahasa Indonesia.
// Tanda salah (pilihan pemilik, demo nomor 1): bingkai kolom merah dan pesan tepat di bawah kolom.

// Kolom berada di dalam bingkai .login-field yang memberi kilau berjalan mengelilingi kotak.
const inputClass =
  'login-input h-11 w-full rounded-[calc(0.5rem-1px)] border-0 bg-[#111117] pl-10 text-base text-white placeholder:text-white/40 transition-colors outline-none focus:bg-[#16161e] md:text-sm'

function FieldMessage({ id, children }: { id: string; children: string | null }) {
  if (!children) return null
  return (
    <p id={id} className="flex items-center gap-1.5 text-[0.8125rem] text-red-300">
      <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
      {children}
    </p>
  )
}

export function LoginForm({
  redirectTo,
  emailDomain,
}: {
  redirectTo: string
  emailDomain: string | null
}) {
  const router = useRouter()
  const passwordRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'pending' | 'done'>('idle')
  const [showPassword, setShowPassword] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    setFormError(null)

    // diperiksa di browser dulu agar salah ketik tidak menghabiskan jatah percobaan login
    const issue = emailIssue(email, emailDomain)
    setEmailError(issue)
    if (issue) {
      emailRef.current?.focus()
      return
    }
    if (!password) {
      setPasswordError('Enter your password.')
      passwordRef.current?.focus()
      return
    }

    setStatus('pending')
    setPasswordError(null)
    const { error } = await authClient.signIn.email({ email, password })
    if (error) {
      setStatus('idle')
      if (error.status === 429) {
        setFormError('Too many attempts. Try again in 15 minutes.')
      } else if (error.status === 401 || error.status === 400) {
        // Server tidak membedakan email tak terdaftar dan password salah (mencegah menebak akun);
        // karena format email sudah benar, yang ditandai kolom password.
        setPasswordError('Incorrect password.')
        passwordRef.current?.select()
      } else {
        setFormError('Something went wrong. Try again.')
      }
      return
    }
    setStatus('done')
    // layout server membaca cookie sesi baru saat navigasi
    router.replace(redirectTo)
    router.refresh()
  }

  return (
    <div lang="en" className="login-card relative w-full max-w-sm rounded-2xl">
      <div className="relative overflow-hidden rounded-2xl bg-black/50 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
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
            {/* foto dengan kilau berjalan yang sama seperti kolom email dan password */}
            <div className="login-field login-ring mx-auto mb-4 size-[60px]">
              <Image
                src={DEFAULT_PROFILE_AVATAR}
                alt=""
                width={112}
                height={112}
                sizes="56px"
                priority
                className="size-full rounded-full bg-black object-cover"
              />
            </div>
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
              <div className={cn('login-field relative', emailError && 'login-field-bad')}>
                <Mail
                  className={cn(
                    'pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2',
                    emailError ? 'text-red-300' : 'text-white/50',
                  )}
                  aria-hidden="true"
                />
                <input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  placeholder="mirzaganteng@gmail.com"
                  aria-invalid={emailError ? true : undefined}
                  aria-describedby={emailError ? 'email-error' : undefined}
                  onBlur={(event) => {
                    if (event.currentTarget.value.trim())
                      setEmailError(emailIssue(event.currentTarget.value, emailDomain))
                  }}
                  onChange={(event) => {
                    // tanda hilang begitu isinya sudah benar
                    if (emailError && !emailIssue(event.currentTarget.value, emailDomain))
                      setEmailError(null)
                  }}
                  className={cn(inputClass, 'pr-3')}
                />
              </div>
              <FieldMessage id="email-error">{emailError}</FieldMessage>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-white/80">
                Password
              </label>
              <div
                className={cn(
                  'login-field login-field-delay relative',
                  passwordError && 'login-field-bad',
                )}
              >
                <Lock
                  className={cn(
                    'pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2',
                    passwordError ? 'text-red-300' : 'text-white/50',
                  )}
                  aria-hidden="true"
                />
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  aria-invalid={passwordError ? true : undefined}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                  onChange={() => setPasswordError(null)}
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
              <FieldMessage id="password-error">{passwordError}</FieldMessage>
            </div>

            {/* satu wilayah pengumuman untuk pembaca layar; pesan yang terlihat ada di bawah kolom */}
            <p id="login-error" role="alert" className="sr-only">
              {formError ?? emailError ?? passwordError}
            </p>
            {formError ? (
              <p
                aria-hidden="true"
                className="flex items-center gap-1.5 text-[0.8125rem] text-red-300"
              >
                <CircleAlert className="size-3.5 shrink-0" />
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={status !== 'idle'}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white text-sm font-semibold text-black transition-colors hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none disabled:opacity-70"
            >
              {status === 'pending' ? (
                <>
                  <span
                    aria-hidden="true"
                    className="size-4 animate-spin rounded-full border-2 border-black/70 border-t-transparent"
                  />
                  Logging in…
                </>
              ) : status === 'done' ? (
                <>
                  <Check className="size-4" aria-hidden="true" />
                  Logged in
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
