'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { useAdminT } from '@/components/admin/admin-lang'
import { SaveBar } from '@/components/admin/live-edit'
import { SiteFrame } from '@/components/admin/site-frame'
import { Container } from '@/components/site/section-heading'
import ContributionSkyline, {
  type ContributionDay,
  type SkylineLabels,
} from '@/components/ui/contribution-skyline'
import { saveGithubPalette } from '@/features/settings/actions'
import { GITHUB_PRESET_KEYS, GITHUB_PRESETS, type GithubPresetKey } from '@/lib/github-palette'
import { cn } from '@/lib/utils'

const PRESET_NAME: Record<GithubPresetKey, string> = {
  red: 'Merah',
  yellow: 'Kuning',
  green: 'Hijau',
  blue: 'Biru',
  purple: 'Ungu',
}

// Admin → Home → GitHub (revisi pemilik 2026-11-15, DESIGN.md bagian 149): bagian GitHub beranda
// tampil seperti di situs (grafik kontribusi, tinggi mengikuti isi agar tampilan 3D tidak terpotong)
// dan warna grafiknya dipilih dari lima warna: merah, kuning, hijau, biru, dan ungu. Pratinjau
// memakai data kontribusi asli bila tersedia, selain itu data contoh.
export function GithubLive({
  defaultPreset,
  data,
  labels,
  heading,
  locale,
}: {
  defaultPreset: GithubPresetKey
  data: ContributionDay[]
  labels: SkylineLabels
  heading: string
  locale: string
}) {
  const t = useAdminT()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [preset, setPreset] = useState<GithubPresetKey>(defaultPreset)

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    startTransition(async () => {
      const result = await saveGithubPalette({ preset })
      if (!result.ok) {
        toast.error(t(result.message))
        return
      }
      toast.success(t(result.message))
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <SiteFrame autoHeight>
        {/* sama dengan bagian GitHub di beranda situs */}
        <section className="pt-10 pb-16 md:pt-16 md:pb-24">
          <Container>
            <h2 className="mb-8 text-center text-h2 font-bold">{heading}</h2>
            <ContributionSkyline
              data={data}
              locale={locale}
              labels={labels}
              palette={GITHUB_PRESETS[preset]}
            />
          </Container>
        </section>
      </SiteFrame>
      {/* lima warna grafik, satu baris selebar Simpan */}
      <div
        role="group"
        aria-label={t('Warna Grafik')}
        className="admin-bleed grid grid-cols-5 gap-2"
      >
        {GITHUB_PRESET_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={key === preset}
            onClick={() => setPreset(key)}
            className={cn(
              'grid min-h-11 content-center justify-items-center gap-1.5 rounded-md border px-2 py-2 text-sm font-semibold',
              key === preset
                ? 'border-text bg-text text-bg'
                : 'border-border text-muted hover:text-text',
            )}
          >
            <span aria-hidden="true" className="flex gap-0.5">
              {GITHUB_PRESETS[key].light.map((color) => (
                <span key={color} className="size-3 rounded-[3px]" style={{ background: color }} />
              ))}
            </span>
            {t(PRESET_NAME[key])}
          </button>
        ))}
      </div>
      <SaveBar pending={pending} />
    </form>
  )
}
