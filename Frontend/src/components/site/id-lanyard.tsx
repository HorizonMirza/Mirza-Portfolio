'use client'

import Image, { type StaticImageData } from 'next/image'
import { type PointerEvent, useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

// Kartu ID bertali di samping form kontak (DESIGN.md bagian 26). Kartu tergantung dari tali dan
// bisa ditarik lalu dilepas: ia berayun dan pelan-pelan diam (pegas teredam, tanpa library).
// Murni hiasan: informasi yang sama ada di halaman lain, jadi disembunyikan dari pembaca layar.

const MAX_ANGLE = 40
const STIFFNESS = 55
const DAMPING = 3.2

// garis barcode yang tetap untuk teks yang sama (bukan kode sungguhan)
function barcode(text: string) {
  let seed = 0
  for (const ch of text) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
  const bars: { x: number; w: number }[] = []
  let x = 0
  while (x < 200) {
    seed = (seed * 1103515245 + 12345) >>> 0
    const w = 1 + (seed % 3)
    const gap = 1 + ((seed >>> 8) % 3)
    bars.push({ x, w })
    x += w + gap
  }
  return bars
}

export function IdLanyard({
  name,
  role,
  status,
  open,
  photo,
  site,
  className,
}: {
  name: string
  role: string | null
  status: string
  open: boolean
  photo: string | StaticImageData
  site: string
  className?: string
}) {
  const rig = useRef<HTMLDivElement>(null)
  const state = useRef({ angle: 0, velocity: 0, dragging: false, frame: 0, last: 0 })
  // menyalakan lagi perulangan animasi saat kartu ditarik (diisi oleh effect di bawah)
  const kick = useRef<() => void>(() => {})

  useEffect(() => {
    const s = state.current
    const render = () => {
      // kelas -translate-x-1/2 memakai properti translate, jadi transform cukup rotasi
      if (rig.current) rig.current.style.transform = `rotate(${s.angle}deg)`
    }
    const step = (now: number) => {
      const dt = Math.min(0.032, (now - (s.last || now)) / 1000)
      s.last = now
      if (!s.dragging) {
        s.velocity += (-STIFFNESS * s.angle - DAMPING * s.velocity) * dt
        s.angle += s.velocity * dt
      }
      render()
      if (s.dragging || Math.abs(s.angle) > 0.05 || Math.abs(s.velocity) > 0.05) {
        s.frame = requestAnimationFrame(step)
      } else {
        s.angle = 0
        s.velocity = 0
        s.frame = 0
        render()
      }
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // ayunan pembuka kecil saat halaman dibuka
    if (!reduce) {
      s.angle = 9
      s.last = 0
      s.frame = requestAnimationFrame(step)
    }
    kick.current = () => {
      if (reduce || s.frame) return
      s.last = 0
      s.frame = requestAnimationFrame(step)
    }
    return () => cancelAnimationFrame(s.frame)
  }, [])

  function angleFromPointer(event: PointerEvent) {
    const el = rig.current
    if (!el) return 0
    const parent = el.parentElement!.getBoundingClientRect()
    const anchorX = parent.left + parent.width / 2
    const anchorY = parent.top
    const deg = (Math.atan2(anchorX - event.clientX, event.clientY - anchorY) * 180) / Math.PI
    return Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, deg))
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const s = state.current
    s.dragging = true
    s.velocity = 0
    kick.current()
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const s = state.current
    if (!s.dragging) return
    const next = angleFromPointer(event)
    s.velocity = (next - s.angle) * 30
    s.angle = next
  }

  function onPointerUp() {
    state.current.dragging = false
  }

  const bars = barcode(name + site)

  return (
    // tinggi kotak menampung tali + kartu (±39rem) agar kartu tidak menempel ke footer saat isi
    // di sampingnya pendek (mis. tiket setelah pesan terkirim)
    <div aria-hidden="true" className={cn('relative z-10 h-[42rem] select-none', className)}>
      <div
        ref={rig}
        className="absolute top-0 left-1/2 flex origin-top -translate-x-1/2 flex-col items-center"
      >
        {/* tali */}
        <div className="h-56 w-3 rounded-b-sm bg-[#4da3ff] shadow-[inset_-2px_0_0_rgb(0_0_0/0.15)]" />
        {/* pengait */}
        <div className="-mt-1 h-5 w-7 rounded-md border-[3px] border-border-strong" />
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="-mt-2 w-52 cursor-grab touch-none rounded-xl border border-white/10 bg-[#111] p-3 text-white shadow-2xl active:cursor-grabbing"
        >
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/80" />
          <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-white/5">
            <Image
              src={photo}
              alt=""
              fill
              sizes="184px"
              draggable={false}
              className="object-cover object-[50%_25%]"
            />
          </div>
          <p className="mt-3 font-display text-xl leading-tight font-bold uppercase">{name}</p>
          {role ? <p className="mt-1 text-xs leading-snug text-white/70">{role}</p> : null}
          <p
            className={cn(
              'mt-2 inline-block rounded-sm px-2 py-0.5 font-mono text-[11px] font-medium uppercase',
              // kartu selalu gelap, jadi pakai Azure versi gelap (kontras tinggi dengan teks hitam)
              open ? 'bg-[#4da3ff] text-black' : 'bg-white/10 text-white/80',
            )}
          >
            {status}
          </p>
          <svg viewBox="0 0 200 28" className="mt-3 h-7 w-full" preserveAspectRatio="none">
            {bars.map((b) => (
              <rect key={b.x} x={b.x} y={0} width={b.w} height={28} fill="currentColor" />
            ))}
          </svg>
          <p className="mt-1.5 text-center font-mono text-[10px] tracking-[0.3em] text-white/60 uppercase">
            {site}
          </p>
        </div>
      </div>
    </div>
  )
}
