'use client'

// Globe skill di beranda: logo skill
// di permukaan bola bergaris lintang-bujur. Bola berputar pelan, bisa digeser (mouse atau jari ke
// samping), dan logo yang ditekan diputar ke depan lalu rinciannya tampil di bawah. Menu kategori
// meredupkan kategori lain. Logo adalah tombol toggle biasa (Enter/Spasi, panah kiri/kanan); hanya
// garis bola yang digambar di canvas. Posisi awal sudah dihitung di server, jadi tanpa JavaScript bola
// tetap tampil.
// Reduced-motion: tanpa putaran otomatis dan tanpa animasi saat berpindah logo.

import {
  type CSSProperties,
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

import { cn } from '@/lib/utils'

import type { SkillItem } from '@backend/features/skills/skill-items'

import { createGlobeEngine, type GlobeEngine } from './engine'
import { Glyph } from './glyph'
import {
  densityScale,
  itemStyle,
  SCROLL_RELEASE,
  spherePoints,
  START_PITCH,
  START_YAW,
} from './math'

// satu warna untuk semua kategori: biru situs
const RING_COLOR = 'var(--note)'

export function SkillGlobe({
  items,
  categories,
  labels,
  className,
}: {
  items: SkillItem[]
  categories: string[]
  labels: {
    globe: string
    list: string
    categories: string
    category: string
    all: string
  }
  className?: string
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const points = useMemo(() => spherePoints(items.length), [items.length])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [category, setCategory] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const panelId = useId()
  // jembatan dari handler React ke loop animasi di effect
  const controls = useRef<GlobeEngine | null>(null)
  const activeRef = useRef<number | null>(null)
  // salinan untuk loop animasi di effect
  const pointsRef = useRef(points)
  useEffect(() => {
    pointsRef.current = points
    controls.current?.wake()
  }, [points])
  useEffect(() => {
    activeRef.current = activeIndex
    controls.current?.wake()
  }, [activeIndex])
  // keadaan kategori (menonjol/redup) digambar canvas: gambar ulang juga saat bola diam (reduced-motion)
  useEffect(() => {
    controls.current?.wake()
  }, [category])

  useEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!stage || !canvas) return
    const engine = createGlobeEngine({ stage, canvas, itemRefs, pointsRef, activeRef })
    controls.current = engine
    return () => {
      engine?.destroy()
      controls.current = null
    }
  }, [])

  function select(index: number) {
    activeRef.current = index
    setActiveIndex(index)
    controls.current?.face(index)
  }

  // lepas pilihan: bola kembali ke kemiringan awal lalu berputar lagi
  function release() {
    activeRef.current = null
    setActiveIndex(null)
    controls.current?.home()
  }

  // Selama ada logo terpilih: scroll, tekan di mana saja (selain logo lain dan panel rincian), atau Esc
  // melepas pilihan sehingga bola berputar lagi. Scroll kecil (mis. fokus Tab yang menggeser layar)
  // diabaikan.
  useEffect(() => {
    if (activeIndex === null) return
    const startY = window.scrollY
    const panel = document.getElementById(panelId)
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > SCROLL_RELEASE) release()
    }
    const onPointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target as Element | null
      if (target?.closest('.globe-item') || (panel && target && panel.contains(target))) return
      release()
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') release()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [activeIndex, panelId])

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number | null = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = index + 1
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = index - 1
    if (next === null) return
    event.preventDefault()
    const target = (next + items.length) % items.length
    const el = itemRefs.current[target]
    if (!el) return
    // logo tujuan bisa sedang di belakang (inert): pilih dan putar ke depan dulu, baru difokus
    select(target)
    el.inert = false
    el.focus()
  }

  // null = semua kategori
  function chooseCategory(next: number | null) {
    setCategory(next)
    setMenuOpen(false)
    release()
    if (next === null) return
    const first = items.findIndex((item) => item.categoryIndex === next)
    if (first >= 0) controls.current?.face(first)
  }

  // Menu kategori (menu tarik): tutup saat menekan di
  // luar menu atau Esc (fokus kembali ke tombolnya)
  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      filterRef.current?.querySelector<HTMLButtonElement>('.globe-filter-toggle')?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const active = activeIndex === null ? null : items[activeIndex]
  // posisi awal (sama di server dan klien), selanjutnya diperbarui langsung oleh loop animasi
  const initial = points.map((p) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- back hanya dipakai loop animasi
    const { back, ...style } = itemStyle(p, START_YAW, START_PITCH, densityScale(points.length))
    return style
  })

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div ref={stageRef} role="group" aria-label={labels.globe} className="globe-stage">
        <canvas ref={canvasRef} aria-hidden="true" className="globe-canvas" />
        {items.map((item, i) => (
          <button
            key={item.id}
            ref={(el) => {
              itemRefs.current[i] = el
            }}
            type="button"
            className="globe-item"
            data-active={i === activeIndex ? '' : undefined}
            data-dim={category !== null && item.categoryIndex !== category ? '' : undefined}
            data-hl={category !== null && item.categoryIndex === category ? '' : undefined}
            aria-pressed={i === activeIndex}
            aria-controls={panelId}
            // nama lewat aria-label, bukan teks sr-only: logo yang sedang berputar ke tepi bola dianggap
            // di luar layar oleh pemeriksa aksesibilitas sehingga teks sr-only di dalamnya tidak terhitung
            aria-label={`${item.name}, ${item.category}`}
            // sebelum JavaScript menghitung tumpang-tindih, logo belum bisa dipakai: semua inert
            inert
            style={
              {
                ...initial[i],
                '--cat': RING_COLOR,
                '--logo': item.logoColor ?? 'currentColor',
              } as CSSProperties
            }
            // tekan ulang logo yang sedang terpilih: lepas, bola berputar lagi
            onClick={() => (i === activeIndex ? release() : select(i))}
            onKeyDown={(event) => onKeyDown(event, i)}
          >
            <span className="globe-logo">
              <Glyph item={item} />
            </span>
            <span className="globe-name" aria-hidden="true">
              {item.name}
            </span>
          </button>
        ))}
      </div>

      {/* logo di sisi belakang inert, jadi daftar lengkap disediakan untuk pembaca layar */}
      <ul className="sr-only" aria-label={labels.list}>
        {items.map((item) => (
          <li key={item.id}>
            {item.name}, {item.category}
          </li>
        ))}
      </ul>

      {categories.length > 1 ? (
        <div ref={filterRef} className="globe-filter" data-open={menuOpen ? '' : undefined}>
          <button
            type="button"
            className="globe-filter-toggle"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="globe-filter-label">{labels.category}</span>
            {category === null ? labels.all : categories[category]}
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
          <div
            id={menuId}
            role="group"
            aria-label={labels.categories}
            className="globe-filter-menu"
          >
            {[null, ...categories.map((_, i) => i)].map((index) => (
              <button
                key={index ?? 'all'}
                type="button"
                aria-pressed={category === index}
                onClick={() => chooseCategory(index)}
              >
                {index === null ? labels.all : categories[index]}
                <span className="globe-filter-count">
                  {index === null
                    ? items.length
                    : items.filter((item) => item.categoryIndex === index).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* tinggi minimum memberi ruang menu kategori yang terbuka ke bawah, agar tidak melewati garis
          bagian berikutnya */}
      <div id={panelId} className="mt-6 min-h-36 text-center md:min-h-32">
        {active ? (
          <>
            <p className="font-display text-2xl font-bold uppercase sm:text-3xl">{active.name}</p>
            <p className="mt-1 font-mono text-label tracking-widest text-muted uppercase">
              {active.category}
            </p>
          </>
        ) : null}
      </div>
    </div>
  )
}
