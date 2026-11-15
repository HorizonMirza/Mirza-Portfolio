'use client'

import { Minus, Plus, RotateCw } from 'lucide-react'
import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react'

import { useAdminT } from '@/components/admin/admin-lang'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

import {
  aspectChoices,
  clampOffset,
  coverScale,
  effectiveSize,
  exportSize,
  type Rotation,
} from '../crop-math'
import { maxSideOf, UPLOAD_TARGETS, type UploadTarget } from '../targets'

const FRAME_MAX_W = 440
const FRAME_MAX_H = 340
const MAX_ZOOM = 4

function drawTo(
  ctx: CanvasRenderingContext2D,
  bitmap: ImageBitmap,
  frameW: number,
  frameH: number,
  scale: number,
  rotation: Rotation,
  offset: { x: number; y: number },
  k: number,
) {
  ctx.save()
  ctx.translate((frameW / 2 + offset.x) * k, (frameH / 2 + offset.y) * k)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.scale(scale * k, scale * k)
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2)
  ctx.restore()
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
}

// Pemotong gambar untuk semua unggahan gambar di admin (permintaan pemilik 2026-11-15, DESIGN.md
// bagian 148): gambar yang dipilih dari folder ditampilkan di bingkai; digeser, diperbesar atau
// diperkecil, diputar, dan perbandingan bingkainya bisa dipilih. Hasilnya dipotong di browser lalu
// dikirim ke Cloudinary; tanpa teks alternatif (diisi otomatis di server). Tanpa library: kanvas 2D.
export function ImageCropDialog({
  file,
  target,
  stage,
  onCancel,
  onConfirm,
}: {
  file: File
  target: UploadTarget
  // keterangan tahap unggah dari induk (menyiapkan, mengunggah, menyimpan)
  stage: string | null
  onCancel: () => void
  onConfirm: (blob: Blob, fileName: string) => void
}) {
  const t = useAdminT()
  const spec = UPLOAD_TARGETS[target]
  const defaultRatio = 'aspect' in spec ? spec.aspect : undefined
  const choices = aspectChoices(defaultRatio, 'ratio' in spec)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null)
  const [failed, setFailed] = useState(false)
  const [choice, setChoice] = useState(choices[0]!.key)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState<Rotation>(0)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [busy, setBusy] = useState(false)
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  useEffect(() => {
    let alive = true
    let loaded: ImageBitmap | null = null
    createImageBitmap(file)
      .then((b) => {
        loaded = b
        if (alive) setBitmap(b)
        else b.close()
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
      loaded?.close()
    }
  }, [file])

  const eff = bitmap ? effectiveSize(bitmap.width, bitmap.height, rotation) : { w: 1, h: 1 }
  const picked = choices.find((c) => c.key === choice) ?? choices[0]!
  const ratio = picked.ratio === 'original' ? eff.w / eff.h : picked.ratio
  const frameW = Math.round(Math.min(FRAME_MAX_W, FRAME_MAX_H * ratio))
  const frameH = Math.round(frameW / ratio)
  const base = coverScale(eff.w, eff.h, frameW, frameH)
  const scale = base * zoom
  const safeOffset = clampOffset(offset, eff.w, eff.h, scale, frameW, frameH)

  // gambar ulang saat apa pun berubah
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !bitmap) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = frameW * dpr
    canvas.height = frameH * dpr
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawTo(ctx, bitmap, frameW, frameH, scale, rotation, safeOffset, dpr)
  }, [bitmap, frameW, frameH, scale, rotation, safeOffset.x, safeOffset.y]) // eslint-disable-line react-hooks/exhaustive-deps

  const changeZoom = useCallback((next: number) => {
    setZoom(Math.min(MAX_ZOOM, Math.max(1, next)))
  }, [])

  // roda tetikus memperbesar/memperkecil (pendengar non-pasif agar halaman tidak ikut tergulir)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(1, z * (event.deltaY < 0 ? 1.08 : 1 / 1.08))))
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [bitmap])

  function move(dx: number, dy: number) {
    setOffset(
      clampOffset(
        { x: safeOffset.x + dx, y: safeOffset.y + dy },
        eff.w,
        eff.h,
        scale,
        frameW,
        frameH,
      ),
    )
  }

  function onKeyDown(event: KeyboardEvent<HTMLCanvasElement>) {
    const step = event.shiftKey ? 30 : 10
    const keys: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    if (keys[event.key]) {
      event.preventDefault()
      move(...keys[event.key]!)
    } else if (event.key === '+' || event.key === '=') changeZoom(zoom * 1.15)
    else if (event.key === '-') changeZoom(zoom / 1.15)
  }

  function pickChoice(key: string) {
    setChoice(key)
    setOffset({ x: 0, y: 0 })
    setZoom(1)
  }

  async function confirm() {
    if (!bitmap) return
    setBusy(true)
    const keepJpeg = file.type === 'image/jpeg'
    const type = keepJpeg ? 'image/jpeg' : 'image/webp'
    // sisi terpanjang dikurangi bertahap bila hasilnya melewati batas ukuran
    let maxSide = maxSideOf(target)
    let blob: Blob | null = null
    for (let attempt = 0; attempt < 4; attempt++) {
      const size = exportSize(frameW, frameH, scale, maxSide)
      const out = document.createElement('canvas')
      out.width = size.width
      out.height = size.height
      const ctx = out.getContext('2d')
      if (!ctx) break
      drawTo(ctx, bitmap, frameW, frameH, scale, rotation, safeOffset, size.width / frameW)
      blob = await toBlob(out, type, 0.92)
      if (blob && blob.size <= spec.maxBytes) break
      maxSide = Math.round(maxSide * 0.75)
    }
    setBusy(false)
    if (!blob) {
      setFailed(true)
      return
    }
    const ext = blob.type === 'image/jpeg' ? 'jpg' : blob.type === 'image/png' ? 'png' : 'webp'
    onConfirm(blob, `gambar.${ext}`)
  }

  const working = busy || stage !== null

  return (
    <Dialog open onOpenChange={(open) => (open || working ? null : onCancel())}>
      <DialogContent className="max-h-[92dvh] max-w-[34rem] overflow-y-auto">
        <DialogTitle>{t('Atur gambar')}</DialogTitle>
        <DialogDescription>
          {t(
            'Geser gambar untuk memilih bagian yang tampil. Perbesar atau perkecil dengan penggeser atau roda tetikus.',
          )}
        </DialogDescription>
        {failed ? (
          <p className="mt-4 rounded-md border border-dashed border-border p-4 text-sm text-danger">
            {t('Gambar tidak bisa dibaca. Coba berkas lain.')}
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            <div
              className="mx-auto overflow-hidden rounded-md border border-border bg-surface-2"
              style={{ width: frameW, height: frameH, maxWidth: '100%' }}
            >
              <canvas
                ref={canvasRef}
                tabIndex={0}
                role="img"
                aria-label={t('Bingkai potong. Panah menggeser, plus dan minus mengubah ukuran.')}
                style={{ width: '100%', height: '100%', touchAction: 'none', cursor: 'grab' }}
                onKeyDown={onKeyDown}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId)
                  drag.current = {
                    x: event.clientX,
                    y: event.clientY,
                    ox: safeOffset.x,
                    oy: safeOffset.y,
                  }
                }}
                onPointerMove={(event) => {
                  const d = drag.current
                  if (!d) return
                  // layar bisa lebih kecil dari bingkai (max-width): hitung dalam satuan bingkai
                  const unit = frameW / event.currentTarget.getBoundingClientRect().width
                  setOffset(
                    clampOffset(
                      {
                        x: d.ox + (event.clientX - d.x) * unit,
                        y: d.oy + (event.clientY - d.y) * unit,
                      },
                      eff.w,
                      eff.h,
                      scale,
                      frameW,
                      frameH,
                    ),
                  )
                }}
                onPointerUp={() => (drag.current = null)}
                onPointerCancel={() => (drag.current = null)}
              />
            </div>

            {/* ukuran bingkai */}
            <div
              role="group"
              aria-label={t('Ukuran bingkai')}
              className="flex flex-wrap justify-center gap-2"
            >
              {choices.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  aria-pressed={c.key === choice}
                  onClick={() => pickChoice(c.key)}
                  className={cn(
                    'inline-flex min-h-9 items-center rounded-md border px-3 text-xs font-semibold',
                    c.key === choice
                      ? 'border-text bg-text text-bg'
                      : 'border-border text-muted hover:text-text',
                  )}
                >
                  {t(c.label)}
                </button>
              ))}
            </div>

            {/* perbesar/perkecil dan putar */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={t('Perkecil')}
                onClick={() => changeZoom(zoom / 1.15)}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-border hover:bg-surface-2"
              >
                <Minus className="size-4" aria-hidden="true" />
              </button>
              <input
                type="range"
                aria-label={t('Ukuran gambar')}
                min={1}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                onChange={(event) => changeZoom(Number(event.target.value))}
                className="h-10 min-w-0 flex-1 cursor-pointer accent-current"
              />
              <button
                type="button"
                aria-label={t('Perbesar')}
                onClick={() => changeZoom(zoom * 1.15)}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-border hover:bg-surface-2"
              >
                <Plus className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={t('Putar 90°')}
                onClick={() => {
                  setRotation(((rotation + 90) % 360) as Rotation)
                  setOffset({ x: 0, y: 0 })
                }}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-border hover:bg-surface-2"
              >
                <RotateCw className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
        <p role="status" className="mt-3 min-h-5 text-sm text-muted">
          {stage}
        </p>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={working}>
            {t('Batal')}
          </Button>
          <Button type="button" onClick={confirm} disabled={working || failed || !bitmap}>
            {working ? t('Memproses…') : t('Simpan')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
