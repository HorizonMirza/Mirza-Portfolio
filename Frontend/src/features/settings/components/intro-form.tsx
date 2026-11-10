'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'

import { applyResult } from '@/components/admin/apply-result'
import { BilingualTabs, countLangErrors } from '@/components/admin/bilingual-tabs'
import { Field } from '@/components/admin/field'
import { FormFooter } from '@/components/admin/form-footer'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

import { saveIntroNotice } from '../actions'
import { type IntroInput, introSchema } from '../schema'

// Admin → Bagian Awal: hanya isi kartu pembuka yang bisa diubah (permintaan pemilik 2026-11-10).
// Judul "Informasi Penting", label, dan tombol kartu adalah teks tetap.
export function IntroForm({ defaultValues }: { defaultValues: IntroInput }) {
  const [pending, startTransition] = useTransition()
  const form = useForm<IntroInput>({ resolver: zodResolver(introSchema), defaultValues })
  const {
    register,
    formState: { errors },
  } = form

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveIntroNotice(values)
      if (applyResult(result, form.setError)) form.reset(values)
    })
  })

  const body = (lang: 'id' | 'en') => {
    const name = `introBody_${lang}` as const
    return (
      <Field
        id={name}
        label={lang === 'id' ? 'Isi' : 'Text'}
        hint={
          lang === 'id'
            ? 'Dua sampai tiga kalimat, maksimal 600 karakter. Tulis **teks** untuk huruf tebal.'
            : 'Two or three sentences, at most 600 characters. Use **text** for bold.'
        }
        error={errors[name]?.message}
      >
        {(a) => <Textarea rows={4} {...a} {...register(name)} />}
      </Field>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="text-h3 font-semibold">Isi kartu pembuka</h2>
          <p className="mt-1 text-sm text-muted">
            Kalimat di bawah judul &quot;Informasi Penting&quot;, dalam bahasa Indonesia dan
            Inggris.
          </p>
        </div>
        <BilingualTabs errors={countLangErrors(errors)} id={body('id')} en={body('en')} />
      </Card>
      <FormFooter pending={pending} />
    </form>
  )
}
