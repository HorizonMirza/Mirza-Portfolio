'use client'

import { Pause, Play } from 'lucide-react'
import { useEffect, useState, useSyncExternalStore } from 'react'

import { cn } from '@/lib/utils'

export type TickerItem = { badge: string; text: string; href: string; at: string }

const INTERVAL_MS = 3500

const REDUCE = '(prefers-reduced-motion: reduce)'
function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia(REDUCE)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

// Waktu relatif ("12 mnt lalu") dihitung di browser agar tidak basi oleh cache halaman.
function relative(at: string, locale: string, now: number) {
  const seconds = Math.round((new Date(at).getTime() - now) / 1000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' })
  const abs = Math.abs(seconds)
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(Math.round(seconds / 86400), 'day')
  return rtf.format(Math.round(seconds / (86400 * 30)), 'month')
}

// Satu baris aktivitas GitHub publik yang berganti tiap 3,5 detik (DESIGN.md bagian 46).
// Berhenti saat disorot/difokus, bisa dijeda dengan tombol (WCAG 2.2.2), dan diam pada
// reduced-motion. Semua item tetap ada di DOM sebagai daftar tautan untuk pembaca layar.
export function GithubActivityTicker({
  items,
  locale,
  labels,
}: {
  items: TickerItem[]
  locale: string
  labels: { region: string; pause: string; play: string }
}) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hover, setHover] = useState(false)
  const [now, setNow] = useState<number | null>(null)
  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCE).matches,
    () => false,
  )

  // waktu relatif baru dihitung setelah hidrasi (server dan browser bisa beda jam)
  useEffect(() => {
    const id = requestAnimationFrame(() => setNow(Date.now()))
    return () => cancelAnimationFrame(id)
  }, [])

  const running = !paused && !hover && !reduced && items.length > 1
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      if (document.hidden) return
      setIndex((i) => (i + 1) % items.length)
      setNow(Date.now())
    }, INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [running, items.length])

  const date = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Jakarta',
  })

  return (
    <div
      className="gh-ticker"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <ul
        aria-label={labels.region}
        className="gh-ticker-list"
        style={{ transform: `translateY(${-index * 100}%)` }}
      >
        {items.map((item, i) => (
          <li key={item.href + item.at} aria-hidden={i === index ? undefined : true}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={i === index ? 0 : -1}
            >
              <span className="gh-ticker-badge">{item.badge}</span>
              <span className="gh-ticker-text">{item.text}</span>
              <time dateTime={item.at} className="gh-ticker-time">
                {now === null ? date.format(new Date(item.at)) : relative(item.at, locale, now)}
              </time>
            </a>
          </li>
        ))}
      </ul>
      {items.length > 1 && !reduced ? (
        <button
          type="button"
          className={cn('gh-ticker-toggle', paused && 'is-paused')}
          aria-pressed={paused}
          aria-label={paused ? labels.play : labels.pause}
          title={paused ? labels.play : labels.pause}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
        </button>
      ) : null}
    </div>
  )
}
