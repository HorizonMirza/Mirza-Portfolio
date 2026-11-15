import type { SkylineLabels } from '@/components/ui/contribution-skyline'

const KEYS = [
  'unit',
  'unitPlural',
  'none',
  'inLastYear',
  'on',
  'busiest',
  'longest',
  'current',
  'day',
  'days',
  'less',
  'more',
  'view',
  'flat',
  'skyline',
  'keys',
] as const satisfies readonly (keyof SkylineLabels)[]

// Teks grafik kontribusi dua bahasa dari namespace Skyline (komponen klien hanya menerima string,
// bukan fungsi). Dipakai beranda dan pratinjau Admin → Home → GitHub.
export function skylineLabelsFrom(t: (key: (typeof KEYS)[number]) => string): SkylineLabels {
  return Object.fromEntries(KEYS.map((key) => [key, t(key)])) as SkylineLabels
}
