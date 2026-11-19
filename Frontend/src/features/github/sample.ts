// Data contoh untuk pratinjau warna bila kontribusi GitHub asli belum tersedia (tanpa GITHUB_TOKEN
// atau URL profil GitHub). Deterministik per tanggal; bukan data kontribusi sungguhan.

import type { ContributionDay } from '@/components/ui/contribution-skyline'

export function sampleContributions(now = new Date()): ContributionDay[] {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const days: ContributionDay[] = []
  let seed = 20261115
  const next = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  for (let i = 370; i >= 0; i--) {
    const date = new Date(end - i * 86_400_000).toISOString().slice(0, 10)
    const wave = 0.5 + 0.5 * Math.sin(i / 23)
    const r = next()
    const count = r < 0.28 ? 0 : Math.round(r * r * 14 * (0.4 + wave))
    days.push({ date, count })
  }
  return days
}
