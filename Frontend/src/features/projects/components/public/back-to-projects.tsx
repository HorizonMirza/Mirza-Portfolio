'use client'

import { ArrowLeft } from 'lucide-react'

import { markReturnToList } from '@/features/projects/list-return'
import { Link } from '@/i18n/navigation'

// Tombol "Semua project" di detail. Tanpa gulir otomatis Next (scroll={false}): daftar sendiri yang
// mengembalikan posisi terakhir sebelum project ditekan (ProjectSpotlight, list-return.ts), atau
// membuka dari atas bila project tidak dibuka dari daftar.
export function BackToProjects({ slug, label }: { slug: string; label: string }) {
  return (
    <Link
      href="/projects"
      scroll={false}
      transitionTypes={['project-close']}
      onClick={() => markReturnToList(slug)}
      // huruf display situs (Oswald) seperti judul bagian (revisi pemilik 2026-10-08). Saat disorot
      // (B3, pilihan pemilik 2026-11-10): warna menguat, huruf sedikit merenggang, panah bergeser ke kiri
      className="group inline-flex min-h-11 items-center gap-2 font-display text-base font-medium tracking-wide text-muted uppercase transition-[color,letter-spacing] duration-200 ease-out-soft hover:text-text focus-visible:text-text motion-safe:hover:tracking-[0.065em]"
    >
      <ArrowLeft
        className="size-4 transition-transform duration-200 ease-out-soft motion-safe:group-hover:-translate-x-[5px]"
        aria-hidden="true"
      />
      {label}
    </Link>
  )
}
