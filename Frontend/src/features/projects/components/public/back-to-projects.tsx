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
      onClick={() => markReturnToList(slug)}
      // huruf display situs (Oswald) seperti judul bagian (revisi pemilik 2026-10-08)
      className="inline-flex min-h-11 items-center gap-2 font-display text-base font-medium tracking-wide text-muted uppercase hover:text-text"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {label}
    </Link>
  )
}
