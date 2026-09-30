import 'server-only'

import { revalidatePath, updateTag } from 'next/cache'

import { routing } from '@/i18n/routing'

export const CACHE_TAGS = {
  profile: 'profile',
  projects: 'projects',
  skills: 'skills',
  experience: 'experience',
} as const

// Setelah admin menyimpan: kosongkan cache tag dan halaman publik agar langsung tampil.
// Hanya boleh dipanggil dari Server Action (syarat updateTag di Next 16).
export function revalidateContent(...tags: (keyof typeof CACHE_TAGS)[]) {
  for (const tag of tags) updateTag(CACHE_TAGS[tag])
  // Pakai path literal per bahasa. Pola '/[locale]' membuat render ulang ISR memakai nilai
  // '[locale]' apa adanya sehingga /id dan /en menjadi 404 (dynamicParams = false).
  for (const locale of routing.locales) revalidatePath(`/${locale}`, 'layout')
}
