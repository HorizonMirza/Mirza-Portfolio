'use client'

import Image, { type StaticImageData } from 'next/image'
import { useRouter } from 'next/navigation'
import { type ReactNode, type RefObject, useId, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { useAdminT } from '@/components/admin/admin-lang'
import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionResult } from '@/lib/action-result'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'
import { removeAsset } from '@/features/assets/actions'

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
  description,
  returnFocus,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  returnFocus?: ReturnFocus
  children: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        blur
        onCloseAutoFocus={restoreFocus(returnFocus)}
        className="max-h-[92dvh] max-w-md overflow-y-auto"
      >
        <DialogTitle>{title}</DialogTitle>
        {description ? (
          <DialogDescription>{description}</DialogDescription>
        ) : (
          <DialogDescription className="sr-only">{title}</DialogDescription>
        )}
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
    description: string
    oldLabel: string
    newLabel: string
    type: 'text' | 'email'
    maxLength: number
  }
> = {
  name: {
    title: 'Ganti nama',
    description:
      'Tampil di menu profil, sidebar, dan log audit. Nama di situs publik diubah di menu Tentang, Profil.',
    oldLabel: 'Nama lama',
    newLabel: 'Nama baru',
    type: 'text',
    maxLength: 80,
  },
  email: {
    title: 'Ganti email',
    description: 'Email ini dipakai untuk masuk ke panel admin.',
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
    <FormDialog
      open={open}
      onOpenChange={close}
      title={t(copy.title)}
      description={t(copy.description)}
      returnFocus={returnFocus}
    >
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
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-old`}>{t(copy.oldLabel)}</Label>
          <Input id={`${id}-old`} value={current} readOnly aria-readonly="true" tabIndex={-1} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-new`}>{t(copy.newLabel)}</Label>
          <Input
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
          <Input
            id={`${id}-password`}
            type="password"
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
        <div>
          <Button type="submit" disabled={pending || value.trim() === '' || password === ''}>
            {pending ? t('Menyimpan…') : t('Simpan')}
          </Button>
        </div>
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
      description={t('Perangkat lain otomatis keluar setelah password diganti.')}
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

// Foto profil ditekan: tampil penuh. Foto unggahan bisa dihapus dari sini untuk kembali ke foto bawaan.
export function PhotoLightbox({
  open,
  onOpenChange,
  photo,
  photoAssetId,
  returnFocus,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  photo: string | StaticImageData
  photoAssetId: string | null
  returnFocus?: ReturnFocus
}) {
  const t = useAdminT()
  const router = useRouter()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        blur
        onCloseAutoFocus={restoreFocus(returnFocus)}
        className="w-[min(92vw,34rem)] max-w-none p-3"
      >
        <DialogTitle className="sr-only">{t('Foto profil')}</DialogTitle>
        <DialogDescription className="sr-only">{t('Foto profil')}</DialogDescription>
        <Image
          placeholder={SHIMMER_PLACEHOLDER}
          src={photo}
          alt={t('Foto profil')}
          width={1024}
          height={1024}
          sizes="(min-width: 640px) 34rem, 92vw"
          className="mx-auto max-h-[78dvh] w-full rounded-xl bg-text object-contain"
        />
        {photoAssetId ? (
          <div className="mt-2 flex items-center justify-between gap-3 px-1">
            <p className="text-sm text-muted">
              {t('Hapus foto unggahan untuk kembali ke foto bawaan.')}
            </p>
            <ConfirmDelete
              title="Hapus Foto"
              iconOnly
              itemLabel={t('foto unggahan')}
              onConfirm={removeAsset.bind(null, photoAssetId)}
              onDone={() => {
                onOpenChange(false)
                router.refresh()
              }}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
