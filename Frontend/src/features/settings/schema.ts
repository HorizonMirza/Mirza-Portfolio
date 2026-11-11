import { z } from 'zod'

const introBody = z.string().trim().max(600, 'Isi paling panjang 600 karakter')

// Kartu pemberitahuan pembuka (Admin → Bagian Awal). Sejak 2026-11-10 hanya isinya yang bisa diubah
// (permintaan pemilik); judul, label, dan tombol kartu adalah teks tetap di messages/*.json dan kartu
// tampil selama dinyalakan di Pengaturan. Kedua bahasa wajib diisi agar pengunjung ID dan EN melihat isi yang lengkap.
export const introSchema = z.object({
  introBody_id: introBody.min(1, 'Wajib diisi'),
  introBody_en: introBody.min(1, 'Wajib diisi'),
})

export type IntroInput = z.input<typeof introSchema>
