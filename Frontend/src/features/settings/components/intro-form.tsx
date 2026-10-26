'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'

import { applyResult } from '@/components/admin/apply-result'
import { BilingualTabs, countLangErrors } from '@/components/admin/bilingual-tabs'
import { Field } from '@/components/admin/field'
import { FormFooter } from '@/components/admin/form-footer'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { saveIntroNotice } from '../actions'
import { type IntroInput, introSchema } from '../schema'

export function IntroForm({ defaultValues }: { defaultValues: IntroInput }) {
  const [pending, startTransition] = useTransition()
  const form = useForm<IntroInput>({ resolver: zodResolver(introSchema), defaultValues })
  const {
    register,
    formState: { errors },
  } = form

  const introFields = (lang: 'id' | 'en') => (
    <>
      <Field
        id={`introTitle_${lang}`}
        label={lang === 'id' ? 'Judul' : 'Title'}
        hint={lang === 'id' ? 'Mis. Informasi Penting' : 'E.g. Important Information'}
        error={errors[`introTitle_${lang}`]?.message}
      >
        {(a) => <Input {...a} {...register(`introTitle_${lang}`)} />}
      </Field>
      <Field
        id={`introBody_${lang}`}
        label={lang === 'id' ? 'Isi' : 'Text'}
        hint={
          lang === 'id'
            ? 'Dua sampai tiga kalimat, maksimal 600 karakter. Tulis **teks** untuk huruf tebal.'
            : 'Two or three sentences. Use **text** for bold.'
        }
        error={errors[`introBody_${lang}`]?.message}
      >
        {(a) => <Textarea rows={4} {...a} {...register(`introBody_${lang}`)} />}
      </Field>
    </>
  )

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveIntroNotice(values)
      if (applyResult(result, form.setError)) form.reset(values)
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="text-h3 font-semibold">Pemberitahuan pembuka</h2>
          <p className="mt-1 text-sm text-muted">
            Kartu singkat yang muncul sekali setiap pengunjung membuka situs, sebelum masuk ke
            halaman. Berisi judul, isi, pilihan ID/EN, dan tombol Resume CV (bila CV ada) dan
            Beranda.
          </p>
        </div>
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" className="size-5 accent-primary" {...register('introEnabled')} />
          <span>Tampilkan pemberitahuan pembuka</span>
        </label>
        <BilingualTabs
          errors={countLangErrors(errors)}
          id={introFields('id')}
          en={introFields('en')}
        />
      </Card>
      <FormFooter pending={pending} />
    </form>
  )
}
