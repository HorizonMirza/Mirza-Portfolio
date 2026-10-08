'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
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

import { saveExperience } from '../actions'
import {
  employmentTypeLabel,
  type ExperienceInput,
  experienceSchema,
  experienceTypeLabel,
} from '../schema'

type Lang = 'id' | 'en'

export function ExperienceForm({
  experienceId,
  defaultValues,
}: {
  experienceId: string | null
  defaultValues: ExperienceInput
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const form = useForm<ExperienceInput>({ resolver: zodResolver(experienceSchema), defaultValues })
  const {
    register,
    control,
    formState: { errors },
  } = form

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveExperience(experienceId, values)
      if (!applyResult(result, form.setError) || !result.ok) return
      if (experienceId) form.reset(values)
      else if (result.data) router.replace(`/admin/experience/${result.data.id}`)
    })
  })

  const langFields = (lang: Lang) => (
    <>
      <Field
        id={`title_${lang}`}
        label={lang === 'id' ? 'Peran' : 'Role'}
        error={errors[`title_${lang}`]?.message}
      >
        {(a) => <Input {...a} {...register(`title_${lang}`)} />}
      </Field>
      <Field
        id={`description_${lang}`}
        label={lang === 'id' ? 'Uraian' : 'Description'}
        hint={
          lang === 'id'
            ? 'Tulis hasil yang bisa dibuktikan, satu poin per baris dengan "- ".'
            : 'Outcomes, one bullet per line.'
        }
        error={errors[`description_${lang}`]?.message}
      >
        {(a) => (
          <Controller
            control={control}
            name={`description_${lang}`}
            render={({ field }) => <MarkdownEditor {...a} {...field} rows={8} />}
          />
        )}
      </Field>
    </>
  )

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Card className="grid gap-5 md:grid-cols-2">
        <h2 className="text-h3 font-semibold md:col-span-2">Detail</h2>
        <Field id="type" label="Jenis" error={errors.type?.message}>
          {(a) => (
            <NativeSelect {...a} {...register('type')}>
              {Object.entries(experienceTypeLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>
        <Field id="organization" label="Instansi" error={errors.organization?.message}>
          {(a) => <Input {...a} {...register('organization')} />}
        </Field>
        <Field
          id="organization_en"
          label="Instansi dalam bahasa Inggris (opsional)"
          hint='Isi bila nama di halaman English berbeda, mis. "Bina Nusantara University". Kosong = sama.'
          error={errors.organization_en?.message}
        >
          {(a) => <Input {...a} {...register('organization_en')} />}
        </Field>
        <Field id="startMonth" label="Mulai" error={errors.startMonth?.message}>
          {(a) => <Input type="month" {...a} {...register('startMonth')} />}
        </Field>
        <Field
          id="endMonth"
          label="Selesai"
          hint="Kosongkan bila masih berlangsung."
          error={errors.endMonth?.message}
        >
          {(a) => <Input type="month" {...a} {...register('endMonth')} />}
        </Field>
        <Field
          id="employmentType"
          label="Jenis pekerjaan (opsional)"
          hint='Tampil di samping instansi, mis. "PT PGAS Solution · Internship".'
          error={errors.employmentType?.message}
        >
          {(a) => (
            <NativeSelect {...a} {...register('employmentType')}>
              <option value="">Tidak ditampilkan</option>
              {Object.entries(employmentTypeLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>
        <Field id="location" label="Lokasi (opsional)" error={errors.location?.message}>
          {(a) => <Input {...a} {...register('location')} />}
        </Field>
        <label className="flex min-h-11 items-center gap-3 md:col-span-2">
          <input type="checkbox" className="size-5 accent-primary" {...register('inStory')} />
          <span>Tampilkan sebagai titik di garis cerita beranda (Dari komunitas ke software)</span>
        </label>
        <Field
          id="status"
          label="Status"
          hint="Draf tidak tampil di situs publik."
          error={errors.status?.message}
        >
          {(a) => (
            <NativeSelect {...a} {...register('status')}>
              <option value="PUBLISHED">Terbit</option>
              <option value="DRAFT">Draf</option>
            </NativeSelect>
          )}
        </Field>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-h3 font-semibold">Isi dua bahasa</h2>
        <BilingualTabs
          errors={countLangErrors(errors)}
          id={langFields('id')}
          en={langFields('en')}
        />
      </Card>

      <FormFooter
        pending={pending}
        cancelHref="/admin/experience"
        submitLabel={experienceId ? 'Simpan' : 'Tambah pengalaman'}
      />
    </form>
  )
}
