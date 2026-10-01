import { afterEach, describe, expect, it, vi } from 'vitest'

import { monthLabels } from '@/features/profile/components/github-calendar'
import { githubLogin, toCalendar } from '@/features/profile/github-contributions'

vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }))

function day(date: string, count: number, level = 'NONE') {
  return { date, contributionCount: count, contributionLevel: level }
}

function response(weeks: ReturnType<typeof day>[][], total = 0) {
  return {
    data: {
      user: {
        contributionsCollection: {
          contributionCalendar: {
            totalContributions: total,
            weeks: weeks.map((contributionDays) => ({ contributionDays })),
          },
        },
      },
    },
  }
}

describe('github-contributions', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('nama pengguna diambil dari URL profil GitHub', () => {
    expect(githubLogin('https://github.com/HorizonMirza')).toBe('HorizonMirza')
    expect(githubLogin('https://www.github.com/HorizonMirza/')).toBe('HorizonMirza')
    expect(githubLogin('https://github.com/HorizonMirza/repo')).toBe('HorizonMirza')
  })

  it('URL selain profil GitHub ditolak', () => {
    expect(githubLogin(undefined)).toBeNull()
    expect(githubLogin('bukan url')).toBeNull()
    expect(githubLogin('https://gitlab.com/HorizonMirza')).toBeNull()
    expect(githubLogin('https://github.com/')).toBeNull()
    expect(githubLogin('https://github.com/-salah')).toBeNull()
  })

  it('respons GitHub diubah ke minggu dan level 0-4', () => {
    const calendar = toCalendar(
      response(
        [
          [day('2026-09-27', 0), day('2026-09-28', 3, 'SECOND_QUARTILE')],
          [day('2026-10-04', 9, 'FOURTH_QUARTILE')],
        ],
        12,
      ),
    )
    expect(calendar).toEqual({
      total: 12,
      weeks: [
        [
          { date: '2026-09-27', count: 0, level: 0 },
          { date: '2026-09-28', count: 3, level: 2 },
        ],
        [{ date: '2026-10-04', count: 9, level: 4 }],
      ],
    })
  })

  it('respons yang tidak sesuai atau pengguna tidak ada menghasilkan null', () => {
    expect(toCalendar({ data: { user: null } })).toBeNull()
    expect(toCalendar({ errors: [{ message: 'x' }] })).toBeNull()
    expect(toCalendar(response([[day('2026-09-27', 1, 'LAINNYA')]]))).toBeNull()
  })

  it('tanpa GITHUB_TOKEN tidak memanggil GitHub', async () => {
    vi.stubEnv('GITHUB_TOKEN', '')
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const { getGithubContributions } = await import('@/features/profile/github-contributions')
    expect(await getGithubContributions('HorizonMirza')).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('label bulan muncul di minggu pertama tiap bulan, bulan awal yang terpotong dibuang', () => {
    const weeks = [
      '2026-08-30',
      '2026-09-06',
      '2026-09-13',
      '2026-09-20',
      '2026-09-27',
      '2026-10-04',
    ].map((date) => [{ date, count: 0, level: 0 as const }])
    const labels = monthLabels({ total: 0, weeks }, 'en').map((l) => l.text)
    // Agustus hanya di kolom 0 lalu September di kolom 1: Agustus dibuang, Oktober di kolom 5
    expect(labels).toEqual(['Sep', 'Oct'])
  })

  it('label yang rapat di tengah kalender dilewati', () => {
    const weeks = [
      '2026-01-04',
      '2026-01-11',
      '2026-01-18',
      '2026-01-25',
      '2026-02-01',
      '2026-02-22',
      '2026-03-01',
    ].map((date) => [{ date, count: 0, level: 0 as const }])
    // Februari di kolom 4, Maret di kolom 6 terlalu rapat sehingga dilewati
    expect(monthLabels({ total: 0, weeks }, 'en').map((l) => l.text)).toEqual(['Jan', 'Feb'])
  })
})
