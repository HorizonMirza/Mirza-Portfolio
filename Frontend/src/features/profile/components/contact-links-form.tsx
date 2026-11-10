'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'

import { applyResult } from '@/components/admin/apply-result'
import { Field } from '@/components/admin/field'
import { FormFooter } from '@/components/admin/form-footer'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { saveContactLinks } from '../actions'
import { type ContactLinksInput, contactLinksSchema, SOCIAL_KEYS, socialLabel } from '../schema'

// Admin → Footer: WhatsApp, Email, LinkedIn, GitHub, Instagram, situs lain, dan link Resume CV di
// kotak kontak footer (dipindah dari form Profil 2026-11-10, permintaan pemilik).
export function ContactLinksForm({ defaultValues }: { defaultValues: ContactLinksInput }) {
  const [pending, startTransition] = useTransition()
  const form = useForm<ContactLinksInput>({
    resolver: zodResolver(contactLinksSchema),
    defaultValues,
  })
  const {
    register,
    formState: { errors },
  } = form

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveContactLinks(values)
      if (applyResult(result, form.setError)) form.reset(values)
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Card className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="text-h3 font-semibold">Kontak dan Resume CV</h2>
          <p className="mt-1 text-sm text-muted">
            Kotak kontak di footer setiap halaman. Email dan WhatsApp hanya disimpan di database,
            tidak di repo. Kosongkan bila tidak ingin ditampilkan.
          </p>
        </div>
        <Field id="email" label="Email publik (opsional)" error={errors.email?.message}>
          {(a) => <Input type="email" autoComplete="email" {...a} {...register('email')} />}
        </Field>
        <Field
          id="whatsapp"
          label="WhatsApp (opsional)"
          hint="Contoh: +6281234567890"
          error={errors.whatsapp?.message}
        >
          {(a) => <Input type="tel" inputMode="tel" {...a} {...register('whatsapp')} />}
        </Field>
        <Field
          id="cvUrl"
          label="Link CV (opsional)"
          hint={
            'Mis. link Google Drive dengan akses "Siapa saja yang memiliki link". Bila diisi, semua tombol CV membuka link ini; bila kosong, memakai PDF yang di-upload.'
          }
          error={errors.cvUrl?.message}
        >
          {(a) => <Input type="url" inputMode="url" {...a} {...register('cvUrl')} />}
        </Field>
        {SOCIAL_KEYS.map((key) => (
          <Field
            key={key}
            id={`socials-${key}`}
            label={`${socialLabel[key]} (opsional)`}
            error={errors.socials?.[key]?.message}
          >
            {(a) => <Input type="url" inputMode="url" {...a} {...register(`socials.${key}`)} />}
          </Field>
        ))}
      </Card>

      <FormFooter pending={pending} />
    </form>
  )
}
