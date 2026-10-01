'use client'

import type { Application, SplineEvent } from '@splinetool/runtime'
import { useTheme } from 'next-themes'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

import type { Keycap } from '../keycaps'

// Nama tombol di scene keyboard 3D -> slug Simple Icons skill (features/skills/keycaps.ts).
// Scene: "skills-keyboard" karya Naresh Khatri (https://github.com/Naresh-Khatri/3d-portfolio, MIT).
const SCENE_KEYS: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  html: 'html5',
  css: 'css',
  react: 'react',
  vue: 'vuedotjs',
  nextjs: 'nextdotjs',
  tailwind: 'tailwindcss',
  nodejs: 'nodedotjs',
  express: 'express',
  postgres: 'postgresql',
  mongodb: 'mongodb',
  git: 'git',
  github: 'github',
  prettier: 'prettier',
  npm: 'npm',
  firebase: 'firebase',
  wordpress: 'wordpress',
  linux: 'linux',
  docker: 'docker',
  nginx: 'nginx',
  aws: 'amazonwebservices',
  vim: 'vim',
  vercel: 'vercel',
}

const SCENE_URL = '/spline/skills-keyboard.spline'
// process.wasm di-host sendiri (bawaan runtime mengambil dari unpkg.com)
const WASM_PATH = '/spline'
// lebar canvas di bawah ini memakai tata letak HP dari scene (teks di atas keyboard)
const MOBILE_WIDTH = 768

type Status = 'idle' | 'ready' | 'fallback'

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

// Ukuran keyboard di scene mengikuti piksel canvas, jadi skala dihitung dari lebar canvas.
function layoutFor(width: number) {
  const mobile = width < MOBILE_WIDTH
  const scale = Math.min(0.25, Math.max(0.1, width / (mobile ? 2800 : 5100)))
  return {
    mobile,
    scale,
    position: mobile ? { x: -40, y: -20 } : { x: 0, y: -40 },
    rotationY: mobile ? Math.PI / 6 : Math.PI / 12,
  }
}

// Keyboard 3D (Spline) di bagian skill. Hanya tombol untuk skill yang ada di database yang tampil:
// tombol lain di scene disembunyikan agar tidak mengklaim skill yang tidak dimiliki. Arahkan kursor
// atau tekan tombol untuk menampilkan nama skill dan kategorinya di dalam scene.
// Runtime dimuat hanya saat bagian ini hampir terlihat. Tanpa WebGL, dengan reduced-motion, atau bila
// scene gagal dimuat: keyboard CSS (fallback) yang tampil. Canvas tidak terbaca pembaca layar, jadi
// daftar skill disediakan sebagai teks tersembunyi.
export function SkillKeyboard3D({
  keycaps,
  fallback,
  label,
  className,
}: {
  keycaps: Keycap[]
  fallback: ReactNode
  label: string
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<Application | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  // dipisah dari status agar effect pemuat tidak dibersihkan (dan scene dibuang) saat status berubah
  const [shouldLoad, setShouldLoad] = useState(false)
  const { resolvedTheme } = useTheme()
  const themeRef = useRef(resolvedTheme)
  useEffect(() => {
    themeRef.current = resolvedTheme
  }, [resolvedTheme])

  // skill per nama tombol di scene
  const bySceneKey = useMemo(
    () =>
      new Map(
        Object.entries(SCENE_KEYS).flatMap(([sceneKey, slug]) => {
          const keycap = keycaps.find((k) => k.slug === slug)
          return keycap ? [[sceneKey, keycap] as const] : []
        }),
      ),
    [keycaps],
  )
  const hasSceneKeys = bySceneKey.size > 0

  useEffect(() => {
    if (!hasSceneKeys) return
    const container = containerRef.current
    if (!container) return
    // Runtime 3D (~1,5 MB) baru dimuat bila bagian ini hampir terlihat DAN pengunjung sudah
    // berinteraksi (kursor, sentuh, scroll, tombol), agar halaman awal tetap ringan.
    let visible = false
    let interacted = false
    const events = ['pointermove', 'pointerdown', 'wheel', 'scroll', 'keydown', 'touchstart']
    const decide = () => {
      if (!visible || !interacted) return
      cleanup()
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce || !canUseWebGL()) setStatus('fallback')
      else setShouldLoad(true)
    }
    const onInteract = () => {
      interacted = true
      decide()
    }
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting)
        decide()
      },
      { rootMargin: '300px 0px' },
    )
    const cleanup = () => {
      observer.disconnect()
      for (const name of events) window.removeEventListener(name, onInteract)
    }
    observer.observe(container)
    for (const name of events) window.addEventListener(name, onInteract, { passive: true })
    return cleanup
  }, [hasSceneKeys])

  useEffect(() => {
    if (!shouldLoad) return
    const canvas = canvasRef.current
    if (!canvas) return
    let disposed = false
    let removeListeners = () => {}
    let resizeObserver: ResizeObserver | undefined

    async function start() {
      const { Application } = await import('@splinetool/runtime')
      if (disposed || !canvas) return
      const app = new Application(canvas, { renderMode: 'auto', wasmPath: WASM_PATH })
      appRef.current = app
      await app.load(SCENE_URL)
      if (disposed) return

      const keyboard = app.findObjectByName('keyboard')
      if (!keyboard) throw new Error('objek keyboard tidak ada di scene')

      const applyLayout = () => {
        const layout = layoutFor(canvas.clientWidth)
        keyboard.scale.x = keyboard.scale.y = keyboard.scale.z = layout.scale
        keyboard.position.x = layout.position.x
        keyboard.position.y = layout.position.y
        keyboard.rotation.y = layout.rotationY
        for (const object of app.getAllObjects()) {
          if (object.name === 'keycap-desktop') object.visible = !layout.mobile
          if (object.name === 'keycap-mobile') object.visible = layout.mobile
        }
        applyTextVisibility(app, layout.mobile, themeRef.current)
      }

      for (const object of app.getAllObjects()) {
        if (object.name === 'keycap') {
          object.visible = true
          object.position.y = 50
        }
      }
      // tombol skill yang tidak dimiliki disembunyikan
      for (const sceneKey of Object.keys(SCENE_KEYS)) {
        const key = app.findObjectByName(sceneKey)
        if (key) key.visible = bySceneKey.has(sceneKey)
      }
      applyLayout()
      app.setVariable('heading', '')
      app.setVariable('desc', '')

      const show = (event: SplineEvent) => {
        const name = event.target.name
        if (name === 'body' || name === 'platform') {
          app.setVariable('heading', '')
          app.setVariable('desc', '')
          return
        }
        const keycap = bySceneKey.get(name)
        if (!keycap) return
        app.setVariable('heading', keycap.name)
        app.setVariable('desc', keycap.category)
      }
      app.addEventListener('mouseHover', show)
      app.addEventListener('mouseDown', show)
      app.addEventListener('keyDown', show)
      removeListeners = () => {
        app.removeEventListener('mouseHover', show)
        app.removeEventListener('mouseDown', show)
        app.removeEventListener('keyDown', show)
      }
      resizeObserver = new ResizeObserver(() => {
        applyLayout()
        app.requestRender()
      })
      resizeObserver.observe(canvas)
      app.requestRender()
      setStatus('ready')
    }

    start().catch((error: unknown) => {
      if (disposed) return
      console.warn('Keyboard 3D gagal dimuat, memakai keyboard CSS', error)
      setStatus('fallback')
    })

    return () => {
      disposed = true
      removeListeners()
      resizeObserver?.disconnect()
      appRef.current?.dispose()
      appRef.current = null
    }
  }, [shouldLoad, bySceneKey])

  useEffect(() => {
    const app = appRef.current
    const canvas = canvasRef.current
    if (status !== 'ready' || !app || !canvas) return
    applyTextVisibility(app, layoutFor(canvas.clientWidth).mobile, resolvedTheme)
  }, [resolvedTheme, status])

  if (!hasSceneKeys) return <div className={className}>{fallback}</div>

  // Keyboard CSS tampil lebih dulu (juga tanpa JavaScript), lalu diganti canvas begitu scene siap.
  // Tinggi minimum sama dengan canvas agar halaman tidak bergeser saat berganti.
  return (
    <div
      ref={containerRef}
      data-state={status}
      className={cn('relative grid min-h-[34rem] items-center sm:min-h-[38rem]', className)}
    >
      {status === 'ready' ? (
        <ul className="sr-only" aria-label={label}>
          {keycaps.map((k) => (
            <li key={k.id}>
              {k.name}, {k.category}
            </li>
          ))}
        </ul>
      ) : (
        fallback
      )}
      {status !== 'fallback' ? (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={cn(
            'kb3d-canvas absolute inset-0 block size-full transition-opacity duration-700',
            status === 'ready' ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        />
      ) : null}
    </div>
  )
}

// teks di scene: versi terang untuk tema gelap dan sebaliknya, versi HP atau desktop
function applyTextVisibility(app: Application, mobile: boolean, theme: string | undefined) {
  const dark = theme !== 'light'
  const visible = `text-${mobile ? 'mobile' : 'desktop'}${dark ? '' : '-dark'}`
  for (const name of ['text-desktop', 'text-desktop-dark', 'text-mobile', 'text-mobile-dark']) {
    const text = app.findObjectByName(name)
    if (text) text.visible = name === visible
  }
}
