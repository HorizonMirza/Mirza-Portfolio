'use client'

import { FileSpreadsheet, Megaphone, SquareKanban, Users } from 'lucide-react'
import { type CSSProperties, type KeyboardEvent, useId, useRef, useState } from 'react'

import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

import type { GenericGlyph, Keycap } from '../keycaps'

const GENERIC_ICONS = {
  kanban: SquareKanban,
  users: Users,
  megaphone: Megaphone,
  sheet: FileSpreadsheet,
} satisfies Record<GenericGlyph, unknown>

function Glyph({ keycap }: { keycap: Keycap }) {
  if (keycap.glyph?.kind === 'brand') {
    return (
      <svg viewBox="0 0 24 24" className="kb-glyph" fill="currentColor" aria-hidden="true">
        <path d={keycap.glyph.path} />
      </svg>
    )
  }
  if (keycap.glyph?.kind === 'generic') {
    const Icon = GENERIC_ICONS[keycap.glyph.name]
    return <Icon className="kb-glyph" strokeWidth={2.25} aria-hidden="true" />
  }
  return (
    <span className="font-mono text-xs font-bold" aria-hidden="true">
      {keycap.label}
    </span>
  )
}

// jumlah kolom: keyboard mendekati persegi panjang mendatar, HP maksimal 4 kolom agar muat 360 px
function columns(count: number) {
  const lg = Math.min(7, Math.max(3, Math.ceil(Math.sqrt(count * 1.6))))
  return { lg, sm: Math.min(4, lg) }
}

// Keyboard 3D berisi skill: tiap tombol satu skill dengan logo dan warna brand-nya. Tombol yang disorot
// (arahkan kursor, fokus, atau tekan) turun seperti ditekan dan rinciannya tampil di panel.
// 3D murni CSS (globals.css .kb-*), tanpa library. Keyboard fisik: panah kiri/kanan berpindah tombol,
// mengetik huruf melompat ke skill berawalan huruf itu.
export function SkillKeyboard({
  keycaps,
  labels,
  className,
}: {
  keycaps: Keycap[]
  labels: { keyboard: string; hint: string; usedIn: string }
  className?: string
}) {
  const [activeId, setActiveId] = useState(keycaps[0]?.id)
  const refs = useRef(new Map<string, HTMLButtonElement>())
  const panelId = useId()
  const active = keycaps.find((k) => k.id === activeId) ?? keycaps[0]
  if (!active) return null
  const cols = columns(keycaps.length)

  function focusAt(index: number) {
    const next = keycaps[(index + keycaps.length) % keycaps.length]
    refs.current.get(next.id)?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      focusAt(index + 1)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      focusAt(index - 1)
    } else if (/^\p{L}$/u.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const letter = event.key.toLowerCase()
      const order = [...keycaps.slice(index + 1), ...keycaps.slice(0, index + 1)]
      const match = order.find((k) => k.name.toLowerCase().startsWith(letter))
      if (match) refs.current.get(match.id)?.focus()
    }
  }

  return (
    <div
      className={cn(
        'grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-12',
        className,
      )}
    >
      <div className="kb-stage lg:order-2">
        <div
          role="group"
          aria-label={labels.keyboard}
          className="kb"
          style={{ '--cols-sm': cols.sm, '--cols-lg': cols.lg } as CSSProperties}
        >
          {keycaps.map((k, i) => (
            <button
              key={k.id}
              ref={(el) => {
                if (el) refs.current.set(k.id, el)
                else refs.current.delete(k.id)
              }}
              type="button"
              className="kb-key"
              data-active={k.id === active.id ? '' : undefined}
              aria-current={k.id === active.id ? 'true' : undefined}
              aria-controls={panelId}
              title={k.name}
              style={{ '--cap': k.color, '--ink': k.ink } as CSSProperties}
              onPointerEnter={() => setActiveId(k.id)}
              onFocus={() => setActiveId(k.id)}
              onClick={() => setActiveId(k.id)}
              onKeyDown={(event) => onKeyDown(event, i)}
            >
              <span className="kb-cap">
                <Glyph keycap={k} />
              </span>
              <span className="sr-only">
                {k.name}, {k.category}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div id={panelId} className="kb-panel min-h-40 lg:order-1">
        <p className="font-mono text-label tracking-widest text-note uppercase">
          {active.category}
        </p>
        <p className="kb-title mt-2 font-display font-bold uppercase">{active.name}</p>
        {active.projects.length > 0 ? (
          <p className="mt-3 text-sm text-muted">
            {labels.usedIn}{' '}
            {active.projects.map((p, j) => (
              <span key={p.slug}>
                {j > 0 ? ', ' : null}
                <Link
                  href={`/projects/${p.slug}`}
                  className="text-primary underline underline-offset-4"
                >
                  {p.title}
                </Link>
              </span>
            ))}
          </p>
        ) : null}
        <p className="mt-6 font-mono text-xs text-muted">{labels.hint}</p>
      </div>
    </div>
  )
}
