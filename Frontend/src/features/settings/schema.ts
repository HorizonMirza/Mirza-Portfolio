import { z } from 'zod'

export const settingsSchema = z.object({
  soundVolume: z
    .number({ error: 'Volume harus berupa angka' })
    .int('Volume harus bilangan bulat')
    .min(0, 'Volume paling kecil 0')
    .max(100, 'Volume paling besar 100'),
})

export type SettingsInput = z.input<typeof settingsSchema>
