'use client'

// Bingkai layar untuk pratinjau 1:1 di admin:
// isi dirender seukuran jendela browser admin (lebar dan tinggi layar yang sama dengan pengunjung
// di perangkat ini), memakai markup dan kelas situs yang sama, lalu diperkecil (transform) agar pas
// selebar panel. Media query tetap membaca layar sungguhan dan container query membaca isi bingkai,
// jadi hasilnya sama persis dengan situs, hanya lebih kecil. Huruf situs (Oswald) dipulihkan lewat
// .site-ui (styles/admin/panel.css).

import { type ReactNode, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

type Box = { width: number; height: number; scale: number }

export function SiteFrame({
  children,
  className,
  autoHeight = false,
}: {
  children: ReactNode
  className?: string
  // tinggi mengikuti isi (bukan tinggi layar): bagian yang lebih tinggi dari layar, mis. grafik GitHub
  // tampilan 3D, tidak terpotong
  autoHeight?: boolean
}) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number | null>(null)
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

  useEffect(() => {
    const el = inner.current
    if (!autoHeight || !el) return
    const measure = () => setContentHeight(el.offsetHeight)
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [autoHeight])

  const frameHeight = autoHeight ? (contentHeight ?? box?.height ?? 0) : box?.height

  return (
    <div
      ref={outer}
      className={cn('site-frame admin-bleed relative overflow-hidden rounded-md', className)}
      style={box && frameHeight ? { height: frameHeight * box.scale } : { aspectRatio: '16 / 9' }}
    >
      <div
        ref={inner}
        className="site-ui absolute top-0 left-0 origin-top-left overflow-hidden bg-bg text-text"
        style={
          box
            ? {
                width: box.width,
                height: autoHeight ? 'auto' : box.height,
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
