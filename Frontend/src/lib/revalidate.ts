import 'server-only'

import { revalidatePath, updateTag } from 'next/cache'

import { routing } from '@/i18n/routing'

import { CACHE_TAGS, type CacheTag } from '@/lib/cache-tags'

export { CACHE_TAGS }

// Setelah admin menyimpan: kosongkan cache tag dan halaman publik agar langsung tampil.
// Hanya boleh dipanggil dari Server Action (syarat updateTag di Next 16).
export function revalidateContent(...tags: CacheTag[]) {
  for (const tag of tags) updateTag(CACHE_TAGS[tag])
  // Pakai path literal per bahasa (bukan pola '/[locale]'). Lihat juga catatan dynamicParams
  // di app/[locale]/layout.tsx: keduanya pernah membuat halaman publik 404 setelah revalidasi.
  for (const locale of routing.locales) revalidatePath(`/${locale}`, 'layout')
}
