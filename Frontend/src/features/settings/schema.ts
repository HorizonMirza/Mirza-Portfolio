import { z } from 'zod'

const introTitle = z.string().trim().max(60, 'Judul paling panjang 60 karakter')
const introBody = z.string().trim().max(600, 'Isi paling panjang 600 karakter')

// Volume suara tombol situs publik (Admin → Pengaturan)
export const soundSchema = z.object({
  soundVolume: z
    .number({ error: 'Volume harus berupa angka' })
    .int('Volume harus bilangan bulat')
    .min(0, 'Volume paling kecil 0')
    .max(100, 'Volume paling besar 100'),
})

// Kartu pemberitahuan pembuka (Admin → Bagian Awal)
export const introSchema = z
  .object({
    introEnabled: z.boolean(),
    introTitle_id: introTitle,
    introTitle_en: introTitle,
    introBody_id: introBody,
    introBody_en: introBody,
  })
  .superRefine((value, ctx) => {
    if (!value.introEnabled) return
    // saat aktif, kedua bahasa wajib diisi agar pengunjung ID dan EN melihat isi yang lengkap
    for (const key of ['introTitle_id', 'introTitle_en', 'introBody_id', 'introBody_en'] as const) {
      if (!value[key])
        ctx.addIssue({ code: 'custom', path: [key], message: 'Wajib diisi saat aktif' })
    }
  })

export type SoundInput = z.input<typeof soundSchema>
export type IntroInput = z.input<typeof introSchema>
