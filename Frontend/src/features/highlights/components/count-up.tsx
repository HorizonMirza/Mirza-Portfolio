'use client'

import { useEffect, useRef } from 'react'

// Angka yang menghitung naik saat pertama kali terlihat (DESIGN.md bagian 46). HTML awal sudah
// berisi angka akhir, jadi tanpa JavaScript, pembaca layar, dan reduced-motion tetap membaca angka
// yang benar; animasi hanya mengganti teksnya sementara.
export function CountUp({
  value,
  suffix,
  locale,
  className,
}: {
  value: number
  suffix: string
  locale: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || value <= 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!('IntersectionObserver' in window)) return
    const nf = new Intl.NumberFormat(locale)
    const final = nf.format(value) + suffix
    // hanya bila angka masih di bawah layar saat halaman dibuka, agar tidak berkedip dari nol
    if (el.getBoundingClientRect().top < window.innerHeight) return
    let raf = 0
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const duration = 1400
        const step = (now: number) => {
          const p = Math.min(1, (now - start) / duration)
          const eased = 1 - Math.pow(1 - p, 3)
          el.textContent = p < 1 ? nf.format(Math.round(value * eased)) + suffix : final
          if (p < 1) raf = requestAnimationFrame(step)
        }
        el.textContent = nf.format(0) + suffix
        raf = requestAnimationFrame(step)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      el.textContent = final
    }
  }, [value, suffix, locale])

  return (
    <span ref={ref} className={className}>
      {new Intl.NumberFormat(locale).format(value) + suffix}
    </span>
  )
}
