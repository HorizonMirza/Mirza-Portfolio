'use client'

import { useId, useState, useTransition } from 'react'

import { applyResult } from '@/components/admin/apply-result'
import { Field } from '@/components/admin/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { updateAssetAlt } from '../actions'

export function AssetAltForm({
  assetId,
  alt_id,
  alt_en,
}: {
  assetId: string
  alt_id: string
  alt_en: string
}) {
  const uid = useId()
  const [values, setValues] = useState({ alt_id, alt_en })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()
  const dirty = values.alt_id !== alt_id || values.alt_en !== alt_en

  function save() {
    startTransition(async () => {
      const result = await updateAssetAlt(assetId, values)
      setErrors(result.ok ? {} : (result.fieldErrors ?? {}))
      applyResult(result)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <Field id={`${uid}-alt_id`} label="Teks alternatif (Indonesia)" error={errors.alt_id}>
        {(a) => (
          <Input
            value={values.alt_id}
            onChange={(e) => setValues({ ...values, alt_id: e.target.value })}
            {...a}
          />
        )}
      </Field>
      <Field id={`${uid}-alt_en`} label="Alt text (English)" error={errors.alt_en}>
        {(a) => (
          <Input
            value={values.alt_en}
            onChange={(e) => setValues({ ...values, alt_en: e.target.value })}
            {...a}
          />
        )}
      </Field>
      <div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={save}
          disabled={pending || !dirty}
        >
          {pending ? 'Menyimpan…' : 'Simpan teks alternatif'}
        </Button>
      </div>
    </div>
  )
}
