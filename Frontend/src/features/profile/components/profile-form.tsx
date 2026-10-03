'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { applyResult } from '@/components/admin/apply-result'
import { BilingualTabs, countLangErrors } from '@/components/admin/bilingual-tabs'
import { Field } from '@/components/admin/field'
import { FormFooter } from '@/components/admin/form-footer'
import { MarkdownEditor } from '@/components/admin/markdown-editor'
import { NativeSelect } from '@/components/admin/select'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { saveProfile } from '../actions'
import {
  availabilityLabel,
  type ProfileInput,
  profileSchema,
  SOCIAL_KEYS,
  socialLabel,
} from '../schema'

type Lang = 'id' | 'en'

export function ProfileForm({ defaultValues }: { defaultValues: ProfileInput }) {
  const [pending, startTransition] = useTransition()
  const form = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues })
  const {
    register,
    control,
    formState: { errors },
  } = form

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveProfile(values)
      if (applyResult(result, form.setError)) form.reset(values)
    })
  })

  const langFields = (lang: Lang) => {
    const id = lang === 'id'
    return (
      <>
        <Field
          id={`headline_${lang}`}
          label="Headline"
          hint={id ? 'Kalimat utama di hero. Spesifik, tanpa klise.' : 'Main hero sentence.'}
          error={errors[`headline_${lang}`]?.message}
        >
          {(a) => <Textarea rows={2} {...a} {...register(`headline_${lang}`)} />}
        </Field>
        <Field id={`bio_${lang}`} label="Bio" error={errors[`bio_${lang}`]?.message}>
          {(a) => (
            <Controller
              control={control}
              name={`bio_${lang}`}
              render={({ field }) => <MarkdownEditor {...a} {...field} rows={8} />}
            />
          )}
        </Field>
        <Field
          id={`currentRole_${lang}`}
          label={id ? 'Posisi sekarang (opsional)' : 'Current role (optional)'}
          hint={id ? 'Tampil di pelat status hero.' : 'Shown in the hero status plate.'}
          error={errors[`currentRole_${lang}`]?.message}
        >
          {(a) => <Input {...a} {...register(`currentRole_${lang}`)} />}
        </Field>
        <Field
          id={`availabilityNote_${lang}`}
          label={id ? 'Catatan ketersediaan (opsional)' : 'Availability note (optional)'}
          hint={id ? 'Contoh: mulai Januari 2027.' : 'Example: from January 2027.'}
          error={errors[`availabilityNote_${lang}`]?.message}
        >
          {(a) => <Input {...a} {...register(`availabilityNote_${lang}`)} />}
        </Field>
      </>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Card className="grid gap-5 md:grid-cols-2">
        <h2 className="text-h3 font-semibold md:col-span-2">Identitas</h2>
        <Field id="name" label="Nama" error={errors.name?.message}>
          {(a) => <Input autoComplete="name" {...a} {...register('name')} />}
        </Field>
        <Field id="city" label="Kota (opsional)" error={errors.city?.message}>
          {(a) => <Input {...a} {...register('city')} />}
        </Field>
        <Field id="availability" label="Status ketersediaan" error={errors.availability?.message}>
          {(a) => (
            <NativeSelect {...a} {...register('availability')}>
              {Object.entries(availabilityLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-h3 font-semibold">Teks dua bahasa</h2>
        <BilingualTabs
          errors={countLangErrors(errors)}
          id={langFields('id')}
          en={langFields('en')}
        />
      </Card>

      <Card className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="text-h3 font-semibold">Kontak dan link sosial</h2>
          <p className="mt-1 text-sm text-muted">
            Email dan WhatsApp hanya disimpan di database, tidak di repo. Kosongkan bila tidak ingin
            ditampilkan.
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
