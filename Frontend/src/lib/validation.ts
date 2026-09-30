import { z } from 'zod'

// Teks wajib dengan batas panjang dan pesan bahasa Indonesia.
export function requiredText(label: string, max: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .max(max, `${label} maksimal ${max} karakter`)
}

export function optionalText(label: string, max: number) {
  return z.string().trim().max(max, `${label} maksimal ${max} karakter`)
}

// URL opsional: kosong diperbolehkan, bila diisi harus http(s).
export function optionalUrl(label: string) {
  return z
    .string()
    .trim()
    .max(500, `${label} terlalu panjang`)
    .refine(
      (v) => v === '' || /^https?:\/\/[^\s]+$/i.test(v),
      `${label} harus diawali http:// atau https://`,
    )
}

export const slugSchema = z
  .string()
  .trim()
  .min(2, 'Slug minimal 2 karakter')
  .max(80, 'Slug maksimal 80 karakter')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya huruf kecil, angka, dan tanda hubung')

export const githubRepoSchema = z
  .string()
  .trim()
  .refine(
    (v) =>
      v === '' || (/^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/.test(v) && !/\/\.{1,2}$/.test(v)),
    'Format: pemilik/nama-repo',
  )

export const dateOnlySchema = (label: string) =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `${label} tidak valid`)

export function emptyToNull(value: string): string | null {
  return value.trim() === '' ? null : value.trim()
}

// "Judul Project Saya!" → "judul-project-saya"
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}
