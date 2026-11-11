'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Check, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { useAdminT } from '@/components/admin/admin-lang'
import { applyResult } from '@/components/admin/apply-result'
import { Field } from '@/components/admin/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MIN_PASSWORD_LENGTH } from '@/lib/password-policy'
import { cn } from '@/lib/utils'

import { changePassword } from '../actions'
import { passwordStrength } from '../password-strength'
import { type ChangePasswordInput, changePasswordSchema } from '../schema'

const empty: ChangePasswordInput = { currentPassword: '', newPassword: '', confirmPassword: '' }

const STRENGTH_LABEL = ['', 'Terlalu pendek', 'Cukup', 'Kuat', 'Sangat kuat'] as const

// Ganti password di panel Akun (DESIGN.md bagian 120): aturan wajib dicentang langsung saat mengetik
// dan meter kekuatan empat ruas. Setelah berhasil, halaman dimuat ulang agar linimasa dan daftar
// perangkat ikut berubah (perangkat lain dikeluarkan).
export function ChangePasswordForm({ onDone }: { onDone?: () => void } = {}) {
  const t = useAdminT()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: empty,
  })
  const {
    register,
    control,
    formState: { errors },
  } = form
  const [current, next, repeat] = useWatch({
    control,
    name: ['currentPassword', 'newPassword', 'confirmPassword'],
  })
  const strength = passwordStrength(next ?? '')
  const rules = [
    {
      ok: (next ?? '').length >= MIN_PASSWORD_LENGTH,
      label: t('Minimal {min} karakter', { min: MIN_PASSWORD_LENGTH }),
    },
    { ok: Boolean(next) && next !== current, label: t('Berbeda dari password saat ini') },
    { ok: Boolean(next) && next === repeat, label: t('Ulangan sama') },
  ]

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      if (applyResult(await changePassword(values), form.setError)) {
        form.reset(empty)
        if (onDone) onDone()
        else router.refresh()
      }
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {/* username tersembunyi membantu pengelola password mengenali akun */}
      <input type="text" name="username" autoComplete="username" hidden readOnly />
      <Field id="currentPassword" label="Password saat ini" error={errors.currentPassword?.message}>
        {(a) => (
          <Input
            type="password"
            autoComplete="current-password"
            {...a}
            {...register('currentPassword')}
          />
        )}
      </Field>
      <Field
        id="newPassword"
        label="Password baru"
        hint={t('Frasa panjang lebih kuat daripada simbol acak.')}
        error={errors.newPassword?.message}
      >
        {(a) => (
          <Input type="password" autoComplete="new-password" {...a} {...register('newPassword')} />
        )}
      </Field>
      <Field
        id="confirmPassword"
        label="Ulangi password baru"
        error={errors.confirmPassword?.message}
      >
        {(a) => (
          <Input
            type="password"
            autoComplete="new-password"
            {...a}
            {...register('confirmPassword')}
          />
        )}
      </Field>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-4 gap-1" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-colors duration-200',
                i <= strength
                  ? strength <= 1
                    ? 'bg-danger'
                    : strength === 2
                      ? 'bg-muted'
                      : 'bg-success'
                  : 'bg-surface-2',
              )}
            />
          ))}
        </div>
        <p className="text-sm text-muted" aria-live="polite">
          {strength > 0
            ? t('Kekuatan: {level}', { level: t(STRENGTH_LABEL[strength]!) })
            : t('Kekuatan password tampil saat Anda mengetik.')}
        </p>
        <ul className="flex flex-col gap-1 text-sm">
          {rules.map((rule) => (
            <li
              key={rule.label}
              className={cn('flex items-center gap-2', rule.ok ? 'text-text' : 'text-muted')}
            >
              {rule.ok ? (
                <Check className="size-4 text-success" aria-hidden="true" />
              ) : (
                <X className="size-4" aria-hidden="true" />
              )}
              <span>
                {rule.label}
                <span className="sr-only">
                  {' '}
                  {rule.ok ? t('(terpenuhi)') : t('(belum terpenuhi)')}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? t('Menyimpan…') : t('Ganti password')}
        </Button>
      </div>
    </form>
  )
}
