import { z } from 'zod'

import { meetsPasswordRules, MIN_PASSWORD_LENGTH } from '@/lib/password-policy'

// Ganti password tanpa kolom ulangi (revisi pemilik 2026-11-16): password baru diperiksa panjang, isi,
// dan harus berbeda dari yang sekarang; tombol mata dipakai untuk memastikan ketikan.
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Password saat ini wajib diisi').max(128),
    newPassword: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter`)
      .max(128, 'Password baru maksimal 128 karakter')
      .refine(
        meetsPasswordRules,
        'Password baru harus memuat huruf besar, huruf kecil, angka, dan simbol',
      ),
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ['newPassword'],
    message: 'Password baru harus berbeda dari yang sekarang',
  })

export type ChangePasswordInput = z.input<typeof changePasswordSchema>

// Nama akun panel admin (Admin → Akun): tampil di menu profil, sidebar, dan log audit. Nama di situs
// publik tetap dari Profil.
// Ganti nama dan email meminta password akun (revisi pemilik 2026-11-16).
const confirmPassword = z.string().min(1, 'Password wajib diisi').max(128)

export const accountNameSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(80, 'Nama maksimal 80 karakter'),
  password: confirmPassword,
})

export type AccountNameInput = z.input<typeof accountNameSchema>

export const accountEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, 'Email terlalu panjang')
    .pipe(z.email('Format email tidak valid')),
  password: confirmPassword,
})

export type AccountEmailInput = z.input<typeof accountEmailSchema>
