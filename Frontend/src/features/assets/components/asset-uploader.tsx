'use client'

import { Upload } from 'lucide-react'
import { useId, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Field } from '@/components/admin/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { attachUploadedAsset, signAssetUpload } from '../actions'
import { formatBytes, UPLOAD_TARGETS, type UploadTarget } from '../targets'

// Alur: pilih berkas → minta tanda tangan ke server → unggah langsung ke Cloudinary →
// server memverifikasi respons lalu mencatat Asset. Secret tidak pernah sampai ke browser.
export function AssetUploader({
  target,
  targetId,
  buttonLabel = 'Unggah',
}: {
  target: UploadTarget
  targetId?: string
  buttonLabel?: string
}) {
  const spec = UPLOAD_TARGETS[target]
  const uid = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [alt, setAlt] = useState({ alt_id: '', alt_en: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [stage, setStage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const isImage = spec.kind === 'IMAGE'

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
      setStage('Menyiapkan…')
      const signed = await signAssetUpload(target)
      if (!signed.ok || !signed.data) {
        toast.error(signed.message)
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
      setStage('Mengunggah…')
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
        toast.error('Unggah ke Cloudinary gagal. Periksa koneksi lalu coba lagi.')
        setStage(null)
        return
      }
      setStage('Menyimpan…')
      const saved = await attachUploadedAsset(
        target,
        targetId ?? null,
        uploaded,
        isImage ? alt : null,
      )
      setStage(null)
      if (!saved.ok) {
        toast.error(saved.message)
        if (saved.fieldErrors) setErrors(saved.fieldErrors)
        return
      }
      toast.success(saved.message)
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
        hint={`${spec.formats.join(', ').toUpperCase()}, maksimal ${formatBytes(spec.maxBytes)}.`}
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
          {pending ? 'Memproses…' : buttonLabel}
        </Button>
        <p role="status" className="text-sm text-muted">
          {stage}
        </p>
      </div>
    </div>
  )
}
