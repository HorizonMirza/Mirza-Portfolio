'use client'

import { type PointerEvent, type ReactNode, useRef } from 'react'

import { playPhotoShimmerSound } from '@/lib/ui-sounds'

// Kemiringan maksimum kartu (derajat) saat kursor di tepi kartu (bawaan; bisa diubah lewat prop).
const MAX_TILT = 12
// Suara kilau saat kursor bergeser di kartu: satu nada tiap 190 ms (lambat dan halus, revisi
// pemilik 2026-10-08) selama kursor berpindah minimal 6 px; nada berikutnya melanjutkan urutan.
const SOUND_GAP_MS = 190
const SOUND_MIN_MOVE = 6

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Kartu foto halaman Tentang yang bisa "dipegang" (revisi pemilik 2026-10-07, mengikuti video
// contoh): kartu miring 3D mengikuti kursor, cahaya lembut ikut bergerak di atas foto, chip kampus
// dan bendera melayang lebih dekat (translateZ), dan kartu sedikit mengecil saat
// ditekan. Saat kursor keluar, kartu kembali tegak perlahan. Di layar sentuh kartu bereaksi saat
// disentuh/digeser ke samping; geser ke atas-bawah tetap menggulir halaman.
// Hanya mengubah variabel CSS lewat requestAnimationFrame (transform dikerjakan GPU, globals.css
// .ab-tilt). Reduced-motion: kartu diam (suara tetap). Suara kilau (pilihan pemilik 2026-10-08,
// demo B1, diperhalus) mengalir selama kursor bergeser di kartu dan berhenti saat kursor diam.
// Dipakai juga untuk gambar project (pilihan pemilik 2026-10-08, demo efek nomor 1) dengan kelas
// pembungkus sendiri; `touch={false}` mematikan kemiringan di layar sentuh (mis. galeri yang digeser).
export function PhotoTilt({
  children,
  className = 'ab-tilt',
  maxTilt = MAX_TILT,
  touch = true,
}: {
  children: ReactNode
  className?: string
  maxTilt?: number
  touch?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const rect = useRef<DOMRect | null>(null)
  const frame = useRef(0)
  const pressed = useRef(false)
  const lastSound = useRef({ at: 0, x: 0, y: 0 })

  function shimmer(event: PointerEvent<HTMLDivElement>, force = false) {
    const last = lastSound.current
    const now = performance.now()
    const moved = Math.hypot(event.clientX - last.x, event.clientY - last.y)
    if (!force && (now - last.at < SOUND_GAP_MS || moved < SOUND_MIN_MOVE)) return
    lastSound.current = { at: now, x: event.clientX, y: event.clientY }
    playPhotoShimmerSound()
  }

  function apply(vars: Record<string, string>) {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      for (const [key, value] of Object.entries(vars)) el.style.setProperty(key, value)
    })
  }

  function follow(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch' && (!touch || !pressed.current)) return
    shimmer(event)
    if (reducedMotion()) return
    const r = (rect.current ??= event.currentTarget.getBoundingClientRect())
    const x = Math.min(1, Math.max(0, (event.clientX - r.left) / r.width))
    const y = Math.min(1, Math.max(0, (event.clientY - r.top) / r.height))
    if (ref.current) ref.current.dataset.tilt = 'on'
    apply({
      '--tilt-x': `${((0.5 - y) * 2 * maxTilt).toFixed(2)}deg`,
      '--tilt-y': `${((x - 0.5) * 2 * maxTilt).toFixed(2)}deg`,
      '--glare-x': `${(x * 100).toFixed(1)}%`,
      '--glare-y': `${(y * 100).toFixed(1)}%`,
      '--glare-o': '1',
    })
  }

  function reset() {
    pressed.current = false
    rect.current = null
    if (ref.current) ref.current.dataset.tilt = 'off'
    apply({ '--tilt-x': '0deg', '--tilt-y': '0deg', '--tilt-s': '1', '--glare-o': '0' })
  }

  return (
    <div
      ref={ref}
      className={className}
      data-tilt="off"
      onPointerEnter={(e) => {
        rect.current = e.currentTarget.getBoundingClientRect()
        if (e.pointerType !== 'touch') shimmer(e, true)
      }}
      onPointerMove={follow}
      onPointerDown={(e) => {
        if (e.pointerType === 'touch' && !touch) return
        if (e.pointerType === 'touch') shimmer(e, true)
        if (reducedMotion()) return
        pressed.current = true
        rect.current = e.currentTarget.getBoundingClientRect()
        apply({ '--tilt-s': '0.97' })
        follow(e)
      }}
      onPointerUp={(e) => {
        if (e.pointerType === 'touch') return reset()
        pressed.current = false
        apply({ '--tilt-s': '1' })
      }}
      onPointerLeave={reset}
      onPointerCancel={reset}
    >
      {children}
    </div>
  )
}
