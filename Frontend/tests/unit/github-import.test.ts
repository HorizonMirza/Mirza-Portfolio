import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchGithubRepo, GithubError, matchSkills } from '@/features/projects/github'

const repo = {
  full_name: 'HorizonMirza/gaas',
  description: 'Sistem manajemen aset',
  homepage: 'https://gaas.example',
  html_url: 'https://github.com/HorizonMirza/gaas',
  created_at: '2026-02-01T00:00:00Z',
  language: 'TypeScript',
  topics: ['nextjs', 'postgresql'],
  private: false,
}

function mockFetch(status: number, body: unknown = {}) {
  const fn = vi.fn(async () => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('fetchGithubRepo', () => {
  it('mengambil metadata repo dengan header yang benar', async () => {
    vi.stubEnv('GITHUB_TOKEN', '')
    const fn = mockFetch(200, repo)
    await expect(fetchGithubRepo('HorizonMirza/gaas')).resolves.toMatchObject({
      full_name: 'HorizonMirza/gaas',
    })
    const [url, init] = fn.mock.calls[0] as unknown as [
      string,
      RequestInit & { next?: { revalidate: number } },
    ]
    expect(url).toBe('https://api.github.com/repos/HorizonMirza/gaas')
    expect((init.headers as Record<string, string>)['User-Agent']).toBeTruthy()
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined()
    expect(init.next?.revalidate).toBe(3600)
  })
  it('memakai GITHUB_TOKEN bila ada', async () => {
    vi.stubEnv('GITHUB_TOKEN', 'ghp_tes')
    const fn = mockFetch(200, repo)
    await fetchGithubRepo('HorizonMirza/gaas')
    const init = (fn.mock.calls[0] as unknown as [string, RequestInit])[1]
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer ghp_tes')
  })
  it.each([
    [404, /tidak ditemukan/],
    [403, /Batas permintaan/],
    [401, /GITHUB_TOKEN/],
    [500, /galat/],
  ])('status %i menjadi pesan yang jelas', async (status, message) => {
    mockFetch(status)
    await expect(fetchGithubRepo('a/b')).rejects.toThrow(message)
  })
  it('respons tak dikenal ditolak', async () => {
    mockFetch(200, { unexpected: true })
    await expect(fetchGithubRepo('a/b')).rejects.toBeInstanceOf(GithubError)
  })
  it('galat jaringan', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('network'))),
    )
    await expect(fetchGithubRepo('a/b')).rejects.toThrow(/tidak bisa dihubungi/)
  })
})

describe('matchSkills', () => {
  const skills = [
    { id: '1', name: 'Next.js' },
    { id: '2', name: 'PostgreSQL' },
    { id: '3', name: 'TypeScript' },
    { id: '4', name: 'Python' },
  ]
  it('mencocokkan topik dan bahasa tanpa peduli titik dan huruf besar', () => {
    expect(matchSkills(repo, skills).sort()).toEqual(['1', '2', '3'])
  })
  it('tanpa topik', () => {
    expect(matchSkills({ topics: undefined, language: null }, skills)).toEqual([])
  })
})
