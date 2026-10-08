import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { Chip } from '@/components/site/section-heading'
import type { PublicProjectSummary } from '@/features/projects/public'
import type { AppLocale } from '@/i18n/routing'
import { Link } from '@/i18n/navigation'
import { loc } from '@/lib/localized'
import { cn } from '@/lib/utils'

// Satu baris di halaman Project, pilihan pemilik 2026-10-08 (demo 6 "zig-zag", DESIGN.md bagian 48):
// gambar dan teks berdampingan, sisi gambar bergantian tiap baris di layar lebar; di HP gambar di
// atas teks. Gambar masuk dari sisinya dan teks menyusul (reveal); seluruh baris bisa diklik.
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

  return (
    <article className="pj-zz group relative grid items-center gap-5 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-8 has-[a:focus-visible]:outline-primary md:grid-cols-2 md:gap-12">
      <div
        className={cn(
          'pj-zz-img reveal relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-surface-2',
          flip ? 'pj-zz-from-right md:order-2' : 'pj-zz-from-left',
        )}
      >
        {project.cover ? (
          <Image
            src={project.cover.url}
            alt={loc(project.cover, 'alt', locale)}
            fill
            sizes="(min-width: 768px) 560px, 100vw"
            priority={index === 0}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
          />
        ) : (
          // Tanpa sampul: bidang tipografi dengan nomor project, bukan ilustrasi generik.
          <div
            aria-hidden="true"
            className="project-cover-fallback absolute inset-0 flex items-end p-5"
          >
            <span className="font-mono text-display leading-none font-bold text-border-strong/40">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>
      <div className="pj-zz-text reveal flex flex-col gap-3">
        <p className="flex flex-wrap items-center gap-x-2 font-mono text-label tracking-widest text-note uppercase">
          <span>{String(index + 1).padStart(2, '0')}</span>
          <span aria-hidden="true">·</span>
          <span>{t(project.category)}</span>
          <span aria-hidden="true">·</span>
          <span>{project.year}</span>
        </p>
        <h2 className="text-h3 font-semibold md:text-h2">
          {/* seluruh baris dapat diklik lewat pseudo-element; tautan tetap satu untuk pembaca layar */}
          <Link
            href={`/projects/${project.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {loc(project, 'title', locale)}
          </Link>
        </h2>
        <p className="max-w-prose text-muted">{loc(project, 'summary', locale)}</p>
        {project.skills.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label={t('stack')}>
            {project.skills.map((s) => (
              <li key={s.id}>
                <Chip>{s.name}</Chip>
              </li>
            ))}
          </ul>
        ) : null}
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
