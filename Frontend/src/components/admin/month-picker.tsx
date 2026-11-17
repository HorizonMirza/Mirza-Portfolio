'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useAdminT } from '@/components/admin/admin-lang'
import type { Lang } from '@/components/admin/live-edit'
import { formatMonth } from '@/lib/localized'
import { cn } from '@/lib/utils'

const FIRST_YEAR = 1990
const WIDTH = 272

// Bulan mulai/selesai: tampil seperti di situs ("Jul 2026", bahasa isi yang dipilih). Ditekan membuka
// kalender kecil bergaya aplikasi (tahun dengan panah, 12 bulan sebagai tombol), bukan dropdown bawaan
// browser (revisi pemilik 2026-11-16). Kalender digambar di body agar tidak ikut diperkecil oleh
// bingkai pratinjau dan tidak terpotong.
export function MonthPicker({
  label,
  value,
  lang,
  invalid,
  onChange,
}: {
  label: string
  value: string
  lang: Lang
  invalid: boolean
  onChange: (value: string) => void
}) {
  const t = useAdminT()
  const id = useId()
  const trigger = useRef<HTMLButtonElement | null>(null)
  const panel = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const valid = /^\d{4}-\d{2}$/.test(value)
  const now = new Date()
  const lastYear = now.getFullYear() + 1
  const [selYear, selMonth] = valid
    ? [Number(value.slice(0, 4)), value.slice(5, 7)]
    : [now.getFullYear(), '']
  // tahun yang sedang dilihat di kalender
  const [year, setYear] = useState(selYear)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  function show() {
    const rect = trigger.current?.getBoundingClientRect()
    if (rect) {
      const height = 236
      const below = rect.bottom + 8
      const top = below + height > window.innerHeight ? Math.max(8, rect.top - height - 8) : below
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - WIDTH - 8)
      setPos({ top, left })
    }
    setYear(selYear)
    setOpen(true)
  }

  function close(returnFocus: boolean) {
    setOpen(false)
    if (returnFocus) trigger.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    // fokus ke bulan terpilih (atau bulan pertama)
    const target =
      panel.current?.querySelector<HTMLElement>('[aria-pressed="true"]') ??
      panel.current?.querySelector<HTMLElement>('[data-month]')
    target?.focus()
    const onPointer = (event: PointerEvent) => {
      const node = event.target as Node
      if (panel.current?.contains(node) || trigger.current?.contains(node)) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        close(true)
      }
    }
    // digulir atau ukuran berubah: kalender menutup agar tidak melayang jauh dari tombolnya
    const onMove = () => setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('resize', onMove)
      window.removeEventListener('scroll', onMove, true)
    }
  }, [open])

  const months = Array.from({ length: 12 }, (_, i) => {
    const mm = String(i + 1).padStart(2, '0')
    return {
      mm,
      name: new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', {
        month: 'short',
        timeZone: 'UTC',
      }).format(new Date(Date.UTC(2000, i, 1))),
    }
  })

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => (open ? close(false) : show())}
        className={cn(
          'admin-editable inline-flex min-h-6 items-center rounded-none px-0.5',
          invalid && 'admin-inline-bad',
        )}
      >
        <span className="sr-only">{label}: </span>
        {valid ? formatMonth(value, lang) : '----'}
      </button>
      {open
        ? createPortal(
            <div
              ref={panel}
              id={id}
              role="dialog"
              aria-label={t('{label} (Bulan dan Tahun)', { label })}
              style={{ top: pos.top, left: pos.left, width: WIDTH }}
              className="fixed z-[70] rounded-lg border border-border bg-surface p-3 font-sans text-text shadow-xl"
            >
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  aria-label={t('Tahun Sebelumnya')}
                  disabled={year <= FIRST_YEAR}
                  onClick={() => setYear((y) => y - 1)}
                  className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-text disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </button>
                <span className="text-sm font-semibold tabular-nums" aria-live="polite">
                  {year}
                </span>
                <button
                  type="button"
                  aria-label={t('Tahun Berikutnya')}
                  disabled={year >= lastYear}
                  onClick={() => setYear((y) => y + 1)}
                  className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-text disabled:opacity-40"
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {months.map((m) => {
                  const selected = year === selYear && m.mm === selMonth
                  return (
                    <button
                      key={m.mm}
                      type="button"
                      data-month={m.mm}
                      aria-pressed={selected}
                      aria-label={`${m.name} ${year}`}
                      onClick={() => {
                        onChange(`${year}-${m.mm}`)
                        close(true)
                      }}
                      className={cn(
                        'min-h-9 rounded-md border text-sm font-medium transition-colors',
                        selected
                          ? 'border-text bg-text text-bg'
                          : 'border-transparent text-text hover:border-border hover:bg-surface-2',
                      )}
                    >
                      {m.name}
                    </button>
                  )
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
