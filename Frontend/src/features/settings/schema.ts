import { z } from 'zod'

const introBody = z.string().trim().max(600, 'Isi paling panjang 600 karakter')

// Volume suara tombol situs publik (Admin → Pengaturan)
export const soundSchema = z.object({
  soundVolume: z
    .number({ error: 'Volume harus berupa angka' })
    .int('Volume harus bilangan bulat')
    .min(0, 'Volume paling kecil 0')
    .max(100, 'Volume paling besar 100'),
})

// Kartu pemberitahuan pembuka (Admin → Bagian Awal). Sejak 2026-11-10 hanya isinya yang bisa diubah
// (permintaan pemilik); judul, label, dan tombol kartu adalah teks tetap di messages/*.json dan kartu
// selalu tampil. Kedua bahasa wajib diisi agar pengunjung ID dan EN melihat isi yang lengkap.
export const introSchema = z.object({
  introBody_id: introBody.min(1, 'Wajib diisi'),
  introBody_en: introBody.min(1, 'Wajib diisi'),
})

export type SoundInput = z.input<typeof soundSchema>
export type IntroInput = z.input<typeof introSchema>
