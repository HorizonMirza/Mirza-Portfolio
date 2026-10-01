'use client'

import { useEffect, useRef } from 'react'

// Hero "Horizon" (DESIGN.md 1 dan 2.4): grid perspektif yang bergerak pelan menuju garis horizon,
// dengan pita cahaya di garis itu. Canvas 2D tanpa library.
// Anggaran: diinisialisasi setelah halaman siap (idle), berhenti saat keluar layar atau tab
// tersembunyi, DPR maks 2 (1 di HP), bingkai statis bila reduced-motion atau mode hemat.
// Latar CSS statis di bawahnya tetap tampil sampai canvas siap, jadi LCP tidak menunggu canvas.

type Tier = { lines: number; dpr: number; fps: number; animate: boolean; tilt: boolean }

function pickTier(): Tier {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean }
    deviceMemory?: number
  }
  const lowPower =
    Boolean(nav.connection?.saveData) || (nav.deviceMemory !== undefined && nav.deviceMemory <= 2)
  const mobile = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches
  if (mobile) return { lines: 24, dpr: 1, fps: 30, animate: !reduced && !lowPower, tilt: false }
  const tablet = window.matchMedia('(max-width: 1023px)').matches
  return {
    lines: tablet ? 32 : 48,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    fps: 60,
    animate: !reduced && !lowPower,
    tilt: !tablet && !reduced,
  }
}

type Rgb = [number, number, number]

function hexToRgb(value: string, fallback: Rgb): Rgb {
  const m = /^#?([0-9a-f]{6})$/i.exec(value.trim())
  if (!m) return fallback
  const n = Number.parseInt(m[1]!, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const rgba = ([r, g, b]: Rgb, a: number) => `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`

// Warna dari token desain (--accent, --note) agar ikut tema terang/gelap.
function readColors() {
  const s = getComputedStyle(document.documentElement)
  return {
    accent: hexToRgb(s.getPropertyValue('--accent'), [56, 189, 248]),
    primary: hexToRgb(s.getPropertyValue('--note'), [29, 95, 208]),
  }
}

export function HorizonCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const tier = pickTier()
    let colors = readColors()
    let width = 0
    let height = 0
    let phase = 0
    let tiltTarget = 0
    let tilt = 0
    let raf = 0
    let last = 0
    let visible = true
    let running = false

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * tier.dpr)
      canvas.height = Math.round(height * tier.dpr)
      ctx.setTransform(tier.dpr, 0, 0, tier.dpr, 0, 0)
    }

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height)
      const horizon = 1
      const vx = width / 2 + tilt * width * 0.12
      const depth = height - horizon

      // pita cahaya di garis horizon, "naik" sangat pelan
      const pulse = 0.55 + 0.15 * Math.sin(time / 2400)
      const glow = ctx.createLinearGradient(0, horizon, 0, horizon + depth * 0.5)
      glow.addColorStop(0, rgba(colors.primary, pulse * 0.4))
      glow.addColorStop(1, rgba(colors.primary, 0))
      ctx.fillStyle = glow
      ctx.fillRect(0, horizon, width, depth * 0.5)

      ctx.lineWidth = 1
      // garis menuju titik hilang
      const spread = width * 1.6
      for (let i = 0; i <= tier.lines; i++) {
        const x = vx - spread + (i / tier.lines) * spread * 2
        const alpha = 0.28 * (1 - Math.abs(i / tier.lines - 0.5))
        ctx.strokeStyle = rgba(colors.accent, alpha)
        ctx.beginPath()
        ctx.moveTo(vx, horizon)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      // garis melintang bergerak mendekat (kesan maju ke depan)
      const rows = Math.round(tier.lines / 3)
      for (let k = 0; k < rows; k++) {
        const d = (k + phase) / rows
        const y = horizon + depth * d * d
        const alpha = Math.min(1, d * 1.6) * 0.3
        ctx.strokeStyle = rgba(colors.accent, alpha)
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
      // garis horizon
      const line = ctx.createLinearGradient(0, 0, width, 0)
      line.addColorStop(0, rgba(colors.primary, 0))
      line.addColorStop(0.5, rgba(colors.primary, 1))
      line.addColorStop(1, rgba(colors.primary, 0))
      ctx.strokeStyle = line
      ctx.beginPath()
      ctx.moveTo(0, horizon)
      ctx.lineTo(width, horizon)
      ctx.stroke()
    }

    const frame = (time: number) => {
      raf = requestAnimationFrame(frame)
      if (time - last < 1000 / tier.fps) return
      const dt = last ? time - last : 16
      last = time
      phase = (phase + dt / 6000) % 1
      tilt += (tiltTarget - tilt) * 0.06
      draw(time)
    }

    const start = () => {
      if (running || !tier.animate || !visible || document.hidden) return
      running = true
      last = 0
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    const onPointer = (e: PointerEvent) => {
      tiltTarget = (e.clientX / window.innerWidth - 0.5) * 2
    }
    const onVisibility = () => (document.hidden ? stop() : start())
    const onResize = () => {
      resize()
      if (!running) draw(performance.now())
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting)
      if (visible) start()
      else stop()
    })
    // warna mengikuti tema (class .dark di <html>)
    const mo = new MutationObserver(() => {
      colors = readColors()
      if (!running) draw(performance.now())
    })

    let idle = 0
    const init = () => {
      resize()
      draw(performance.now())
      canvas.dataset.ready = 'true'
      io.observe(canvas)
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
      window.addEventListener('resize', onResize)
      document.addEventListener('visibilitychange', onVisibility)
      if (tier.tilt) window.addEventListener('pointermove', onPointer, { passive: true })
      start()
    }
    const ric = (
      window as Window & {
        requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number
      }
    ).requestIdleCallback
    if (ric) idle = ric(init, { timeout: 1500 })
    else idle = window.setTimeout(init, 200)

    return () => {
      stop()
      const cic = (window as Window & { cancelIdleCallback?: (id: number) => void })
        .cancelIdleCallback
      if (cic) cic(idle)
      else clearTimeout(idle)
      io.disconnect()
      mo.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      tabIndex={-1}
      className="horizon-canvas pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500 data-[ready=true]:opacity-100"
    />
  )
}
