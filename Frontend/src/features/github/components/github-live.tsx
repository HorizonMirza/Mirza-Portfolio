'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { useAdminT } from '@/components/admin/admin-lang'
import { Note, SaveBar } from '@/components/admin/live-edit'
import { SiteFrame } from '@/components/admin/site-frame'
import { Container } from '@/components/site/section-heading'
import ContributionSkyline, {
  type ContributionDay,
  type SkylineLabels,
} from '@/components/ui/contribution-skyline'
import { saveGithubPalette } from '@/features/settings/actions'
import { GITHUB_PALETTE, type Palette } from '@/lib/github-palette'
import { cn } from '@/lib/utils'

type Mode = 'light' | 'dark'

// Admin → Home → GitHub (revisi pemilik 2026-11-15, DESIGN.md bagian 149): bagian GitHub beranda
// tampil seperti di situs (grafik kontribusi) dan empat warna tingkat aktivitasnya bisa diganti,
// terpisah untuk tema terang dan gelap. Pratinjau memakai data kontribusi asli bila tersedia,
// selain itu data contoh.
export function GithubLive({
  defaultValues,
  data,
  sample,
  labels,
  heading,
  locale,
}: {
  defaultValues: Palette
  data: ContributionDay[]
  // true: data contoh, bukan kontribusi GitHub sungguhan
  sample: boolean
  labels: SkylineLabels
  heading: string
  locale: string
}) {
  const t = useAdminT()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [mode, setMode] = useState<Mode>('dark')
  const [palette, setPalette] = useState<Palette>(defaultValues)
  const isDefault = JSON.stringify(palette) === JSON.stringify(GITHUB_PALETTE)

  const setColor = (index: number, color: string) =>
    setPalette((current) => ({
      ...current,
      [mode]: current[mode].map((c, i) => (i === index ? color : c)),
    }))

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    startTransition(async () => {
      const result = await saveGithubPalette(palette)
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
      <SiteFrame>
        {/* tema pratinjau mengikuti pilihan Terang/Gelap di bawah, bukan tema admin; key membuat grafik
            membaca ulang warna latarnya */}
        <div
          key={mode}
          className={cn(mode === 'dark' ? 'dark' : 'theme-light', 'size-full bg-bg text-text')}
        >
          <section className="pt-10 pb-16 md:pt-16 md:pb-24">
            <Container>
              <h2 className="mb-8 text-center text-h2 font-bold">{heading}</h2>
              <ContributionSkyline data={data} locale={locale} labels={labels} palette={palette} />
            </Container>
          </section>
        </div>
      </SiteFrame>
      {sample ? (
        <Note className="mb-0">
          Data contoh · GitHub asli tampil bila token dan URL profil terisi
        </Note>
      ) : null}
      {/* empat warna tema yang sedang dipratinjau, dari aktivitas paling ringan ke paling berat */}
      <div
        role="group"
        aria-label={t('Warna grafik')}
        className="admin-bleed grid grid-cols-4 gap-2"
      >
        {palette[mode].map((color, i) => (
          <label key={i} className="grid gap-1.5 text-xs text-muted">
            <input
              type="color"
              value={color}
              onChange={(event) => setColor(i, event.target.value)}
              aria-label={t('Warna tingkat {n} ({mode})', {
                n: i + 1,
                mode: t(mode === 'dark' ? 'Gelap' : 'Terang'),
              })}
              className="h-11 w-full cursor-pointer rounded-md border border-border bg-transparent p-1"
            />
            <span aria-hidden="true" className="text-center">
              {t('Tingkat {n}', { n: i + 1 })}
            </span>
          </label>
        ))}
      </div>
      <button
        type="button"
        disabled={isDefault}
        onClick={() => setPalette(GITHUB_PALETTE)}
        className="admin-bleed inline-flex min-h-11 items-center justify-center rounded-md border border-dashed border-border px-3 text-sm font-semibold text-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t('Kembalikan warna bawaan')}
      </button>
      <div
        role="group"
        aria-label={t('Tema pratinjau')}
        className="admin-bleed grid grid-cols-2 gap-2"
      >
        {(['light', 'dark'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={m === mode}
            onClick={() => setMode(m)}
            className={cn(
              'inline-flex min-h-11 items-center justify-center rounded-md border px-3 text-sm font-semibold',
              m === mode
                ? 'border-text bg-text text-bg'
                : 'border-dashed border-border text-muted hover:text-text',
            )}
          >
            {t(m === 'dark' ? 'Gelap' : 'Terang')}
          </button>
        ))}
      </div>
      <SaveBar pending={pending} />
    </form>
  )
}
