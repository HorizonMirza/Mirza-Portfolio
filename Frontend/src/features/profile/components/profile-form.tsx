'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { applyResult } from '@/components/admin/apply-result'
import { BilingualTabs, countLangErrors } from '@/components/admin/bilingual-tabs'
import { Field } from '@/components/admin/field'
import { FormFooter } from '@/components/admin/form-footer'
import { MarkdownEditor } from '@/components/admin/markdown-editor'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { saveProfile } from '../actions'
import { type ProfileInput, profileSchema } from '../schema'

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
          hint={
            id
              ? 'Judul gambar pratinjau saat tautan dibagikan dan deskripsi untuk mesin pencari. Spesifik, tanpa klise.'
              : 'Link preview image title and search engine description.'
          }
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
          hint={
            id
              ? 'Subjudul gambar pratinjau tautan, jabatan untuk mesin pencari, dan cadangan baris peran di footer.'
              : 'Link preview subtitle, job title for search engines, and footer fallback.'
          }
          error={errors[`currentRole_${lang}`]?.message}
        >
          {(a) => <Input {...a} {...register(`currentRole_${lang}`)} />}
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
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-h3 font-semibold">Teks dua bahasa</h2>
        <BilingualTabs
          errors={countLangErrors(errors)}
          id={langFields('id')}
          en={langFields('en')}
        />
      </Card>

      <FormFooter pending={pending} />
    </form>
  )
}
