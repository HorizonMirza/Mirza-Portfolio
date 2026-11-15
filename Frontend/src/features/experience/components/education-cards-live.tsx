'use client'

import { Plus, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useAdminT } from '@/components/admin/admin-lang'
import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { InlineInput, LANG_NAME, type Lang, MarkdownInline } from '@/components/admin/live-edit'
import { AssetEditDialog } from '@/features/assets/components/asset-edit-dialog'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'
import { cn } from '@/lib/utils'

import { deleteExperience } from '../actions'
import { emptyEducation, initials } from '../schema'
import type { useEntries } from './use-entries'

type Entries = ReturnType<typeof useEntries>

export function thisMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ganti tahun pada "YYYY-MM", bulan tetap
export function withYear(month: string, year: string, fallbackMonth = '01') {
  const mm = month.slice(5, 7) || fallbackMonth
  return `${year}-${mm}`
}

// Kartu Pendidikan halaman Tentang di Admin → About (revisi pemilik 2026-11-13, DESIGN.md bagian
// 147): sama dengan kartu di situs (logo, kampus, jurusan, tahun, grade), semuanya diubah langsung di
// halaman ini. Logo ditekan untuk diganti (entri tersimpan); "+ Tambah pendidikan" menambah kartu
// baru di tempat. Status dan hapus muncul saat kartu disorot. Disimpan bersama tombol Simpan halaman.
export function EducationCardsLive({
  entries,
  lang,
  heading,
  presentLabel,
  configured,
}: {
  entries: Entries
  lang: Lang
  heading: string
  presentLabel: string
  configured: boolean
}) {
  const t = useAdminT()
  const router = useRouter()
  const [logoFor, setLogoFor] = useState<string | null>(null)
  const label = (text: string) => `${t(text)} (${t(LANG_NAME[lang])})`
  // dari yang paling lama ke terbaru, seperti halaman Tentang; kartu baru di akhir
  const rows = [...entries.rows].sort((a, b) =>
    a.id === null ? 1 : b.id === null ? -1 : a.values.startMonth < b.values.startMonth ? -1 : 1,
  )
  const logoRow = rows.find((r) => r.key === logoFor)

  return (
    <section aria-labelledby="admin-about-edu">
      <h2 id="admin-about-edu" className="ab-label">
        {heading}
      </h2>
      <ul className="ab-edu mt-3.5">
        {rows.map((row) => {
          const v = row.values
          const err = entries.errors[row.key] ?? {}
          const set = (patch: Partial<typeof v>) => entries.update(row.key, patch)
          const org = lang === 'en' ? v.organization_en || v.organization : v.organization
          return (
            <li key={row.key} className="ab-edu-card group relative">
              {row.id ? (
                <button
                  type="button"
                  onClick={() => setLogoFor(row.key)}
                  className="ab-edu-logo admin-editable cursor-pointer"
                >
                  {row.logo ? (
                    <Image
                      placeholder={SHIMMER_PLACEHOLDER}
                      src={row.logo.url}
                      alt=""
                      width={128}
                      height={128}
                      sizes="64px"
                      className="size-full object-cover"
                    />
                  ) : (
                    <span aria-hidden="true">{initials(v.organization || '?')}</span>
                  )}
                  <span className="sr-only">{t('Logo {item}', { item: v.organization })}</span>
                </button>
              ) : (
                <span className="ab-edu-logo" aria-hidden="true">
                  {initials(v.organization || '?')}
                </span>
              )}
              <div className="ab-edu-text min-w-0 flex-1">
                <h3 className="font-display text-2xl leading-[1.1] font-bold uppercase">
                  <InlineInput
                    key={`org-${lang}`}
                    label={
                      lang === 'en'
                        ? t('Instansi dalam bahasa Inggris (opsional)')
                        : t('Sekolah / kampus')
                    }
                    value={org}
                    placeholder={t('Sekolah / kampus')}
                    invalid={Boolean(err.organization)}
                    className="w-full"
                    onChange={(event) => {
                      const next = event.target.value
                      if (lang === 'en')
                        set({ organization_en: next === v.organization ? '' : next })
                      else set({ organization: next })
                    }}
                  />
                </h3>
                <p className="mt-1 text-muted">
                  <InlineInput
                    key={`title-${lang}`}
                    label={label('Jenjang / jurusan')}
                    value={v[`title_${lang}`] ?? ''}
                    placeholder={t('Jenjang / jurusan')}
                    invalid={Boolean(err[`title_${lang}`])}
                    className="w-full"
                    onChange={(event) => set({ [`title_${lang}`]: event.target.value })}
                  />
                </p>
                <p className="flex flex-wrap items-center gap-x-1 text-sm text-muted tabular-nums">
                  <InlineInput
                    label={t('Tahun mulai')}
                    inputMode="numeric"
                    maxLength={4}
                    size={4}
                    value={v.startMonth.slice(0, 4)}
                    invalid={Boolean(err.startMonth)}
                    className="min-h-6"
                    onChange={(event) =>
                      set({
                        startMonth: withYear(v.startMonth, event.target.value.replace(/\D/g, '')),
                      })
                    }
                  />
                  <span aria-hidden="true">–</span>
                  {v.endMonth ? (
                    <>
                      <InlineInput
                        label={t('Tahun selesai')}
                        inputMode="numeric"
                        maxLength={4}
                        size={4}
                        value={v.endMonth.slice(0, 4)}
                        invalid={Boolean(err.endMonth)}
                        className="min-h-6"
                        onChange={(event) =>
                          set({
                            endMonth: withYear(
                              v.endMonth,
                              event.target.value.replace(/\D/g, ''),
                              '06',
                            ),
                          })
                        }
                      />
                      <button
                        type="button"
                        aria-label={t('Masih berlangsung')}
                        title={t('Masih berlangsung')}
                        onClick={() => set({ endMonth: '' })}
                        className="inline-flex size-6 items-center justify-center rounded-md hover:bg-surface-2"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      title={t('Tekan untuk mengisi tahun selesai')}
                      onClick={() => set({ endMonth: thisMonth() })}
                      className="admin-editable inline-flex min-h-6 items-center rounded-sm px-0.5"
                    >
                      {presentLabel}
                    </button>
                  )}
                </p>
                <MarkdownInline
                  key={`desc-${lang}`}
                  label={label('Grade / GPA')}
                  value={v[`description_${lang}`] ?? ''}
                  placeholder={t('Grade / GPA')}
                  invalid={Boolean(err[`description_${lang}`])}
                  size="sm"
                  className="mt-3 text-muted"
                  onChange={(text) => set({ [`description_${lang}`]: text })}
                />
                {/* alat kartu melayang di pojok kanan bawah agar tinggi kartu sama dengan situs */}
                <div className="absolute right-4 bottom-1.5 z-10 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={v.status === 'DRAFT'}
                    onClick={() => set({ status: v.status === 'DRAFT' ? 'PUBLISHED' : 'DRAFT' })}
                    className={cn(
                      'inline-flex min-h-7 items-center rounded-md border px-2 text-xs font-semibold',
                      v.status === 'DRAFT'
                        ? 'border-dashed border-border text-muted'
                        : 'border-transparent text-muted opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100',
                    )}
                  >
                    {t('Draf')}
                  </button>
                  <span className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
                    {row.id ? (
                      <ConfirmDelete
                        itemLabel={v.organization || t('Pendidikan')}
                        onConfirm={() => deleteExperience(row.id!)}
                        onDone={() => router.refresh()}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => entries.discard(row.key)}
                        className="inline-flex min-h-7 items-center rounded-md px-2 text-xs font-semibold text-muted hover:text-text"
                      >
                        {t('Batal')}
                      </button>
                    )}
                  </span>
                </div>
                {err._ ? <p className="mt-1 text-sm text-danger">{t(err._)}</p> : null}
              </div>
            </li>
          )
        })}
        <li>
          <button
            type="button"
            onClick={() => entries.add({ ...emptyEducation(), startMonth: thisMonth() }, true)}
            className="flex min-h-16 w-full items-center justify-center gap-2 rounded-[24px] border border-dashed border-border text-sm font-semibold text-muted hover:text-text"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t('Tambah pendidikan')}
          </button>
        </li>
      </ul>
      {logoRow?.id ? (
        <AssetEditDialog
          open
          onClose={() => setLogoFor(null)}
          onDone={() => {
            setLogoFor(null)
            router.refresh()
          }}
          title={t('Logo {item}', { item: logoRow.values.organization })}
          description="Logo kampus atau sekolah di kartu Pendidikan. Persegi, latar polos."
          target="experience-logo"
          targetId={logoRow.id}
          asset={logoRow.logo}
          configured={configured}
        />
      ) : null}
    </section>
  )
}
