import 'server-only'

import { revalidatePath, updateTag } from 'next/cache'

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
  revalidatePath('/[locale]', 'layout')
}
