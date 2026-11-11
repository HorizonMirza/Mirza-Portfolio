import { z } from 'zod'

import { MIN_PASSWORD_LENGTH } from '@/lib/password-policy'

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Password saat ini wajib diisi').max(128),
    newPassword: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter`)
      .max(128, 'Password baru maksimal 128 karakter'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Konfirmasi tidak sama dengan password baru',
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ['newPassword'],
    message: 'Password baru harus berbeda dari yang sekarang',
  })

export type ChangePasswordInput = z.input<typeof changePasswordSchema>

// Nama akun panel admin (Admin → Akun): tampil di menu profil, sidebar, dan log audit. Nama di situs
// publik tetap dari Profil.
export const accountNameSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(80, 'Nama maksimal 80 karakter'),
})

export type AccountNameInput = z.input<typeof accountNameSchema>
