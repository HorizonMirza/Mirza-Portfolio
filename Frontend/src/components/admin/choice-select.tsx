'use client'

import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

// Pilihan bergaya aplikasi (revisi pemilik 2026-11-16, Admin → Pengaturan): tombol seperti isian,
// daftar pilihan muncul di bawahnya dengan kotak, sudut, dan sorotan admin, bukan daftar bawaan
// browser. Pola ARIA "select-only combobox": fokus tetap di tombol, pilihan yang disorot diumumkan
// lewat aria-activedescendant. Keyboard: panah atas/bawah, Home/End, Enter/Spasi memilih, Escape
// menutup.
export function ChoiceSelect<V extends string>({
  value,
  options,
  onChange,
  disabled,
  labelledBy,
  describedBy,
  className,
}: {
  value: V
  options: [V, string][]
  onChange: (next: V) => void
  disabled?: boolean
  labelledBy?: string
  describedBy?: string
  className?: string
}) {
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const selected = Math.max(
    0,
    options.findIndex(([v]) => v === value),
  )
  const [active, setActive] = useState(selected)

  // ditekan di luar: daftar menutup tanpa mengubah pilihan
  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  function show() {
    setActive(selected)
    setOpen(true)
  }

  function choose(index: number) {
    const option = options[index]
    setOpen(false)
    if (option && option[0] !== value) onChange(option[0])
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const last = options.length - 1
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault()
        show()
      }
      return
    }
    if (event.key === 'ArrowDown') setActive((i) => Math.min(last, i + 1))
    else if (event.key === 'ArrowUp') setActive((i) => Math.max(0, i - 1))
    else if (event.key === 'Home') setActive(0)
    else if (event.key === 'End') setActive(last)
    else if (event.key === 'Enter' || event.key === ' ') choose(active)
    else if (event.key === 'Escape') setOpen(false)
    else if (event.key === 'Tab') {
      setOpen(false)
      return
    } else return
    event.preventDefault()
  }

  const optionId = (index: number) => `${id}-o${index}`

  return (
    <div ref={root} className={cn('relative w-full sm:w-auto', className)}>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? optionId(active) : undefined}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className="flex min-h-11 w-full min-w-44 items-center justify-between gap-3 rounded-md border border-border-strong bg-surface px-3 text-left text-base text-text hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">{options[selected]?.[1]}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn('size-4 shrink-0 text-muted transition-transform', open && 'rotate-180')}
        />
      </button>
      <ul
        id={`${id}-list`}
        role="listbox"
        aria-labelledby={labelledBy}
        hidden={!open}
        // latar pekat (bg), bukan --surface admin yang tembus pandang (kaca), agar baris di bawahnya
        // tidak terlihat menembus daftar
        className="absolute top-full right-0 z-30 mt-2 flex w-max min-w-full flex-col gap-0.5 rounded-xl border border-border-strong bg-bg p-1 shadow-xl"
      >
        {options.map(([v, label], index) => (
          <li
            key={v}
            id={optionId(index)}
            role="option"
            aria-selected={index === selected}
            // tetikus: sorotan mengikuti kursor; klik memilih (mousedown dicegah agar fokus tetap di tombol)
            onPointerMove={() => setActive(index)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(index)}
            className={cn(
              'flex min-h-10 cursor-pointer items-center justify-between gap-4 rounded-lg px-3 text-sm',
              index === active ? 'bg-surface-2 text-text' : 'text-muted',
              index === selected && 'font-semibold text-text',
            )}
          >
            {label}
            {index === selected ? <Check aria-hidden="true" className="size-4" /> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
