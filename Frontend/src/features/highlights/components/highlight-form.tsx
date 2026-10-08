'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'

import { applyResult } from '@/components/admin/apply-result'
import { Field } from '@/components/admin/field'
import { FormFooter } from '@/components/admin/form-footer'
import { NativeSelect } from '@/components/admin/select'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { saveHighlight } from '../actions'
import { type HighlightInput, highlightSchema } from '../schema'

export function HighlightForm({
  highlightId,
  defaultValues,
}: {
  highlightId: string | null
  defaultValues: HighlightInput
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const form = useForm<HighlightInput>({ resolver: zodResolver(highlightSchema), defaultValues })
  const {
    register,
    formState: { errors },
  } = form

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveHighlight(highlightId, values)
      if (!applyResult(result, form.setError) || !result.ok) return
      if (highlightId) form.reset(values)
      else if (result.data) router.replace(`/admin/highlights/${result.data.id}`)
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Card className="grid gap-5 md:grid-cols-2">
        <h2 className="text-h3 font-semibold md:col-span-2">Angka</h2>
        <Field
          id="value"
          label="Angka"
          hint="Tulis tanpa titik, mis. 1000. Di situs tampil 1.000 (ID) atau 1,000 (EN)."
          error={errors.value?.message}
        >
          {(a) => (
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              {...a}
              {...register('value', { valueAsNumber: true })}
            />
          )}
        </Field>
        <Field
          id="suffix"
          label="Akhiran (opsional)"
          hint='Ditulis setelah angka, mis. "+" atau "%".'
          error={errors.suffix?.message}
        >
          {(a) => <Input {...a} {...register('suffix')} />}
        </Field>
        <Field
          id="label_id"
          label="Keterangan (ID)"
          hint='Mis. "anggota di Reclub".'
          error={errors.label_id?.message}
        >
          {(a) => <Input {...a} {...register('label_id')} />}
        </Field>
        <Field
          id="label_en"
          label="Keterangan (EN)"
          hint='E.g. "members on Reclub".'
          error={errors.label_en?.message}
        >
          {(a) => <Input {...a} {...register('label_en')} />}
        </Field>
        <Field
          id="source"
          label="Asal (opsional)"
          hint='Nama komunitas atau tempat, mis. "Ace Padel Club". Sama di kedua bahasa.'
          error={errors.source?.message}
        >
          {(a) => <Input {...a} {...register('source')} />}
        </Field>
        <Field
          id="order"
          label="Urutan"
          hint="Angka kecil tampil lebih dulu."
          error={errors.order?.message}
        >
          {(a) => (
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              {...a}
              {...register('order', { valueAsNumber: true })}
            />
          )}
        </Field>
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

      <FormFooter
        pending={pending}
        cancelHref="/admin/highlights"
        submitLabel={highlightId ? 'Simpan' : 'Tambah angka'}
      />
    </form>
  )
}
