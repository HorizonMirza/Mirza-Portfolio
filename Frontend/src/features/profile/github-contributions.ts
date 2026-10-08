import 'server-only'

import { unstable_cache } from 'next/cache'
import { z } from 'zod'

// Kalender kontribusi GitHub untuk beranda (DESIGN.md bagian 28 dan 44). Data dari GitHub GraphQL API,
// yang selalu butuh token: memakai GITHUB_TOKEN (fine-grained, tanpa izin tambahan cukup untuk data
// publik). Tanpa token atau bila GitHub gagal, hasilnya null dan bagian ini tidak tampil.

export type ContributionLevel = 0 | 1 | 2 | 3 | 4
export type ContributionDay = { date: string; count: number; level: ContributionLevel }
export type ContributionCalendar = { total: number; weeks: ContributionDay[][] }

const REVALIDATE_SECONDS = 6 * 60 * 60

const QUERY = `query ($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`

const LEVELS = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
} as const

const responseSchema = z.object({
  data: z.object({
    user: z
      .object({
        contributionsCollection: z.object({
          contributionCalendar: z.object({
            totalContributions: z.number().int().nonnegative(),
            weeks: z.array(
              z.object({
                contributionDays: z.array(
                  z.object({
                    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                    contributionCount: z.number().int().nonnegative(),
                    contributionLevel: z.enum(
                      Object.keys(LEVELS) as [keyof typeof LEVELS, ...(keyof typeof LEVELS)[]],
                    ),
                  }),
                ),
              }),
            ),
          }),
        }),
      })
      .nullable(),
  }),
})

// Nama pengguna dari URL profil GitHub di admin (https://github.com/HorizonMirza -> HorizonMirza).
export function githubLogin(profileUrl: string | undefined) {
  if (!profileUrl) return null
  try {
    const url = new URL(profileUrl)
    if (url.hostname !== 'github.com' && url.hostname !== 'www.github.com') return null
    const login = url.pathname.split('/').filter(Boolean)[0] ?? ''
    return /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(login) ? login : null
  } catch {
    return null
  }
}

export function toCalendar(json: unknown): ContributionCalendar | null {
  const parsed = responseSchema.safeParse(json)
  const calendar = parsed.success
    ? parsed.data.data.user?.contributionsCollection.contributionCalendar
    : null
  if (!calendar) return null
  return {
    total: calendar.totalContributions,
    weeks: calendar.weeks.map((week) =>
      week.contributionDays.map((day) => ({
        date: day.date,
        count: day.contributionCount,
        level: LEVELS[day.contributionLevel],
      })),
    ),
  }
}

async function fetchCalendar(login: string): Promise<ContributionCalendar | null> {
  const token = process.env.GITHUB_TOKEN
  if (!token) return null
  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        // GitHub menolak permintaan tanpa User-Agent
        'User-Agent': 'mirza-portfolio',
      },
      body: JSON.stringify({ query: QUERY, variables: { login } }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      console.warn('[github-contributions] status', res.status)
      return null
    }
    return toCalendar(await res.json())
  } catch {
    console.warn('[github-contributions] GitHub tidak bisa dihubungi')
    return null
  }
}

export const getGithubContributions = unstable_cache(fetchCalendar, ['github-contributions'], {
  revalidate: REVALIDATE_SECONDS,
})
