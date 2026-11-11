'use client'

import { Upload } from 'lucide-react'
import { useId, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { useAdminT } from '@/components/admin/admin-lang'
import { Field } from '@/components/admin/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { attachUploadedAsset, signAssetUpload } from '../actions'
import {
  checkImageShape,
  formatBytes,
  needsAlt,
  UPLOAD_TARGETS,
  type UploadTarget,
} from '../targets'

// Alur: pilih berkas → minta tanda tangan ke server → unggah langsung ke Cloudinary →
// server memverifikasi respons lalu mencatat Asset. Secret tidak pernah sampai ke browser.
// Ukuran piksel gambar di browser, untuk menolak gambar yang salah bentuk sebelum diunggah.
async function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await createImageBitmap(file)
    const size = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return size
  } catch {
    return null
  }
}

export function AssetUploader({
  target,
  targetId,
  buttonLabel,
}: {
  target: UploadTarget
  targetId?: string
  buttonLabel?: string
}) {
  const t = useAdminT()
  const spec = UPLOAD_TARGETS[target]
  const uid = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [alt, setAlt] = useState({ alt_id: '', alt_en: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [stage, setStage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  // gambar hiasan (armor hero) tidak butuh teks alternatif
  const isImage = needsAlt(spec)

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!file) next.file = 'Pilih berkas dulu'
    else if (!spec.accept.split(',').includes(file.type))
      next.file = `Tipe tidak didukung. Gunakan ${spec.formats.join(', ')}.`
    else if (file.size > spec.maxBytes) next.file = `Ukuran maksimal ${formatBytes(spec.maxBytes)}.`
    if (isImage && !alt.alt_id.trim()) next.alt_id = 'Teks alternatif wajib diisi'
    if (isImage && !alt.alt_en.trim()) next.alt_en = 'Alt text wajib diisi'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function upload() {
    if (!validate() || !file) return
    startTransition(async () => {
      if ('ratio' in spec) {
        const size = await readImageSize(file)
        // gambar yang tak terbaca di browser (mis. AVIF lama) tetap diperiksa server
        const shapeError = size ? checkImageShape(spec, size.width, size.height) : null
        if (shapeError) {
          setErrors({ file: shapeError })
          return
        }
      }
      setStage(t('Menyiapkan…'))
      const signed = await signAssetUpload(target)
      if (!signed.ok || !signed.data) {
        toast.error(t(signed.message))
        setStage(null)
        return
      }
      const s = signed.data
      const body = new FormData()
      body.set('file', file)
      body.set('api_key', s.apiKey)
      body.set('timestamp', String(s.timestamp))
      body.set('signature', s.signature)
      body.set('folder', s.folder)
      if (s.allowedFormats) body.set('allowed_formats', s.allowedFormats)
      setStage(t('Mengunggah…'))
      let uploaded: unknown
      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${s.cloudName}/${s.resourceType}/upload`,
          {
            method: 'POST',
            body,
          },
        )
        uploaded = await res.json()
        if (!res.ok) throw new Error('upload')
      } catch {
        toast.error(t('Unggah ke Cloudinary gagal. Periksa koneksi lalu coba lagi.'))
        setStage(null)
        return
      }
      setStage(t('Menyimpan…'))
      // Berkas sudah di Cloudinary: bila koneksi putus saat menyimpan, coba sekali lagi. Bila tetap
      // gagal, berkas tanpa pemilik dibersihkan cron harian setelah 48 jam (audit 2026-11-02, DB-07).
      const attach = () =>
        attachUploadedAsset(target, targetId ?? null, uploaded, isImage ? alt : null)
      let saved: Awaited<ReturnType<typeof attach>>
      try {
        saved = await attach()
      } catch {
        try {
          saved = await attach()
        } catch {
          setStage(null)
          toast.error(
            t('Berkas terunggah tetapi gagal disimpan. Periksa koneksi lalu unggah lagi.'),
          )
          return
        }
      }
      setStage(null)
      if (!saved.ok) {
        toast.error(t(saved.message))
        if (saved.fieldErrors) setErrors(saved.fieldErrors)
        return
      }
      toast.success(t(saved.message))
      setFile(null)
      setAlt({ alt_id: '', alt_en: '' })
      if (fileRef.current) fileRef.current.value = ''
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Field
        id={`${uid}-file`}
        label={spec.label}
        hint={t('{formats}, maksimal {size}.', {
          formats: spec.formats.join(', ').toUpperCase(),
          size: formatBytes(spec.maxBytes),
        })}
        error={errors.file}
      >
        {(a) => (
          <Input
            ref={fileRef}
            type="file"
            accept={spec.accept}
            className="py-2 file:mr-3 file:rounded-sm file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-sm file:font-medium"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            {...a}
          />
        )}
      </Field>
      {isImage ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            id={`${uid}-alt_id`}
            label="Teks alternatif (Indonesia)"
            hint="Jelaskan isi gambar untuk pembaca layar."
            error={errors.alt_id}
          >
            {(a) => (
              <Input
                value={alt.alt_id}
                onChange={(e) => setAlt({ ...alt, alt_id: e.target.value })}
                {...a}
              />
            )}
          </Field>
          <Field id={`${uid}-alt_en`} label="Alt text (English)" error={errors.alt_en}>
            {(a) => (
              <Input
                value={alt.alt_en}
                onChange={(e) => setAlt({ ...alt, alt_en: e.target.value })}
                {...a}
              />
            )}
          </Field>
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" onClick={upload} disabled={pending}>
          <Upload aria-hidden="true" />
          {pending ? t('Memproses…') : (buttonLabel ?? t('Unggah'))}
        </Button>
        <p role="status" className="text-sm text-muted">
          {stage}
        </p>
      </div>
    </div>
  )
}
