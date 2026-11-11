'use client'

import { RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import {
  createContext,
  type CSSProperties,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import { useAdminT } from '@/components/admin/admin-lang'
import { cn } from '@/lib/utils'

// Tampilan kaca panel admin (pilihan pemilik 2026-11-11, demo 5+, DESIGN.md bagian 112): blur,
// kepekatan, cahaya tepi, dan latar. Diadaptasi dari komponen rujukan "Adjustable Glass Dashboard"
// tanpa GSAP (aturan proyek: tanpa library animasi) dan tanpa gambar dari luar (CSP).
// Tersimpan di browser pemilik; nilai di luar batas dikembalikan ke bawaan.

export type GlassBackground = 'gradient' | 'commit' | 'plain'
export type GlassSettings = { blur: number; opacity: number; edge: number; bg: GlassBackground }

export const GLASS_DEFAULT: GlassSettings = { blur: 22, opacity: 0.42, edge: 0.6, bg: 'gradient' }
const PRESETS: Record<string, Omit<GlassSettings, 'bg'>> = {
  Bening: { blur: 8, opacity: 0.16, edge: 0.8 },
  Buram: { blur: 22, opacity: 0.42, edge: 0.6 },
  Padat: { blur: 32, opacity: 0.82, edge: 0.35 },
}
const BACKGROUNDS: { id: GlassBackground; label: string }[] = [
  { id: 'gradient', label: 'Gradasi' },
  { id: 'commit', label: 'Kotak commit' },
  { id: 'plain', label: 'Polos' },
]
const STORAGE_KEY = 'mmirza-admin-glass'
const listeners = new Set<() => void>()

const clamp = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback

export function parseGlass(raw: string | null): GlassSettings {
  if (!raw) return GLASS_DEFAULT
  try {
    const v = JSON.parse(raw) as Partial<GlassSettings>
    return {
      blur: clamp(v.blur, 0, 40, GLASS_DEFAULT.blur),
      opacity: clamp(v.opacity, 0.08, 0.9, GLASS_DEFAULT.opacity),
      edge: clamp(v.edge, 0, 1, GLASS_DEFAULT.edge),
      bg: BACKGROUNDS.some((b) => b.id === v.bg) ? (v.bg as GlassBackground) : GLASS_DEFAULT.bg,
    }
  } catch {
    return GLASS_DEFAULT
  }
}

function read(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  window.addEventListener('storage', onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

function save(next: GlassSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // penyimpanan diblokir: tampilan kembali ke bawaan saat halaman dimuat ulang
  }
  listeners.forEach((listener) => listener())
}

const Ctx = createContext<GlassSettings>(GLASS_DEFAULT)

// Pembungkus seluruh panel admin: memasang variabel --g-* dan latar di belakang kaca.
export function AdminGlassShell({ children }: { children: ReactNode }) {
  const raw = useSyncExternalStore(subscribe, read, () => null)
  const glass = useMemo(() => parseGlass(raw), [raw])
  const style = {
    '--g-blur': `${glass.blur}px`,
    '--g-op': glass.opacity,
    '--g-edge': glass.edge,
  } as CSSProperties
  return (
    <Ctx.Provider value={glass}>
      <div className="admin-glass min-h-dvh p-3 md:p-4" data-glass-bg={glass.bg} style={style}>
        <div aria-hidden="true" className="admin-glass-bg" />
        {children}
      </div>
    </Ctx.Provider>
  )
}

function Range({
  id,
  label,
  value,
  output,
  min,
  max,
  step,
  onChange,
}: {
  id: string
  label: string
  value: number
  output: string
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex justify-between text-xs font-semibold">
        {label}
        <output htmlFor={id} className="font-mono font-normal text-muted">
          {output}
        </output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[var(--text)]"
      />
    </div>
  )
}

// Tombol "Atur kaca" di top bar beserta panelnya.
export function GlassControl() {
  const t = useAdminT()
  const glass = useContext(Ctx)
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const id = useId()

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Escape') {
          setOpen(false)
          trigger.current?.focus()
        }
      } else if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const update = (patch: Partial<GlassSettings>) => save({ ...glass, ...patch })
  const preset = Object.entries(PRESETS).find(
    ([, p]) => p.blur === glass.blur && p.opacity === glass.opacity && p.edge === glass.edge,
  )?.[0]

  return (
    <div ref={root} className="relative flex shrink-0">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors hover:bg-surface-2',
          open && 'bg-surface-2',
        )}
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        <span className="max-md:sr-only">{t('Atur kaca')}</span>
      </button>
      {open ? (
        <div
          id={panelId}
          role="group"
          aria-label={t('Tampilan kaca')}
          className="admin-pop fixed inset-x-3 top-20 z-40 flex flex-col gap-4 rounded-[22px] border border-border p-5 shadow-2xl sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-3 sm:w-80"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-semibold">{t('Tampilan kaca')}</p>
            <button
              type="button"
              aria-label={t('Tutup pengaturan kaca')}
              onClick={() => {
                setOpen(false)
                trigger.current?.focus()
              }}
              className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-text"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <p className="-mt-2 text-xs text-muted">
            {t('Berlaku di seluruh panel admin dan tersimpan di browser ini.')}
          </p>
          <div
            aria-hidden="true"
            className="admin-glass-panel grid h-16 place-items-center rounded-xl text-xs"
          >
            {t('Contoh material')}
          </div>
          <div className="grid grid-cols-3 gap-1.5" role="group" aria-label={t('Preset kaca')}>
            {Object.entries(PRESETS).map(([name, value]) => (
              <button
                key={name}
                type="button"
                aria-pressed={preset === name}
                onClick={() => update(value)}
                className="min-h-9 rounded-lg border border-border text-xs font-semibold aria-pressed:border-transparent aria-pressed:bg-text aria-pressed:text-bg"
              >
                {t(name)}
              </button>
            ))}
          </div>
          <Range
            id={`${id}-blur`}
            label="Blur"
            value={glass.blur}
            output={`${glass.blur} px`}
            min={0}
            max={40}
            step={1}
            onChange={(blur) => update({ blur })}
          />
          <Range
            id={`${id}-opacity`}
            label={t('Kepekatan')}
            value={Math.round(glass.opacity * 100)}
            output={`${Math.round(glass.opacity * 100)}%`}
            min={8}
            max={90}
            step={1}
            onChange={(value) => update({ opacity: value / 100 })}
          />
          <Range
            id={`${id}-edge`}
            label={t('Cahaya tepi')}
            value={Math.round(glass.edge * 100)}
            output={`${Math.round(glass.edge * 100)}%`}
            min={0}
            max={100}
            step={5}
            onChange={(value) => update({ edge: value / 100 })}
          />
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold">{t('Latar')}</p>
            <div
              role="group"
              aria-label={t('Latar panel admin')}
              className="grid grid-cols-3 gap-1 rounded-full border border-border bg-surface-2 p-1"
            >
              {BACKGROUNDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={glass.bg === b.id}
                  onClick={() => update({ bg: b.id })}
                  className="min-h-8 rounded-full px-2 text-xs font-semibold text-muted aria-pressed:bg-text aria-pressed:text-bg"
                >
                  {t(b.label)}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => save(GLASS_DEFAULT)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border text-xs font-semibold hover:bg-surface-2"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            {t('Atur ulang tampilan')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
