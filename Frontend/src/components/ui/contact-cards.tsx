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

// Kartu kontak footer dengan kartu detail saat disorot (permintaan pemilik 2026-10-08, diadaptasi
// dari komponen ContactCards yang dikirim pemilik). Daftar kartu tetap seperti footer sebelumnya;
// yang baru hanya saat kursor berada di atas sebuah kartu: kartu detailnya muncul di atasnya, dan
// berpindah antarkartu menggeser isinya searah gerakan sementara wadahnya berubah ukuran dan
// posisi, sehingga terasa satu benda, bukan beberapa popup. Hanya untuk perangkat dengan hover
// (HP tidak berubah). Warna memakai token tema situs, animasi di globals.css (.cc-*).

export type ContactCardLink = {
  key: string
  href: string
  external: boolean
  /** Isi kartu di daftar (ikon, nama, nilai) dan kelas tautannya. */
  trigger: ReactNode
  className: string
  /** Kartu detail yang tampil saat kartu ini disorot. Beri lebar tetap. */
  card: ReactNode
}

function canHover() {
  return window.matchMedia('(hover: hover)').matches
}

export function ContactCards({
  links,
  className,
}: {
  links: ContactCardLink[]
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  // kartu yang sedang diganti, tetap dipasang sampai animasi keluarnya selesai
  const [outgoing, setOutgoing] = useState<{ index: number; direction: number; key: number }>()
  const [entryKey, setEntryKey] = useState(0)
  const [box, setBox] = useState({ left: 0, top: 0, width: 0, height: 0 })
  // kartu pertama langsung tampil di tempat; baru kartu berikutnya yang berubah dari ukuran sebelumnya
  const [morphing, setMorphing] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([])

  // kartu detail berada di atas kartu yang disorot, tengahnya sejajar tengah kartu itu, dan tidak
  // keluar dari tepi daftar
  useLayoutEffect(() => {
    const content = contentRef.current
    const link = linkRefs.current[index]
    const list = link?.closest('ul')
    if (!open || !content || !link || !list) return
    const width = content.offsetWidth
    const center = link.offsetLeft + link.offsetWidth / 2
    const left = Math.min(
      Math.max(center, width / 2),
      Math.max(width / 2, list.clientWidth - width / 2),
    )
    setBox({ left, top: link.offsetTop, width, height: content.offsetHeight })
  }, [open, index])

  // animationend tidak terpicu saat tab tersembunyi atau gerak dikurangi, jadi kartu lama juga
  // dilepas lewat timer
  useEffect(() => {
    if (!outgoing) return
    const timeout = setTimeout(() => setOutgoing(undefined), 400)
    return () => clearTimeout(timeout)
  }, [outgoing])

  function enter(next: number) {
    if (!canHover()) return
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
    <div
      className={cn('relative', className)}
      onMouseLeave={close}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close()
      }}
    >
      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link, linkIndex) => (
          <li key={link.key}>
            <a
              ref={(node) => {
                linkRefs.current[linkIndex] = node
              }}
              href={link.href}
              {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              onMouseEnter={() => enter(linkIndex)}
              onFocus={() => enter(linkIndex)}
              className={link.className}
            >
              {link.trigger}
            </a>
          </li>
        ))}
      </ul>

      <div
        aria-hidden="true"
        // contain: paint menjaga sudut membulat tetap memotong kartu yang beranimasi blur
        style={{
          left: box.left,
          top: box.top,
          width: box.width,
          height: box.height,
          contain: 'paint',
        }}
        className={cn(
          'pointer-events-none absolute z-20 flex origin-bottom items-end overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl',
          morphing
            ? 'transition-[left,top,width,height,opacity,transform] duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]'
            : 'transition-[opacity,transform] duration-200 ease-out',
          // naik setinggi kartunya sendiri ditambah jarak 8 px dari kartu yang disorot
          open
            ? '-translate-x-1/2 -translate-y-[calc(100%+0.5rem)] scale-100 opacity-100'
            : '-translate-x-1/2 -translate-y-[calc(100%+0.25rem)] scale-[0.97] opacity-0',
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
    </div>
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
