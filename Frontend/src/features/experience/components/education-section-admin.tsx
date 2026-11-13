import { Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { MarkdownView } from '@/components/shared/markdown-view'
import type { AdminLang } from '@/lib/admin-i18n'
import { adminT } from '@/lib/admin-i18n'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'

import { deleteExperience } from '../actions'
import type { listExperiencesAdmin } from '../queries'
import { dateToMonth, initials, organizationName } from '../schema'

type EducationRow = Awaited<ReturnType<typeof listExperiencesAdmin>>[number]

// Bagian Pendidikan halaman Tentang untuk Admin → About (revisi pemilik 2026-11-13, DESIGN.md
// bagian 146): kartu sama persis dengan situs (logo, kampus, jurusan, tahun, grade), termasuk draf.
// Kartu ditekan untuk membuka dan mengubah entri; Hapus muncul saat kartu disorot atau difokus.
// Dirender di server untuk satu bahasa isi (lang); label admin dalam bahasa tampilan admin (ui).
export async function EducationSectionAdmin({
  rows,
  lang,
  ui,
}: {
  rows: EducationRow[]
  lang: AdminLang
  ui: AdminLang
}) {
  const [tAbout, tExp] = await Promise.all([
    getTranslations({ locale: lang, namespace: 'About' }),
    getTranslations({ locale: lang, namespace: 'Experience' }),
  ])
  const ta = (text: string, vars?: Record<string, string>) => adminT(ui, text, vars)
  // dari yang paling lama ke terbaru, sama seperti halaman Tentang
  const items = rows
    .map((e) => ({
      ...e,
      start: dateToMonth(e.startDate),
      end: e.endDate ? dateToMonth(e.endDate) : null,
    }))
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))

  return (
    <section aria-labelledby={`admin-about-edu-${lang}`}>
      <h2 id={`admin-about-edu-${lang}`} className="ab-label">
        {tAbout('educationHeading')}
      </h2>
      <ul className="ab-edu">
        {items.map((e) => {
          const org = organizationName(e, lang)
          const title = (lang === 'en' && e.title_en) || e.title_id
          const description = (lang === 'en' && e.description_en) || e.description_id
          return (
            <li key={e.id} className="ab-edu-card group relative">
              <span className="ab-edu-logo" aria-hidden="true">
                {e.logo ? (
                  <Image
                    placeholder={SHIMMER_PLACEHOLDER}
                    src={e.logo.url}
                    alt=""
                    width={128}
                    height={128}
                    sizes="64px"
                    className="size-full object-cover"
                  />
                ) : (
                  initials(e.organization)
                )}
              </span>
              <div className="ab-edu-text">
                <h3 className="font-display text-2xl leading-[1.1] font-bold uppercase">
                  {/* seluruh kartu bisa ditekan (pseudo-element) */}
                  <Link
                    href={`/admin/education/${e.id}`}
                    className="after:absolute after:inset-0 after:rounded-[24px] after:content-[''] focus-visible:outline-2 focus-visible:outline-current"
                  >
                    {org}
                    <span className="sr-only">{ta(', ubah')}</span>
                  </Link>
                </h3>
                <p className="mt-1 text-muted">{title}</p>
                <p className="text-sm text-muted tabular-nums">
                  {e.start.slice(0, 4)} – {e.end ? e.end.slice(0, 4) : tExp('present')}
                </p>
                <MarkdownView source={description} size="sm" className="mt-3 text-muted" />
                <div className="relative z-10 mt-2 flex items-center gap-2 empty:hidden">
                  {e.status === 'DRAFT' ? (
                    <span className="rounded-md border border-dashed border-border px-2 py-0.5 text-xs font-semibold text-muted">
                      {ta('Draf')}
                    </span>
                  ) : null}
                  <span className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
                    <ConfirmDelete
                      itemLabel={ta('{title} di {organization}', { title, organization: org })}
                      onConfirm={deleteExperience.bind(null, e.id)}
                    />
                  </span>
                </div>
              </div>
            </li>
          )
        })}
        <li>
          <Link
            href="/admin/education/new"
            className="flex min-h-16 items-center justify-center gap-2 rounded-[24px] border border-dashed border-border text-sm font-semibold text-muted hover:text-text"
          >
            <Plus className="size-4" aria-hidden="true" />
            {ta('Tambah pendidikan')}
          </Link>
        </li>
      </ul>
    </section>
  )
}
