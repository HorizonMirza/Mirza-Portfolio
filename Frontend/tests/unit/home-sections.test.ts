import { describe, expect, it, vi } from 'vitest'

import { experienceSchema } from '@/features/experience/schema'
import { highlightSchema } from '@/features/highlights/schema'
import { toActivity } from '@/features/profile/github-activity'

vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }))

const at = '2026-10-08T03:00:00Z'
const ev = (type: string, payload: object, repo = 'HorizonMirza/Mirza-Portfolio') => ({
  type,
  created_at: at,
  repo: { name: repo },
  payload,
})

describe('aktivitas GitHub', () => {
  it('jenis yang dikenal diubah ke item, jenis lain dilewati', () => {
    const items = toActivity([
      ev('PushEvent', { ref: 'refs/heads/main' }),
      ev('IssueCommentEvent', {}),
      ev('CreateEvent', { ref: null, ref_type: 'repository' }, 'HorizonMirza/baru'),
      ev('ReleaseEvent', { action: 'published', release: { tag_name: 'v1.0.0' } }),
      ev('PullRequestEvent', { action: 'closed', number: 7, pull_request: { merged: true } }),
      ev('PullRequestEvent', { action: 'closed', number: 8, pull_request: { merged: false } }),
    ])
    expect(items.map((i) => i.kind)).toEqual(['push', 'createRepo', 'release', 'pullMerged'])
    expect(items[0]).toMatchObject({ branch: 'main', repo: 'HorizonMirza/Mirza-Portfolio' })
  })

  it('push beruntun ke branch yang sama tampil sekali, maksimal 5 item', () => {
    const pushes = Array.from({ length: 4 }, () => ev('PushEvent', { ref: 'refs/heads/main' }))
    expect(toActivity(pushes)).toHaveLength(1)
    const many = Array.from({ length: 9 }, (_, i) =>
      ev('WatchEvent', { action: 'started' }, `orang/repo-${i}`),
    )
    expect(toActivity(many)).toHaveLength(5)
  })

  it('nama repo atau respons yang tidak sesuai diabaikan', () => {
    expect(toActivity({ message: 'Bad credentials' })).toEqual([])
    expect(toActivity([ev('WatchEvent', {}, '<script>/x')])).toEqual([])
  })
})

describe('angka beranda', () => {
  const valid = {
    value: 1000,
    suffix: '+',
    label_id: 'anggota di Reclub',
    label_en: 'members on Reclub',
    source: 'Ace Padel Club',
    order: 1,
    status: 'PUBLISHED',
  }
  it('angka valid diterima', () => {
    expect(highlightSchema.safeParse(valid).success).toBe(true)
  })
  it('angka kosong, negatif, pecahan, atau keterangan kosong ditolak', () => {
    for (const bad of [
      { value: Number.NaN },
      { value: -1 },
      { value: 1.5 },
      { label_en: ' ' },
      { suffix: 'terlalu panjang' },
    ])
      expect(highlightSchema.safeParse({ ...valid, ...bad }).success).toBe(false)
  })
})

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
