import 'server-only'

import { unstable_cache } from 'next/cache'
import { z } from 'zod'

// Aktivitas publik GitHub terakhir untuk baris berganti di atas grafik kontribusi beranda
// (DESIGN.md bagian 46). Memakai GITHUB_TOKEN yang sama dengan grafik kontribusi; tanpa token
// atau bila GitHub gagal hasilnya [] dan baris ini tidak tampil. Events API hanya memuat repo
// publik, jadi tidak ada repo privat yang bocor.

const REVALIDATE_SECONDS = 30 * 60
const MAX_ITEMS = 5

export type GithubActivity =
  | { kind: 'push'; repo: string; branch: string; at: string }
  | { kind: 'createRepo'; repo: string; at: string }
  | { kind: 'createBranch' | 'createTag'; repo: string; ref: string; at: string }
  | { kind: 'release'; repo: string; tag: string; at: string }
  | { kind: 'pullOpened' | 'pullMerged'; repo: string; number: number; at: string }
  | { kind: 'public' | 'star' | 'fork'; repo: string; at: string }

const repoName = z.string().regex(/^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/)
const refName = z.string().max(120)

// Payload tiap jenis berbeda; hanya kolom yang dipakai yang divalidasi, sisanya diabaikan.
const eventSchema = z.object({
  type: z.string(),
  created_at: z.iso.datetime(),
  repo: z.object({ name: repoName }),
  payload: z
    .object({
      ref: refName.nullable().optional(),
      ref_type: z.string().optional(),
      action: z.string().optional(),
      number: z.number().int().optional(),
      release: z.object({ tag_name: refName }).optional(),
      pull_request: z.object({ merged: z.boolean().optional() }).optional(),
    })
    .optional(),
})

export function toActivity(json: unknown): GithubActivity[] {
  if (!Array.isArray(json)) return []
  const out: GithubActivity[] = []
  for (const raw of json) {
    const parsed = eventSchema.safeParse(raw)
    if (!parsed.success) continue
    const { type, created_at: at, repo, payload = {} } = parsed.data
    const name = repo.name
    let item: GithubActivity | null = null
    if (type === 'PushEvent' && payload.ref?.startsWith('refs/heads/'))
      item = { kind: 'push', repo: name, branch: payload.ref.slice('refs/heads/'.length), at }
    else if (type === 'CreateEvent' && payload.ref_type === 'repository')
      item = { kind: 'createRepo', repo: name, at }
    else if (type === 'CreateEvent' && payload.ref && payload.ref_type === 'branch')
      item = { kind: 'createBranch', repo: name, ref: payload.ref, at }
    else if (type === 'CreateEvent' && payload.ref && payload.ref_type === 'tag')
      item = { kind: 'createTag', repo: name, ref: payload.ref, at }
    else if (type === 'ReleaseEvent' && payload.action === 'published' && payload.release)
      item = { kind: 'release', repo: name, tag: payload.release.tag_name, at }
    else if (type === 'PullRequestEvent' && payload.number !== undefined) {
      if (payload.action === 'opened')
        item = { kind: 'pullOpened', repo: name, number: payload.number, at }
      else if (payload.action === 'closed' && payload.pull_request?.merged)
        item = { kind: 'pullMerged', repo: name, number: payload.number, at }
    } else if (type === 'PublicEvent') item = { kind: 'public', repo: name, at }
    else if (type === 'WatchEvent') item = { kind: 'star', repo: name, at }
    else if (type === 'ForkEvent') item = { kind: 'fork', repo: name, at }
    if (!item) continue
    // push beruntun ke repo dan branch yang sama cukup tampil sekali (yang terbaru)
    const prev = out.at(-1)
    if (
      prev &&
      prev.kind === 'push' &&
      item.kind === 'push' &&
      prev.repo === item.repo &&
      prev.branch === item.branch
    )
      continue
    out.push(item)
    if (out.length >= MAX_ITEMS) break
  }
  return out
}

async function fetchActivity(login: string): Promise<GithubActivity[]> {
  const token = process.env.GITHUB_TOKEN
  if (!token) return []
  try {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(login)}/events/public?per_page=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'mirza-portfolio',
        },
        signal: AbortSignal.timeout(8000),
      },
    )
    if (!res.ok) {
      console.warn('[github-activity] status', res.status)
      return []
    }
    return toActivity(await res.json())
  } catch {
    console.warn('[github-activity] GitHub tidak bisa dihubungi')
    return []
  }
}

export const getGithubActivity = unstable_cache(fetchActivity, ['github-activity'], {
  revalidate: REVALIDATE_SECONDS,
})
