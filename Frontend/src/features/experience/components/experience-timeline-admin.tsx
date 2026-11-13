import { Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { LiveStage } from '@/components/admin/live-edit'
import { MarkdownView } from '@/components/shared/markdown-view'
import { Container, PageIntro } from '@/components/site/section-heading'
import type { AdminLang } from '@/lib/admin-i18n'
import { getAdminT } from '@/lib/admin-lang-server'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'
import { formatMonth } from '@/lib/localized'

import { deleteExperience } from '../actions'
import { durationText } from '../display'
import { listExperiencesAdmin } from '../queries'
import { dateToMonth, initials, organizationName, sortByLatest } from '../schema'

// Admin → Experience (revisi pemilik 2026-11-13, DESIGN.md bagian 145): halaman Pengalaman tampil
// sama persis seperti di situs (judul, timeline, peran, instansi · jenis pekerjaan, periode · durasi,
// uraian, foto atau tahun), termasuk entri draf. Peran ditekan untuk membuka dan mengubah entri; draf
// ditandai dan Hapus muncul saat entri disorot atau difokus. Teks dalam bahasa admin.
export async function ExperienceTimelineAdmin({ lang }: { lang: AdminLang }) {
  const [rows, msg, { t: ta }] = await Promise.all([
    listExperiencesAdmin('experience'),
    getTranslations({ locale: lang, namespace: 'Experience' }),
    getAdminT(),
  ])
  const items = sortByLatest(
    rows.map((e) => ({
      ...e,
      start: dateToMonth(e.startDate),
      end: e.endDate ? dateToMonth(e.endDate) : null,
    })),
  )

  return (
    <LiveStage className="site-ui bg-bg text-text">
      <Container className="pb-20">
        <PageIntro title={msg('title')} align="center" />
        <Link
          href="/admin/experience/new"
          className="mb-12 flex min-h-12 items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm font-semibold text-muted hover:text-text"
        >
          <Plus className="size-4" aria-hidden="true" />
          {ta('Tambah pengalaman')}
        </Link>
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-muted">
            {msg('none')}
          </p>
        ) : (
          <ol aria-label={msg('listLabel')} className="xp-tl">
            {items.map((e) => {
              const org = organizationName(e, lang)
              const title = (lang === 'en' && e.title_en) || e.title_id
              const description = (lang === 'en' && e.description_en) || e.description_id
              return (
                <li
                  key={e.id}
                  data-type={e.type}
                  data-current={e.end ? undefined : ''}
                  className="group"
                >
                  <div className="xp-node" aria-hidden="true">
                    {e.logo ? (
                      <Image
                        placeholder={SHIMMER_PLACEHOLDER}
                        src={e.logo.url}
                        alt=""
                        width={112}
                        height={112}
                        sizes="56px"
                        className="size-full object-cover"
                      />
                    ) : (
                      <span>{initials(e.organization)}</span>
                    )}
                  </div>
                  <div className="xp-main">
                    <h2 className="text-h3 font-semibold">
                      {/* seluruh entri bisa ditekan (pseudo-element), nama tautan = peran + keterangan */}
                      <Link
                        href={`/admin/experience/${e.id}`}
                        className="after:absolute after:inset-0 after:content-[''] hover:opacity-80 focus-visible:outline-2 focus-visible:outline-current"
                      >
                        {title}
                        <span className="sr-only">{ta(', ubah')}</span>
                      </Link>
                    </h2>
                    <p className="mt-1">
                      {org}
                      {e.employmentType ? ` · ${msg(`employment.${e.employmentType}`)}` : ''}
                    </p>
                    <p className="mt-1 text-sm text-muted tabular-nums">
                      {formatMonth(e.start, lang)} -{' '}
                      {e.end ? formatMonth(e.end, lang) : msg('present')} ·{' '}
                      {durationText(e.start, e.end, msg)}
                    </p>
                    <MarkdownView
                      source={description}
                      size="base"
                      className="xp-desc mt-3 text-muted"
                    />
                    <div className="relative z-10 mt-3 flex items-center gap-2 empty:hidden">
                      {e.status === 'DRAFT' ? (
                        <span className="rounded-md border border-dashed border-border px-2 py-0.5 font-sans text-xs font-semibold text-muted">
                          {ta('Draf')}
                        </span>
                      ) : null}
                      <span className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
                        <ConfirmDelete
                          itemLabel={ta('{title} di {organization}', {
                            title,
                            organization: org,
                          })}
                          onConfirm={deleteExperience.bind(null, e.id)}
                        />
                      </span>
                    </div>
                  </div>
                  <div className="xp-side">
                    {e.photo ? (
                      <div className="pj-tilt xp-tilt">
                        <div className="pj-tilt-in">
                          <span className="xp-frame">
                            <Image
                              placeholder={SHIMMER_PLACEHOLDER}
                              src={e.photo.url}
                              alt=""
                              width={e.photo.width ?? 800}
                              height={e.photo.height ?? 600}
                              sizes="(min-width: 1024px) 320px, (min-width: 768px) 40vw, 100vw"
                              className="xp-photo"
                            />
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="xp-year">
                        <span className="font-display text-[2.75rem] leading-none font-bold">
                          {e.start.slice(0, 4)}
                        </span>
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </Container>
    </LiveStage>
  )
}
