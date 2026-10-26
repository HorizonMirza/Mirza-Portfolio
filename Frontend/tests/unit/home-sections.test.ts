import { describe, expect, it, vi } from 'vitest'

import { experienceSchema } from '@/features/experience/schema'

vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }))

describe('garis cerita', () => {
  it('centang garis cerita bawaannya mati', () => {
    const parsed = experienceSchema.parse({
      type: 'WORK',
      organization: 'Ace Padel Club',
      title_id: 'Founder',
      title_en: 'Founder',
      description_id: '- a',
      description_en: '- a',
      startMonth: '2025-05',
      endMonth: '',
      location: '',
      employmentType: '',
      status: 'PUBLISHED',
    })
    expect(parsed.inStory).toBe(false)
  })
})
