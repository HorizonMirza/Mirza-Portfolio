'use client'

import { Mail, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type ReactNode, type RefObject, useId, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { useAdminT } from '@/components/admin/admin-lang'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { IconInput } from '@/components/admin/icon-input'
import { PasswordInput } from '@/components/admin/password-input'
import { Label } from '@/components/ui/label'
import type { ActionResult } from '@/lib/action-result'

import { changeAccountEmail, renameAccount } from '../actions'
import { ChangePasswordForm } from './change-password-form'

// Form di Admin → Akun muncul sebagai dialog dengan latar belakang buram (revisi pemilik 2026-11-16):
// nama, email, dan password. Nama dan email menampilkan yang lama, kolom yang baru, dan meminta
// password akun.
// Dialog dibuka dari baris biasa (bukan DialogTrigger), jadi fokus dikembalikan ke pembukanya lewat ref.
type ReturnFocus = RefObject<HTMLElement | null>
const restoreFocus = (ref?: ReturnFocus) => (event: Event) => {
  if (!ref?.current) return
  event.preventDefault()
  ref.current.focus()
}

function FormDialog({
  open,
  onOpenChange,
  title,
  returnFocus,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  returnFocus?: ReturnFocus
  children: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={restoreFocus(returnFocus)}
        className="max-h-[92dvh] max-w-md overflow-y-auto"
      >
        <DialogTitle>{title}</DialogTitle>
        {/* tanpa keterangan di layar (revisi pemilik 2026-11-16); pembaca layar tetap dapat nama dialog */}
        <DialogDescription className="sr-only">{title}</DialogDescription>
        <div className="mt-5">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

type Identity = 'name' | 'email'

const IDENTITY: Record<
  Identity,
  {
    title: string
    oldLabel: string
    newLabel: string
    type: 'text' | 'email'
    maxLength: number
  }
> = {
  name: {
    title: 'Ganti nama',
    oldLabel: 'Nama lama',
    newLabel: 'Nama baru',
    type: 'text',
    maxLength: 80,
  },
  email: {
    title: 'Ganti email',
    oldLabel: 'Email lama',
    newLabel: 'Email baru',
    type: 'email',
    maxLength: 254,
  },
}

const ACTION: Record<Identity, (input: unknown) => Promise<ActionResult>> = {
  name: renameAccount,
  email: changeAccountEmail,
}

// Nama atau email: lama (tidak bisa diubah), baru, dan password akun.
export function ChangeIdentityDialog({
  kind,
  current,
  open,
  onOpenChange,
  returnFocus,
}: {
  kind: Identity
  current: string
  open: boolean
  onOpenChange: (open: boolean) => void
  returnFocus?: ReturnFocus
}) {
  const t = useAdminT()
  const router = useRouter()
  const copy = IDENTITY[kind]
  const [value, setValue] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ value?: string; password?: string; general?: string }>({})
  const [pending, startTransition] = useTransition()
  const id = useId()

  function close(next: boolean) {
    if (!next) {
      setValue('')
      setPassword('')
      setErrors({})
    }
    onOpenChange(next)
  }

  return (
    <FormDialog open={open} onOpenChange={close} title={t(copy.title)} returnFocus={returnFocus}>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          startTransition(async () => {
            const result = await ACTION[kind]({ [kind]: value, password })
            if (result.ok) {
              toast.success(t(result.message), { id: `account-${kind}` })
              close(false)
              router.refresh()
              return
            }
            setErrors({
              value: result.fieldErrors?.[kind],
              password: result.fieldErrors?.password,
              general:
                result.fieldErrors?.[kind] || result.fieldErrors?.password
                  ? undefined
                  : result.message,
            })
          })
        }}
      >
        {/* nama atau email sekarang: kartu bergaris dengan ikon bulat, keterangan kecil di atas dan
            nilainya di bawah (tata letak form Ganti Username/Password acuan pemilik 2026-11-16);
            hanya ditampilkan, tidak bisa ditekan atau diubah */}
        <div className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2 select-none">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-border-strong text-muted [&_svg]:size-4"
          >
            {kind === 'email' ? <Mail /> : <User />}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-xs text-muted">{t(copy.oldLabel)}</span>
            <span className="text-base break-words">{current}</span>
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-new`}>{t(copy.newLabel)}</Label>
          <IconInput
            icon={kind === 'email' ? <Mail /> : <User />}
            id={`${id}-new`}
            type={copy.type}
            value={value}
            maxLength={copy.maxLength}
            autoComplete="off"
            aria-invalid={errors.value ? true : undefined}
            aria-describedby={errors.value ? `${id}-new-error` : undefined}
            onChange={(event) => {
              setValue(event.target.value)
              setErrors((e) => ({ ...e, value: undefined, general: undefined }))
            }}
          />
          {errors.value ? (
            <p id={`${id}-new-error`} className="text-sm text-danger">
              {t(errors.value)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-password`}>{t('Password')}</Label>
          <PasswordInput
            id={`${id}-password`}
            value={password}
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? `${id}-password-error` : undefined}
            onChange={(event) => {
              setPassword(event.target.value)
              setErrors((e) => ({ ...e, password: undefined, general: undefined }))
            }}
          />
          {errors.password ? (
            <p id={`${id}-password-error`} className="text-sm text-danger">
              {t(errors.password)}
            </p>
          ) : null}
        </div>
        {errors.general ? (
          <p role="alert" className="text-sm text-danger">
            {t(errors.general)}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={pending || value.trim() === '' || password === ''}
          className="self-end"
        >
          {pending ? t('Menyimpan…') : t('Simpan')}
        </Button>
      </form>
    </FormDialog>
  )
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
  returnFocus,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  returnFocus?: ReturnFocus
}) {
  const t = useAdminT()
  const router = useRouter()
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('Ganti password')}
      returnFocus={returnFocus}
    >
      <ChangePasswordForm
        onDone={() => {
          onOpenChange(false)
          router.refresh()
        }}
      />
    </FormDialog>
  )
}
