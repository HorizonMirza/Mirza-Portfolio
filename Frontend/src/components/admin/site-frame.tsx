'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

type Box = { width: number; height: number; scale: number }

// Bingkai layar untuk pratinjau 1:1 di admin (permintaan pemilik 2026-11-12, DESIGN.md bagian 141):
// isi dirender seukuran jendela browser admin (lebar dan tinggi layar yang sama dengan pengunjung
// di perangkat ini), memakai markup dan kelas situs yang sama, lalu diperkecil (transform) agar pas
// selebar panel. Media query tetap membaca layar sungguhan dan container query membaca isi bingkai,
// jadi hasilnya sama persis dengan situs, hanya lebih kecil. Huruf situs (Oswald) dipulihkan lewat
// .site-ui (globals.css).
export function SiteFrame({ children, className }: { children: ReactNode; className?: string }) {
  const outer = useRef<HTMLDivElement>(null)
  // null sampai diukur di browser: sebelum itu bingkai 16:9 tanpa isi agar tidak berkedip
  const [box, setBox] = useState<Box | null>(null)

  useEffect(() => {
    const el = outer.current
    if (!el) return
    const measure = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setBox({ width, height, scale: el.clientWidth / width })
    }
    // ResizeObserver memanggil measure sekali saat mulai mengamati
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <div
      ref={outer}
      className={cn('site-frame admin-bleed relative overflow-hidden rounded-md', className)}
      style={box ? { height: box.height * box.scale } : { aspectRatio: '16 / 9' }}
    >
      <div
        className="site-ui absolute top-0 left-0 origin-top-left overflow-hidden bg-bg text-text"
        style={
          box
            ? {
                width: box.width,
                height: box.height,
                transform: `scale(${box.scale})`,
              }
            : { visibility: 'hidden' }
        }
      >
        {children}
      </div>
    </div>
  )
}
