// Tag cache data publik dan batas umurnya. Aksi admin mengosongkannya lewat revalidateContent()
// (lib/revalidate.ts). Tanpa impor server.

export const CACHE_TAGS = {
  profile: 'profile',
  projects: 'projects',
  skills: 'skills',
  experience: 'experience',
  settings: 'settings',
  siteText: 'siteText',
} as const

export type CacheTag = keyof typeof CACHE_TAGS

// Batas umur cache data publik. Aksi admin tetap langsung terlihat (updateTag); batas ini jaring
// pengaman untuk perubahan di luar admin, misalnya seed setelah deploy pertama atau edit langsung di DB.
export const PUBLIC_CACHE_SECONDS = 600
