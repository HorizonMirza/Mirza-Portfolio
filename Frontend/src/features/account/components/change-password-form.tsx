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
import { PasswordInput } from '@/components/admin/password-input'
import { MIN_PASSWORD_LENGTH, PASSWORD_RULES } from '@/lib/password-policy'
import { cn } from '@/lib/utils'

import { changePassword } from '../actions'
import { passwordStrength } from '../password-strength'
import { type ChangePasswordInput, changePasswordSchema } from '../schema'

const empty: ChangePasswordInput = { currentPassword: '', newPassword: '' }

const STRENGTH_LABEL = ['', 'Terlalu pendek', 'Cukup', 'Kuat', 'Sangat Kuat'] as const

// Ganti password di panel Akun (DESIGN.md bagian 120): aturan wajib dicentang langsung saat mengetik
// dan garis kekuatan. Setelah berhasil, halaman dimuat ulang agar linimasa dan daftar
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
  const [next] = useWatch({ control, name: ['newPassword'] })
  const strength = passwordStrength(next ?? '')
  const placeholder = t('Min. {min} Karakter', { min: MIN_PASSWORD_LENGTH })
  // lima syarat yang ditampilkan, urutan dan tulisan sesuai permintaan pemilik 2026-11-16; "berbeda dari
  // password saat ini" tetap diperiksa saat Simpan lewat changePasswordSchema
  const rules = [
    { ok: PASSWORD_RULES.digit(next ?? ''), label: t('Minimal 1 Angka') },
    {
      ok: (next ?? '').length >= MIN_PASSWORD_LENGTH,
      label: t('Minimal {min} Karakter', { min: MIN_PASSWORD_LENGTH }),
    },
    { ok: PASSWORD_RULES.lower(next ?? ''), label: t('Minimal 1 Huruf Kecil') },
    { ok: PASSWORD_RULES.upper(next ?? ''), label: t('Minimal 1 Huruf Besar') },
    { ok: PASSWORD_RULES.symbol(next ?? ''), label: t('Minimal 1 Karakter Spesial') },
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
      <Field id="currentPassword" label="Password Saat Ini" error={errors.currentPassword?.message}>
        {(a) => (
          <PasswordInput
            autoComplete="current-password"
            placeholder={placeholder}
            {...a}
            {...register('currentPassword')}
          />
        )}
      </Field>
      <Field id="newPassword" label="Password Baru" error={errors.newPassword?.message}>
        {(a) => (
          <PasswordInput
            autoComplete="new-password"
            placeholder={placeholder}
            {...a}
            {...register('newPassword')}
          />
        )}
      </Field>
      <div className="flex flex-col gap-2">
        {/* satu garis kekuatan, lalu daftar syarat kecil (tata letak form Ganti Password acuan pemilik
            2026-11-16); label kekuatan tetap dibacakan pembaca layar */}
        <div className="h-1 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
          <span
            className={cn(
              'block h-full rounded-full transition-[width,background-color] duration-200',
              strength <= 1 ? 'bg-danger' : strength === 2 ? 'bg-muted' : 'bg-success',
            )}
            style={{ width: `${strength * 25}%` }}
          />
        </div>
        <p className="sr-only" aria-live="polite">
          {strength > 0 ? t('Kekuatan: {level}', { level: t(STRENGTH_LABEL[strength]!) }) : ''}
        </p>
        <p className="mt-1 text-sm font-medium">{t('Syarat Password:')}</p>
        <ul className="flex flex-col gap-1 text-[13px]">
          {rules.map((rule) => (
            <li
              key={rule.label}
              className={cn('flex items-center gap-2', rule.ok ? 'text-text' : 'text-muted')}
            >
              {rule.ok ? (
                <Check className="size-3.5 text-success" aria-hidden="true" />
              ) : (
                <X className="size-3.5" aria-hidden="true" />
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
      <Button type="submit" loading={pending} className="w-full">
        {pending ? t('Menyimpan…') : t('Simpan')}
      </Button>
    </form>
  )
}
