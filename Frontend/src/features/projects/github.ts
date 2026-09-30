import 'server-only'

import { z } from 'zod'

// Bentuk respons GET /repos/{owner}/{repo} yang dipakai saja.
const repoResponse = z.object({
  full_name: z.string(),
  description: z.string().nullable(),
  homepage: z.string().nullable(),
  html_url: z.string(),
  created_at: z.string(),
  language: z.string().nullable(),
  topics: z.array(z.string()).optional(),
  private: z.boolean(),
  stargazers_count: z.number().int().optional(),
  pushed_at: z.string().nullable().optional(),
})

export type GithubRepo = z.infer<typeof repoResponse>

export class GithubError extends Error {}

export async function fetchGithubRepo(repo: string): Promise<GithubRepo> {
  const [owner, name] = repo.split('/')
  const token = process.env.GITHUB_TOKEN
  let res: Response
  try {
    res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner!)}/${encodeURIComponent(name!)}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          // GitHub menolak permintaan tanpa User-Agent
          'User-Agent': 'mirza-portfolio-admin',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(8000),
      },
    )
  } catch {
    throw new GithubError('GitHub tidak bisa dihubungi. Coba lagi nanti.')
  }
  if (res.status === 401)
    throw new GithubError('GITHUB_TOKEN ditolak GitHub. Periksa atau hapus token di environment.')
  if (res.status === 404) throw new GithubError('Repo tidak ditemukan atau bersifat privat.')
  if (res.status === 403 || res.status === 429) {
    throw new GithubError(
      'Batas permintaan GitHub tercapai. Coba lagi dalam satu jam atau isi GITHUB_TOKEN.',
    )
  }
  if (!res.ok) {
    console.warn('[github-import] status', res.status)
    throw new GithubError('GitHub mengembalikan galat. Coba lagi nanti.')
  }
  const parsed = repoResponse.safeParse(await res.json())
  if (!parsed.success) throw new GithubError('Respons GitHub tidak dikenali.')
  return parsed.data
}

// Cocokkan topik dan bahasa repo dengan nama skill yang sudah ada. Huruf besar/kecil, spasi, titik,
// dan tanda hubung diabaikan, jadi topik "nextjs" cocok dengan skill "Next.js".
export function matchSkills(
  repo: Pick<GithubRepo, 'topics' | 'language'>,
  skills: { id: string; name: string }[],
): string[] {
  const normalize = (v: string) => v.toLowerCase().replace(/[\s._-]+/g, '')
  const wanted = new Set(
    [...(repo.topics ?? []), ...(repo.language ? [repo.language] : [])].map(normalize),
  )
  return skills.filter((s) => wanted.has(normalize(s.name))).map((s) => s.id)
}

export type GithubMeta = {
  stars: number
  language: string | null
  pushedAt: string | null
  url: string
}

// Metadata kartu project publik. Gagal (batas API, jaringan, repo privat) → null, kartu tetap tampil.
export async function getGithubMeta(repo: string | null): Promise<GithubMeta | null> {
  if (!repo) return null
  try {
    const data = await fetchGithubRepo(repo)
    if (data.private) return null
    return {
      stars: data.stargazers_count ?? 0,
      language: data.language,
      pushedAt: data.pushed_at ?? null,
      url: data.html_url,
    }
  } catch {
    return null
  }
}
