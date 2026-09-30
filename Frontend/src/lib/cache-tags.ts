// Tag cache data publik. Aksi admin mengosongkannya lewat revalidateContent() (lib/revalidate.ts).
export const CACHE_TAGS = {
  profile: 'profile',
  projects: 'projects',
  skills: 'skills',
  experience: 'experience',
} as const

export type CacheTag = keyof typeof CACHE_TAGS
