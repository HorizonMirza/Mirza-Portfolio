import { z } from 'zod'

export const MIN_PASSWORD = 12

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Password saat ini wajib diisi').max(128),
    newPassword: z
      .string()
      .min(MIN_PASSWORD, `Password baru minimal ${MIN_PASSWORD} karakter`)
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
