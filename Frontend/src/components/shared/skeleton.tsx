import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/lib/utils'

// Skeleton shimmer (permintaan pemilik 2026-11-10, DESIGN.md bagian 111): blok abu-abu dengan kilau
// bergerak (kelas .skeleton di globals.css) yang tampil di loading.tsx selama halaman berikutnya
// dimuat. Bentuknya meniru tata letak halaman aslinya. Blok hanya hiasan (aria-hidden); SkeletonPage
// memberi tahu pembaca layar bahwa halaman sedang dimuat.
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden="true" className={cn('skeleton', className)} style={style} />
}

// Beberapa baris teks; baris terakhir lebih pendek seperti paragraf sungguhan.
export function SkeletonLines({
  lines = 3,
  className,
  lineClassName = 'h-3.5',
  last = '60%',
}: {
  lines?: number
  className?: string
  lineClassName?: string
  last?: string
}) {
  return (
    <span aria-hidden="true" className={cn('flex flex-col gap-2.5', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={lineClassName}
          style={i === lines - 1 && lines > 1 ? { width: last } : undefined}
        />
      ))}
    </span>
  )
}

export function SkeletonPage({
  label,
  className,
  children,
}: {
  label: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}
