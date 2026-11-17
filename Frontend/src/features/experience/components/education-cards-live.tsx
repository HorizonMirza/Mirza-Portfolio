'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useAdminT } from '@/components/admin/admin-lang'
import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { InlineInput, LANG_NAME, type Lang, MarkdownInline } from '@/components/admin/live-edit'
import { useAssetPicker } from '@/features/assets/components/use-asset-picker'

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
  // logo ditekan: langsung membuka pemilih berkas, lalu pemotong gambar (DESIGN.md bagian 148)
  const picker = useAssetPicker({ configured, onDone: () => router.refresh() })
  const label = (text: string) => `${t(text)} (${t(LANG_NAME[lang])})`
  // dari yang paling lama ke terbaru, seperti halaman Tentang; kartu baru di akhir
  const rows = [...entries.rows].sort((a, b) =>
    a.id === null ? 1 : b.id === null ? -1 : a.values.startMonth < b.values.startMonth ? -1 : 1,
  )

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
              {/* logo ditekan untuk diunggah; kartu baru menyimpan pilihannya di browser dan
                  mengunggahnya saat Simpan */}
              <button
                type="button"
                onClick={() =>
                  row.id
                    ? picker.pick('experience-logo', row.id)
                    : picker.pick('experience-logo', undefined, (blob, name) =>
                        entries.setPendingImage(row.key, 'logo', blob, name),
                      )
                }
                className="ab-edu-logo admin-editable cursor-pointer"
              >
                {row.pending?.logo || row.logo ? (
                  // pratinjau sementara (blob) tidak lewat optimasi next/image
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.pending?.logo?.preview ?? row.logo!.url}
                    alt=""
                    width={128}
                    height={128}
                    className="size-full object-cover"
                  />
                ) : (
                  <span aria-hidden="true">{initials(v.organization || '?')}</span>
                )}
                <span className="sr-only">{t('Logo {item}', { item: v.organization })}</span>
              </button>
              <div className="ab-edu-text flex min-w-0 flex-1 flex-col items-start gap-2.5 pr-8">
                <h3 className="font-display text-2xl leading-[1.1] font-bold uppercase">
                  <InlineInput
                    wrap
                    key={`org-${lang}`}
                    label={
                      lang === 'en'
                        ? t('Instansi dalam bahasa Inggris (opsional)')
                        : t('Sekolah / kampus')
                    }
                    value={org}
                    placeholder={t('Sekolah / kampus')}
                    invalid={Boolean(err.organization)}
                    size={Math.max(4, org.length + 1)}
                    className="max-w-full"
                    onChange={(event) => {
                      const next = event.target.value
                      if (lang === 'en')
                        set({ organization_en: next === v.organization ? '' : next })
                      else set({ organization: next })
                    }}
                  />
                </h3>
                <p className="text-muted">
                  <InlineInput
                    wrap
                    key={`title-${lang}`}
                    label={label('Jenjang / jurusan')}
                    value={v[`title_${lang}`] ?? ''}
                    placeholder={t('Jenjang / jurusan')}
                    invalid={Boolean(err[`title_${lang}`])}
                    size={Math.max(4, (v[`title_${lang}`] ?? '').length + 1)}
                    className="max-w-full"
                    onChange={(event) => set({ [`title_${lang}`]: event.target.value })}
                  />
                </p>
                <p className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-sm text-muted tabular-nums">
                  <InlineInput
                    label={t('Tahun mulai')}
                    inputMode="numeric"
                    maxLength={4}
                    size={4}
                    value={v.startMonth.split('-')[0]}
                    invalid={Boolean(err.startMonth)}
                    className="min-h-6"
                    onChange={(event) =>
                      set({
                        startMonth: withYear(v.startMonth, event.target.value.replace(/\D/g, '')),
                      })
                    }
                  />
                  <span aria-hidden="true">–</span>
                  {/* tahun selesai: ketik angka, atau teks apa pun tanpa angka (mis. Present) berarti masih
                      berlangsung; tidak ada tombol terpisah */}
                  <InlineInput
                    label={t('Tahun selesai')}
                    maxLength={12}
                    size={Math.max(4, (v.endMonth ? 4 : presentLabel.length) + 1)}
                    value={v.endMonth ? v.endMonth.split('-')[0] : presentLabel}
                    invalid={Boolean(err.endMonth)}
                    className="min-h-6"
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, '').slice(0, 4)
                      set({ endMonth: digits ? withYear(v.endMonth, digits, '06') : '' })
                    }}
                  />
                </p>
                <MarkdownInline
                  key={`desc-${lang}`}
                  label={label('Grade / GPA')}
                  value={v[`description_${lang}`] ?? ''}
                  placeholder={t('Grade / GPA')}
                  invalid={Boolean(err[`description_${lang}`])}
                  size="sm"
                  className="w-fit rounded-none text-muted"
                  onChange={(text) => set({ [`description_${lang}`]: text })}
                />
                {/* alat kartu di pojok kanan atas, tampil saat kartu disorot: hapus logo dan hapus kartu
                    berupa ikon kecil; "Draf" hanya tampil untuk entri yang masih draf (tekan untuk
                    menerbitkan) */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
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
                  <span className="flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
                    {/* satu tombol hapus: menghapus kartu beserta logonya */}
                    {row.id ? (
                      <ConfirmDelete
                        title="Hapus Pendidikan"
                        iconOnly
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
      {picker.element}
    </section>
  )
}
