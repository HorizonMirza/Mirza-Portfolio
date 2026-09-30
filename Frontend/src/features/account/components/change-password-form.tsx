'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'

import { applyResult } from '@/components/admin/apply-result'
import { Field } from '@/components/admin/field'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { changePassword } from '../actions'
import { type ChangePasswordInput, changePasswordSchema, MIN_PASSWORD } from '../schema'

const empty: ChangePasswordInput = { currentPassword: '', newPassword: '', confirmPassword: '' }

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition()
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: empty,
  })
  const {
    register,
    formState: { errors },
  } = form

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      if (applyResult(await changePassword(values), form.setError)) form.reset(empty)
    })
  })

  return (
    <Card className="max-w-lg">
      <h2 className="text-h3 font-semibold">Ganti password</h2>
      <form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col gap-4">
        {/* username tersembunyi membantu pengelola password mengenali akun */}
        <input type="text" name="username" autoComplete="username" hidden readOnly />
        <Field
          id="currentPassword"
          label="Password saat ini"
          error={errors.currentPassword?.message}
        >
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
          hint={`Minimal ${MIN_PASSWORD} karakter. Frasa panjang lebih kuat daripada simbol acak.`}
          error={errors.newPassword?.message}
        >
          {(a) => (
            <Input
              type="password"
              autoComplete="new-password"
              {...a}
              {...register('newPassword')}
            />
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
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? 'Menyimpan…' : 'Ganti password'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
