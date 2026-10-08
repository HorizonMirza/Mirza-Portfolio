import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { ViewTransition } from 'react'

import { PhotoTilt } from '@/features/profile/components/photo-tilt'
import type { PublicProjectSummary } from '@/features/projects/public'
import type { AppLocale } from '@/i18n/routing'
import { Link } from '@/i18n/navigation'
import { loc } from '@/lib/localized'
import { cn } from '@/lib/utils'

import { TechChips } from './tech-chips'

// Satu baris di halaman Project, pilihan pemilik 2026-10-08 (demo 6 "zig-zag", DESIGN.md bagian 48):
// gambar dan teks berdampingan, sisi gambar bergantian tiap baris di layar lebar; di HP gambar di
// atas teks. Gambar masuk dari sisinya dan teks menyusul (reveal); seluruh baris bisa diklik.
// Efek pilihan pemilik (demo efek 1, 4, 6, 7): gambar miring + kilau berbunyi, nomor besar bergaris
// di belakang teks yang bergerak lebih lambat saat digulir, gambar "terbang" ke halaman detail
// (View Transition bernama sama), dan logo di chip teknologi.
export async function ProjectRow({
  project,
  index,
  locale,
}: {
  project: PublicProjectSummary
  index: number
  locale: AppLocale
}) {
  const t = await getTranslations({ locale, namespace: 'Projects' })
  const flip = index % 2 === 1
  const number = String(index + 1).padStart(2, '0')
  const href = `/projects/${project.slug}`

  return (
    <article className="pj-zz group relative grid items-center gap-5 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-8 has-[a:focus-visible]:outline-primary md:grid-cols-2 md:gap-12">
      <div
        className={cn(
          'pj-zz-img reveal relative z-10',
          flip ? 'pj-zz-from-right md:order-2' : 'pj-zz-from-left',
        )}
      >
        {/* tautan kedua khusus mouse/sentuh agar gambar bisa dimiringkan dan tetap bisa diklik;
            pembaca layar dan keyboard memakai tautan di judul */}
        <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
          <PhotoTilt className="pj-tilt" maxTilt={8}>
            <div className="pj-tilt-in">
              <ViewTransition name={`project-${project.slug}`} share="morph" default="none">
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-surface-2">
                  {project.cover ? (
                    <Image
                      src={project.cover.url}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 560px, 100vw"
                      priority={index === 0}
                      className="object-cover"
                    />
                  ) : (
                    // Tanpa sampul: bidang tipografi dengan nomor project, bukan ilustrasi generik.
                    <div className="project-cover-fallback absolute inset-0 flex items-end p-5">
                      <span className="font-mono text-display leading-none font-bold text-border-strong/40">
                        {number}
                      </span>
                    </div>
                  )}
                  <span className="pj-glare" />
                </div>
              </ViewTransition>
            </div>
          </PhotoTilt>
        </Link>
      </div>
      <div className="pj-zz-text reveal relative isolate flex flex-col gap-3">
        <span aria-hidden="true" className="pj-bignum">
          {number}
        </span>
        <p className="flex flex-wrap items-center gap-x-2 font-mono text-label tracking-widest text-note uppercase">
          <span>{number}</span>
          <span aria-hidden="true">·</span>
          <span>{t(project.category)}</span>
          <span aria-hidden="true">·</span>
          <span>{project.year}</span>
        </p>
        <h2 className="text-h3 font-semibold md:text-h2">
          {/* seluruh baris dapat diklik lewat pseudo-element; tautan tetap satu untuk pembaca layar */}
          <Link
            href={href}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {loc(project, 'title', locale)}
          </Link>
        </h2>
        <p className="max-w-prose text-muted">{loc(project, 'summary', locale)}</p>
        <TechChips skills={project.skills} label={t('stack')} />
        <span
          className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
          aria-hidden="true"
        >
          {t('readMoreShort')}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
        </span>
      </div>
    </article>
  )
}
