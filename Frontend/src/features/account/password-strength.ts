import { MIN_PASSWORD_LENGTH } from '@/lib/password-policy'

// Perkiraan kekuatan 0–4 untuk meter di bawah password baru. Panjang paling berpengaruh (frasa panjang
// lebih kuat daripada simbol acak); hanya petunjuk, aturan yang wajib tetap di changePasswordSchema.
export function passwordStrength(value: string): number {
  if (value.length < MIN_PASSWORD_LENGTH) return value.length === 0 ? 0 : 1
  let score = 2
  if (value.length >= 16) score++
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(value)).length
  if (value.length >= 20 || kinds >= 3) score++
  return Math.min(score, 4)
}
