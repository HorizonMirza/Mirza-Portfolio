'use client'

import { Plus } from 'lucide-react'
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
import { MonthPicker } from '@/components/admin/month-picker'
import { Container, PageIntro } from '@/components/site/section-heading'
import { useAssetPicker } from '@/features/assets/components/use-asset-picker'
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
                <ol aria-label={tx.listLabel} className="xp-tl admin-tight">
                  {rows.map((row) => {
                    const v = row.values
                    const err = entries.errors[row.key] ?? {}
                    const set = (patch: Partial<typeof v>) => entries.update(row.key, patch)
                    const org = lang === 'en' ? v.organization_en || v.organization : v.organization
                    const year = (v.startMonth || '').slice(0, 4) || '----'
                    // entri baru: pilihan gambar disimpan di browser dan diunggah saat Simpan
                    const sideButton = (slot: 'logo' | 'photo') => () => {
                      const target = slot === 'logo' ? 'experience-logo' : 'experience-photo'
                      if (row.id) picker.pick(target, row.id)
                      else
                        picker.pick(target, undefined, (blob, name) =>
                          entries.setPendingImage(row.key, slot, blob, name),
                        )
                    }
                    return (
                      <li
                        key={row.key}
                        data-type={v.type}
                        data-current={v.endMonth ? undefined : ''}
                        className="group"
                      >
                        <button
                          type="button"
                          onClick={sideButton('logo')}
                          className="xp-node admin-editable cursor-pointer"
                        >
                          {row.pending?.logo || row.logo ? (
                            // pratinjau sementara (blob) tidak lewat optimasi next/image
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.pending?.logo?.preview ?? row.logo!.url}
                              alt=""
                              width={112}
                              height={112}
                              className="size-full object-cover"
                            />
                          ) : (
                            <span aria-hidden="true">{initials(v.organization || '?')}</span>
                          )}
                          <span className="sr-only">
                            {t('Logo {item}', { item: v.organization })}
                          </span>
                        </button>
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
                              className="inline-block w-fit max-w-full align-top"
                            />
                          </h2>
                          <p className="mt-2.5">
                            <InlineInput
                              wrap
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
                            {/* jenis pekerjaan: teks bebas per bahasa (mis. Internship), bukan daftar pilihan */}
                            <InlineInput
                              wrap
                              key={`emp-${lang}`}
                              label={label('Jenis pekerjaan (opsional)')}
                              value={v[`employmentLabel_${lang}`] ?? ''}
                              placeholder={t('Jenis pekerjaan')}
                              maxLength={60}
                              size={Math.max(10, (v[`employmentLabel_${lang}`] ?? '').length + 1)}
                              invalid={Boolean(err[`employmentLabel_${lang}`])}
                              onChange={(event) =>
                                set({ [`employmentLabel_${lang}`]: event.target.value })
                              }
                            />
                          </p>
                          <p className="mt-2.5 text-sm text-muted tabular-nums [&>*]:mx-1.5 [&>*]:align-middle">
                            <MonthPicker
                              label={t('Mulai')}
                              value={v.startMonth}
                              lang={lang}
                              invalid={Boolean(err.startMonth)}
                              onChange={(value) => set({ startMonth: value })}
                            />
                            <span aria-hidden="true">-</span>
                            {v.endMonth ? (
                              <>
                                <MonthPicker
                                  label={t('Selesai')}
                                  value={v.endMonth}
                                  lang={lang}
                                  invalid={Boolean(err.endMonth)}
                                  onChange={(value) => set({ endMonth: value })}
                                />
                                <button
                                  type="button"
                                  onClick={() => set({ endMonth: '' })}
                                  className="admin-editable inline-flex min-h-6 items-center rounded-none px-0.5"
                                >
                                  {t('Masih berlangsung')}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                title={t('Tekan untuk mengisi bulan selesai')}
                                onClick={() => set({ endMonth: thisMonth() })}
                                className="admin-editable inline-flex min-h-6 items-center rounded-none px-0.5"
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
                            {/* "Draf" hanya untuk entri yang masih draf (tekan untuk menerbitkan) */}
                            {v.status === 'DRAFT' ? (
                              <button
                                type="button"
                                title={t('Draf: tidak tampil di situs. Tekan untuk menerbitkan.')}
                                onClick={() => set({ status: 'PUBLISHED' })}
                                className="inline-flex min-h-7 items-center border border-dashed border-border px-2 text-xs font-semibold text-muted hover:text-text"
                              >
                                {t('Draf')}
                              </button>
                            ) : null}
                            <span className={cn('inline-flex items-center gap-1', hover)}>
                              {row.id ? (
                                <ConfirmDelete
                                  title="Hapus Pengalaman"
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
                          <button
                            type="button"
                            onClick={sideButton('photo')}
                            className={cn(
                              'admin-editable cursor-pointer rounded-[12px] [--editable-offset:2px]',
                              // foto selebar kolom (maks. 20rem) dan terdorong ke garis tengah seperti di situs;
                              // tahun cukup selebar angkanya
                              row.pending?.photo || row.photo
                                ? 'ml-(--xp-push) block w-full max-w-80'
                                : 'inline-block',
                            )}
                          >
                            {row.pending?.photo || row.photo ? (
                              <span className="pj-tilt xp-tilt block">
                                <span className="pj-tilt-in block">
                                  <span className="xp-frame block">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={row.pending?.photo?.preview ?? row.photo!.url}
                                      alt=""
                                      width={row.photo?.width ?? 800}
                                      height={row.photo?.height ?? 600}
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
