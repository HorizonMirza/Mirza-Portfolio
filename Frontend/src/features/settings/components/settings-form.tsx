'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Volume2, VolumeX } from 'lucide-react'
import { useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { applyResult } from '@/components/admin/apply-result'
import { FormFooter } from '@/components/admin/form-footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { previewSound } from '@/lib/ui-sounds'

import { saveSettings } from '../actions'
import { type SettingsInput, settingsSchema } from '../schema'

export function SettingsForm({ defaultValues }: { defaultValues: SettingsInput }) {
  const [pending, startTransition] = useTransition()
  const form = useForm<SettingsInput>({ resolver: zodResolver(settingsSchema), defaultValues })
  const {
    register,
    control,
    formState: { errors },
  } = form
  const volume = useWatch({ control, name: 'soundVolume' })

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveSettings(values)
      if (applyResult(result, form.setError)) form.reset(values)
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="text-h3 font-semibold">Suara tombol</h2>
          <p className="mt-1 text-sm text-muted">
            Satu volume untuk suara tombol tema, bahasa, dan menu di situs publik. 0 berarti tanpa
            suara. Pengunjung tetap bisa mengecilkan suara dari perangkatnya.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="soundVolume" className="text-sm font-medium">
              Volume
            </label>
            <output
              htmlFor="soundVolume"
              className="font-mono text-sm tabular-nums"
              aria-live="polite"
            >
              {volume}%
            </output>
          </div>
          <div className="flex items-center gap-3">
            <VolumeX className="size-4 shrink-0 text-muted" aria-hidden="true" />
            <input
              id="soundVolume"
              type="range"
              min={0}
              max={100}
              step={5}
              aria-invalid={errors.soundVolume ? true : undefined}
              aria-describedby={errors.soundVolume ? 'soundVolume-error' : undefined}
              className="h-11 w-full cursor-pointer accent-primary"
              {...register('soundVolume', { valueAsNumber: true })}
            />
            <Volume2 className="size-4 shrink-0 text-muted" aria-hidden="true" />
          </div>
          {errors.soundVolume ? (
            <p id="soundVolume-error" className="text-sm text-danger">
              {errors.soundVolume.message}
            </p>
          ) : null}
        </div>
        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => previewSound(Number(volume) || 0)}
          >
            <Volume2 aria-hidden="true" />
            Coba suara
          </Button>
        </div>
      </Card>
      <FormFooter pending={pending} />
    </form>
  )
}
