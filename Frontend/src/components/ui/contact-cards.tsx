'use client'

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { cn } from '@/lib/utils'

// Baris kontak footer (permintaan pemilik 2026-10-08, diadaptasi dari komponen ContactCards yang
// dikirim pemilik): tombol salin email lalu ikon tautan. Saat ikon disorot atau difokus, kartu
// detailnya muncul di atas baris; berpindah antarikon menggeser kartu searah gerakan sementara
// wadahnya berubah ukuran dan posisi, sehingga terasa satu benda, bukan beberapa popup.
// Perbedaan dari aslinya: warna memakai token tema situs, animasi di globals.css (.cc-*), data
// GitHub dikirim dari server (tanpa fetch dari browser ke API pihak ketiga, yang juga diblokir CSP),
// dan semua teks dua bahasa dari footer.

export type ContactCardLink = {
  key: string
  label: string
  href: string
  external: boolean
  icon: ReactNode
  /** Kartu yang tampil saat tautan ini disorot. Beri lebar tetap. */
  card: ReactNode
  /** Disorot seperti kartu CV di footer lama. */
  primary?: boolean
}

type Props = {
  email?: string | null
  links: ContactCardLink[]
  labels: { copy: string; copied: string; newTab: string }
  className?: string
}

export function ContactCards({ email, links, labels, className }: Props) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  // kartu yang sedang diganti, tetap dipasang sampai animasi keluarnya selesai
  const [outgoing, setOutgoing] = useState<{ index: number; direction: number; key: number }>()
  const [entryKey, setEntryKey] = useState(0)
  const [box, setBox] = useState({ left: 0, width: 0, height: 0 })
  // kartu pertama langsung tampil di tempat; baru kartu berikutnya yang berubah dari ukuran sebelumnya
  const [morphing, setMorphing] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([])

  useLayoutEffect(() => {
    const content = contentRef.current
    const link = linkRefs.current[index]
    if (!open || !content || !link) return
    setBox({
      left: link.offsetLeft + link.offsetWidth / 2,
      width: content.offsetWidth,
      height: content.offsetHeight,
    })
  }, [open, index])

  // animationend tidak terpicu saat tab tersembunyi atau gerak dikurangi, jadi kartu lama juga
  // dilepas lewat timer
  useEffect(() => {
    if (!outgoing) return
    const timeout = setTimeout(() => setOutgoing(undefined), 400)
    return () => clearTimeout(timeout)
  }, [outgoing])

  function enter(next: number) {
    if (open && next === index) return
    if (open) {
      setOutgoing({ index, direction: Math.sign(next - index) || 1, key: entryKey })
      setDirection(Math.sign(next - index) || 1)
    }
    setMorphing(open)
    setIndex(next)
    setEntryKey((key) => key + 1)
    setOpen(true)
  }

  function close() {
    setOpen(false)
    setOutgoing(undefined)
    setMorphing(false)
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {email ? <CopyEmailButton email={email} labels={labels} /> : null}

      <div
        className="relative flex"
        onMouseLeave={close}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close()
        }}
      >
        {links.map((link, linkIndex) => (
          <a
            key={link.key}
            ref={(node) => {
              linkRefs.current[linkIndex] = node
            }}
            href={link.href}
            {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            onMouseEnter={() => enter(linkIndex)}
            onFocus={() => enter(linkIndex)}
            className={cn(
              'relative z-10 grid size-11 place-items-center rounded-full transition-colors',
              link.primary ? 'text-text' : 'text-muted hover:text-text focus-visible:text-text',
            )}
          >
            {link.icon}
            <span className="sr-only">
              {link.label}
              {link.external ? ` ${labels.newTab}` : ''}
            </span>
          </a>
        ))}

        <div
          aria-hidden="true"
          // contain: paint menjaga sudut membulat tetap memotong kartu yang beranimasi blur
          style={{ left: box.left, width: box.width, height: box.height, contain: 'paint' }}
          className={cn(
            'absolute bottom-[calc(100%+0.5rem)] z-20 flex origin-bottom items-end overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl',
            morphing
              ? 'transition-[left,width,height,opacity,transform] duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]'
              : 'transition-[opacity,transform] duration-200 ease-out',
            open
              ? '-translate-x-1/2 scale-100 opacity-100'
              : 'pointer-events-none -translate-x-1/2 translate-y-1 scale-[0.97] opacity-0',
            'motion-reduce:transition-none',
          )}
        >
          {outgoing ? (
            <div
              key={`out-${outgoing.key}`}
              onAnimationEnd={(event) => {
                if (event.target === event.currentTarget) setOutgoing(undefined)
              }}
              style={{ '--cc-dir': outgoing.direction } as CSSProperties}
              className="cc-out absolute"
            >
              {links[outgoing.index]?.card}
            </div>
          ) : null}
          <div
            key={`in-${entryKey}`}
            ref={contentRef}
            style={{ '--cc-dir': direction } as CSSProperties}
            className={cn('absolute', morphing && 'cc-in')}
          >
            {links[index]?.card}
          </div>
        </div>

        {/* jembatan kursor, agar kartu tetap terbuka saat kursor bergerak ke arahnya */}
        <div className="absolute inset-0 -top-2" aria-hidden="true" />
      </div>
    </div>
  )
}

// Menyalin tanpa meninggalkan halaman: clipboard API dulu, lalu execCommand (masih bekerja saat
// clipboard API diblokir), dan bila keduanya gagal tombol menampilkan alamatnya untuk disalin manual.
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // lanjut ke cara lama
  }
  try {
    const field = document.createElement('textarea')
    field.value = text
    field.setAttribute('readonly', '')
    field.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
    document.body.append(field)
    field.select()
    const copied = document.execCommand('copy')
    field.remove()
    return copied
  } catch {
    return false
  }
}

export function CopyEmailButton({
  email,
  labels,
}: {
  email: string
  labels: { copy: string; copied: string }
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle')
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timeout.current), [])

  async function copy() {
    const copied = await copyText(email)
    setState(copied ? 'copied' : 'manual')
    clearTimeout(timeout.current)
    timeout.current = setTimeout(() => setState('idle'), copied ? 3000 : 8000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="relative flex min-h-11 cursor-pointer items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-fg transition-[background-color,scale] hover:bg-primary/90 active:scale-95"
    >
      <span
        className={cn(
          'transition-[opacity,filter] duration-500',
          state !== 'idle' && 'opacity-0 blur-[2px]',
        )}
      >
        {labels.copy}
      </span>
      <span
        aria-live="polite"
        className={cn(
          'absolute transition-[opacity,filter] duration-500',
          state === 'idle' && 'opacity-0 blur-[2px]',
        )}
      >
        {state === 'manual' ? email : state === 'copied' ? labels.copied : ''}
      </span>
    </button>
  )
}

export type ContributionDay = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }

// Satu tahun aktivitas dalam grid 7 baris (warna --gh-* sama dengan kalender di beranda), dengan
// keterangan yang tetap di dalam kartu.
export function ContributionGraph({
  weeks,
  locale,
  countLabel,
}: {
  weeks: ContributionDay[][]
  locale: string
  /** "#" diganti jumlah kontribusi pada hari itu, mis. { one: '# contribution', other: '# contributions' } */
  countLabel: { one: string; other: string }
}) {
  const [hovered, setHovered] = useState<{ day: ContributionDay; left: number; top: number }>()
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const formatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone: 'UTC' }),
    [locale],
  )

  // keterangan dijaga tetap di dalam kartu: posisinya dihitung setelah teksnya terpasang
  useLayoutEffect(() => {
    const tooltip = tooltipRef.current
    const container = containerRef.current
    if (!tooltip || !container || !hovered) return
    const half = tooltip.offsetWidth / 2
    const left = Math.min(Math.max(hovered.left, half), container.clientWidth - half)
    tooltip.style.left = `${left}px`
    tooltip.style.top = `${hovered.top}px`
  }, [hovered])

  return (
    <div
      ref={containerRef}
      onPointerOver={(event) => {
        const target = event.target as HTMLElement
        const { date, count, level } = target.dataset
        if (!date) return setHovered(undefined)
        setHovered({
          day: { date, count: Number(count), level: Number(level) as ContributionDay['level'] },
          left: target.offsetLeft + target.offsetWidth / 2,
          top: target.offsetTop,
        })
      }}
      onPointerLeave={() => setHovered(undefined)}
      className="relative flex w-full flex-col gap-2"
    >
      <div
        className="grid grid-flow-col grid-rows-7 gap-[1.5px]"
        style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
      >
        {weeks.flatMap((week, weekIndex) =>
          Array.from({ length: 7 }, (_, dayIndex) => {
            // minggu pertama bisa kurang dari 7 hari: isi dari bawah agar hari tetap sejajar
            const day = weekIndex === 0 ? week[dayIndex - (7 - week.length)] : week[dayIndex]
            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                data-date={day?.date}
                data-count={day?.count}
                data-level={day?.level}
                className={cn('aspect-square w-full rounded-[1.5px]', day && 'cc-day')}
              />
            )
          }),
        )}
      </div>

      <div
        ref={tooltipRef}
        className={cn(
          'pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+0.25rem)] rounded-xl bg-primary px-2 py-1 text-xs whitespace-nowrap text-primary-fg shadow-lg transition-opacity duration-100',
          hovered ? 'opacity-100' : 'opacity-0',
        )}
      >
        {hovered
          ? `${(hovered.day.count === 1 ? countLabel.one : countLabel.other).replace('#', String(hovered.day.count))} · ${formatter.format(new Date(`${hovered.day.date}T00:00:00Z`))}`
          : ''}
      </div>
    </div>
  )
}
