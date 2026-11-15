'use client'

import { Plus, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { useAdminT } from '@/components/admin/admin-lang'
import { ConfirmDelete } from '@/components/admin/confirm-delete'
import {
  InlineArea,
  InlineInput,
  LANG_NAME,
  type Lang,
  LangRow,
  LiveStage,
  MarkdownInline,
  SaveBar,
  useEditLang,
} from '@/components/admin/live-edit'
import { Container, PageIntro } from '@/components/site/section-heading'
import { RemoveAssetButton } from '@/features/assets/components/remove-asset-button'
import { useAssetPicker } from '@/features/assets/components/use-asset-picker'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'
import { cn } from '@/lib/utils'

import { deleteExperience } from '../actions'
import { monthsBetween } from '../display'
import { EMPLOYMENT_TYPES, emptyExperience, initials, sortByLatest } from '../schema'
import { thisMonth } from './education-cards-live'
import { type EntryRow, useEntries } from './use-entries'

// Teks situs (messages Experience) per bahasa, disiapkan server
export type ExperienceTexts = Record<
  Lang,
  {
    title: string
    none: string
    listLabel: string
    present: string
    employment: Record<(typeof EMPLOYMENT_TYPES)[number], string>
    // bentuk tunggal dan jamak "# Tahun" / "# Bulan" ("#" diganti angka)
    years: { one: string; other: string }
    months: { one: string; other: string }
  }
>

function duration(start: string, end: string, lang: Lang, texts: ExperienceTexts[Lang]) {
  if (!/^\d{4}-\d{2}$/.test(start)) return ''
  const n = monthsBetween(start, end || null)
  const plural = new Intl.PluralRules(lang)
  const fmt = (count: number, forms: { one: string; other: string }) =>
    (plural.select(count) === 'one' ? forms.one : forms.other).replace('#', String(count))
  const years = Math.floor(n / 12)
  const months = n % 12
  return [years ? fmt(years, texts.years) : '', months ? fmt(months, texts.months) : '']
    .filter(Boolean)
    .join(' ')
}

// Admin → Experience (revisi pemilik 2026-11-13, DESIGN.md bagian 147): halaman Pengalaman sama
// persis seperti di situs dan semuanya diubah di halaman ini (tanpa pindah halaman): peran, instansi,
// jenis pekerjaan, bulan mulai dan selesai, uraian (tampil seperti di situs, ditekan untuk diketik),
// logo dan foto (ditekan untuk diganti). "+ Tambah pengalaman" menambah entri di tempat. Jenis
// (kerja/organisasi), draf, dan hapus muncul saat entri disorot. Pilihan bahasa ID/EN tepat di atas
// Simpan; Simpan menyimpan semua entri yang berubah.
export function ExperienceTimelineLive({
  initial,
  texts,
  configured,
}: {
  initial: EntryRow[]
  texts: ExperienceTexts
  configured: boolean
}) {
  const t = useAdminT()
  const router = useRouter()
  const [lang, setLang] = useEditLang()
  const [pending, startTransition] = useTransition()
  // logo dan foto ditekan: langsung membuka pemilih berkas, lalu pemotong gambar (DESIGN.md bagian 148)
  const picker = useAssetPicker({ configured, onDone: () => router.refresh() })
  const entries = useEntries(initial)
  const tx = texts[lang]
  const label = (text: string) => `${t(text)} (${t(LANG_NAME[lang])})`
  // entri baru di atas, lalu urutan situs (yang masih berjalan dan paling akhir selesai di atas)
  const fresh = entries.rows.filter((r) => r.id === null)
  const saved = sortByLatest(
    entries.rows
      .filter((r) => r.id !== null)
      .map((r) => ({ row: r, start: r.values.startMonth, end: r.values.endMonth || null })),
  ).map((x) => x.row)
  const rows = [...fresh, ...saved]

  function save(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await entries.saveAll()
      if (result.failed > 0) toast.error(t('Periksa kembali isian pengalaman.'))
      else if (result.saved > 0) toast.success(t('Pengalaman disimpan.'))
      if (result.saved > 0) router.refresh()
    })
  }

  const hover =
    'opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100'

  return (
    <>
      <form onSubmit={save} noValidate className="flex flex-col gap-4">
        <LiveStage className="bg-bg text-text">
          <Container className="site-ui pb-20">
            <div lang={lang}>
              <PageIntro title={tx.title} align="center" />
              <button
                type="button"
                onClick={() => entries.add({ ...emptyExperience, startMonth: thisMonth() })}
                className="mb-12 flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border font-sans text-sm font-semibold text-muted hover:text-text"
              >
                <Plus className="size-4" aria-hidden="true" />
                {t('Tambah pengalaman')}
              </button>
              {rows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-6 text-muted">
                  {tx.none}
                </p>
              ) : (
                <ol aria-label={tx.listLabel} className="xp-tl">
                  {rows.map((row) => {
                    const v = row.values
                    const err = entries.errors[row.key] ?? {}
                    const set = (patch: Partial<typeof v>) => entries.update(row.key, patch)
                    const org = lang === 'en' ? v.organization_en || v.organization : v.organization
                    const year = (v.startMonth || '').slice(0, 4) || '----'
                    const sideButton = (slot: 'logo' | 'photo') =>
                      row.id
                        ? () =>
                            picker.pick(
                              slot === 'logo' ? 'experience-logo' : 'experience-photo',
                              row.id!,
                            )
                        : undefined
                    return (
                      <li
                        key={row.key}
                        data-type={v.type}
                        data-current={v.endMonth ? undefined : ''}
                        className="group"
                      >
                        {row.id ? (
                          <button
                            type="button"
                            onClick={sideButton('logo')}
                            className="xp-node admin-editable cursor-pointer"
                          >
                            {row.logo ? (
                              <Image
                                placeholder={SHIMMER_PLACEHOLDER}
                                src={row.logo.url}
                                alt=""
                                width={112}
                                height={112}
                                sizes="56px"
                                className="size-full object-cover"
                              />
                            ) : (
                              <span aria-hidden="true">{initials(v.organization || '?')}</span>
                            )}
                            <span className="sr-only">
                              {t('Logo {item}', { item: v.organization })}
                            </span>
                          </button>
                        ) : (
                          <div className="xp-node" aria-hidden="true">
                            <span>{initials(v.organization || '?')}</span>
                          </div>
                        )}
                        <div className="xp-main relative">
                          <h2 className="text-h3 font-semibold">
                            <InlineArea
                              key={`title-${lang}`}
                              label={label('Peran')}
                              value={v[`title_${lang}`] ?? ''}
                              measure={v[`title_${lang}`] ?? ''}
                              placeholder={t('Peran')}
                              invalid={Boolean(err[`title_${lang}`])}
                              onChange={(event) => set({ [`title_${lang}`]: event.target.value })}
                            />
                          </h2>
                          <p className="mt-1">
                            <InlineInput
                              key={`org-${lang}`}
                              label={
                                lang === 'en'
                                  ? t('Instansi dalam bahasa Inggris (opsional)')
                                  : t('Instansi')
                              }
                              value={org}
                              placeholder={t('Instansi')}
                              size={Math.max(6, org.length + 1)}
                              invalid={Boolean(err.organization)}
                              onChange={(event) => {
                                const next = event.target.value
                                if (lang === 'en')
                                  set({ organization_en: next === v.organization ? '' : next })
                                else set({ organization: next })
                              }}
                            />
                            {' · '}
                            <select
                              aria-label={t('Jenis pekerjaan (opsional)')}
                              value={v.employmentType}
                              onChange={(event) =>
                                set({
                                  employmentType: event.target.value as typeof v.employmentType,
                                })
                              }
                              className="admin-inline cursor-pointer"
                            >
                              <option value="">{t('Tidak ditampilkan')}</option>
                              {EMPLOYMENT_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {tx.employment[type]}
                                </option>
                              ))}
                            </select>
                          </p>
                          <p className="mt-1 text-sm text-muted tabular-nums [&>*]:mx-0.5 [&>*]:align-middle">
                            <input
                              type="month"
                              aria-label={t('Mulai')}
                              value={v.startMonth}
                              onChange={(event) => set({ startMonth: event.target.value })}
                              className={cn(
                                'admin-inline min-h-6',
                                err.startMonth && 'admin-inline-bad',
                              )}
                            />
                            <span aria-hidden="true">-</span>
                            {v.endMonth ? (
                              <>
                                <input
                                  type="month"
                                  aria-label={t('Selesai')}
                                  value={v.endMonth}
                                  onChange={(event) => set({ endMonth: event.target.value })}
                                  className={cn(
                                    'admin-inline min-h-6',
                                    err.endMonth && 'admin-inline-bad',
                                  )}
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
                                title={t('Tekan untuk mengisi bulan selesai')}
                                onClick={() => set({ endMonth: thisMonth() })}
                                className="admin-editable inline-flex min-h-6 items-center rounded-sm px-0.5"
                              >
                                {tx.present}
                              </button>
                            )}
                            <span aria-hidden="true">·</span>
                            <span>{duration(v.startMonth, v.endMonth, lang, tx)}</span>
                          </p>
                          <MarkdownInline
                            key={`desc-${lang}`}
                            label={label('Uraian')}
                            value={v[`description_${lang}`] ?? ''}
                            placeholder={t('Uraian')}
                            invalid={Boolean(err[`description_${lang}`])}
                            className="xp-desc mt-3 text-muted"
                            onChange={(text) => set({ [`description_${lang}`]: text })}
                          />
                          {/* alat entri melayang di celah bawah entri agar tinggi entri sama dengan situs;
                              di HP (foto di bawah teks) tetap di alur biasa */}
                          <div className="absolute inset-x-0 top-full pt-2 font-sans max-md:static max-md:pt-3 [&>*]:mx-1 [&>*]:align-middle">
                            {(['WORK', 'ORGANIZATION'] as const).map((type) => (
                              <button
                                key={type}
                                type="button"
                                aria-pressed={v.type === type}
                                onClick={() => set({ type })}
                                className={cn(
                                  'inline-flex min-h-7 items-center rounded-md border px-2 text-xs font-semibold',
                                  v.type === type
                                    ? 'border-text bg-text text-bg'
                                    : 'border-dashed border-border text-muted',
                                  hover,
                                )}
                              >
                                {t(type === 'WORK' ? 'Kerja' : 'Organisasi')}
                              </button>
                            ))}
                            {/* "Draf" hanya untuk entri yang masih draf (tekan untuk menerbitkan);
                                hapus logo/foto dan hapus entri berupa ikon kecil */}
                            {v.status === 'DRAFT' ? (
                              <button
                                type="button"
                                title={t('Draf: tidak tampil di situs. Tekan untuk menerbitkan.')}
                                onClick={() => set({ status: 'PUBLISHED' })}
                                className="inline-flex min-h-7 items-center rounded-md border border-dashed border-border px-2 text-xs font-semibold text-muted hover:text-text"
                              >
                                {t('Draf')}
                              </button>
                            ) : null}
                            <span className={cn('inline-flex items-center gap-1', hover)}>
                              {row.logo ? (
                                <RemoveAssetButton
                                  assetId={row.logo.id}
                                  label={t('Logo {item}', { item: v.organization })}
                                  onDone={() => router.refresh()}
                                />
                              ) : null}
                              {row.photo ? (
                                <RemoveAssetButton
                                  assetId={row.photo.id}
                                  label={t('Foto kegiatan {item}', { item: v.organization })}
                                  onDone={() => router.refresh()}
                                />
                              ) : null}
                              {row.id ? (
                                <ConfirmDelete
                                  iconOnly
                                  itemLabel={
                                    v[`title_${lang}`] || v.organization || t('Pengalaman')
                                  }
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
                        <div className="xp-side">
                          {row.id ? (
                            <button
                              type="button"
                              onClick={sideButton('photo')}
                              className="admin-editable block cursor-pointer rounded-[12px] text-left [--editable-offset:4px]"
                            >
                              {row.photo ? (
                                <span className="pj-tilt xp-tilt block">
                                  <span className="pj-tilt-in block">
                                    <span className="xp-frame block">
                                      <Image
                                        placeholder={SHIMMER_PLACEHOLDER}
                                        src={row.photo.url}
                                        alt=""
                                        width={row.photo.width ?? 800}
                                        height={row.photo.height ?? 600}
                                        sizes="(min-width: 1024px) 320px, (min-width: 768px) 40vw, 100vw"
                                        className="xp-photo"
                                      />
                                    </span>
                                  </span>
                                </span>
                              ) : (
                                <span className="xp-year block">
                                  <span className="font-display text-[2.75rem] leading-none font-bold">
                                    {year}
                                  </span>
                                </span>
                              )}
                              <span className="sr-only">
                                {t('Foto kegiatan {item}', { item: v.organization })}
                              </span>
                            </button>
                          ) : (
                            <p className="xp-year">
                              <span className="font-display text-[2.75rem] leading-none font-bold">
                                {year}
                              </span>
                            </p>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          </Container>
        </LiveStage>
        {/* bahasa isi tepat di atas Simpan, bentuknya sama dengan tombol chip di About */}
        <LangRow lang={lang} onChange={setLang} />
        <SaveBar pending={pending} />
      </form>
      {picker.element}
    </>
  )
}
