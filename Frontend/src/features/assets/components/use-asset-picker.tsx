'use client'

import { type ReactNode, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useAdminT } from '@/components/admin/admin-lang'

import { resolveMime } from '../file-type'
import { UPLOAD_TARGETS, type UploadTarget } from '@backend/features/assets/targets'
import { uploadAsset, type UploadStage } from '../upload-client'
import { ImageCropDialog } from './image-crop-dialog'

const MAX_SOURCE_BYTES = 25 * 1024 * 1024

// onCrop: hasil potongan diserahkan ke pemanggil, tidak diunggah (entri baru yang belum tersimpan)
type Pending = {
  file: File
  target: UploadTarget
  targetId?: string
  onCrop?: (blob: Blob, fileName: string) => void
}

// Pemilih berkas untuk semua gambar dan PDF yang bisa diganti di pratinjau admin (permintaan pemilik
// 2026-11-15): menekan gambar langsung membuka pemilih berkas (folder) tanpa
// formulir. Gambar lalu masuk ke pemotong (geser, ukuran bingkai, perbesar/perkecil, putar) dan
// tersimpan saat Simpan ditekan; PDF langsung diunggah. Satu pemilih bisa dipakai untuk banyak tujuan
// lewat pick(target, id). `element` harus dirender sekali di komponen pemakai.
export function useAssetPicker({
  configured,
  onDone,
}: {
  configured: boolean
  onDone: () => void
}): {
  pick: (
    target: UploadTarget,
    targetId?: string,
    onCrop?: (blob: Blob, fileName: string) => void,
  ) => void
  element: ReactNode
  busy: boolean
} {
  const t = useAdminT()
  const input = useRef<HTMLInputElement>(null)
  const next = useRef<Omit<Pending, 'file'> | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [stage, setStage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const stageText: Record<UploadStage, string> = {
    menyiapkan: t('Menyiapkan…'),
    mengunggah: t('Mengunggah…'),
    menyimpan: t('Menyimpan…'),
  }

  function pick(
    target: UploadTarget,
    targetId?: string,
    onCrop?: (blob: Blob, fileName: string) => void,
  ) {
    if (!configured) {
      toast.error(
        t(
          'Unggah belum aktif: isi CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET.',
        ),
      )
      return
    }
    const el = input.current
    if (!el) return
    next.current = { target, targetId, onCrop }
    el.accept = UPLOAD_TARGETS[target].accept
    el.click()
  }

  async function send(job: Pending, blob: Blob, name: string) {
    if (job.onCrop) {
      job.onCrop(blob, name)
      setPending(null)
      return
    }
    setBusy(true)
    // PDF diunggah tanpa dialog pemotong, jadi tahapnya tampil sebagai toast berpemutar yang lalu
    // diganti hasilnya (id sama). Gambar menampilkan tahap di dialog pemotong.
    const toastId = UPLOAD_TARGETS[job.target].kind === 'DOCUMENT' ? 'asset-upload' : undefined
    if (toastId) toast.loading(stageText.menyiapkan, { id: toastId })
    const result = await uploadAsset(job.target, job.targetId, blob, name, (s) => {
      setStage(stageText[s])
      if (toastId) toast.loading(stageText[s], { id: toastId })
    })
    setStage(null)
    setBusy(false)
    if (!result.ok) {
      toast.error(t(result.message), { id: toastId })
      return
    }
    toast.success(t(result.message), { id: toastId })
    setPending(null)
    onDone()
  }

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    const job = next.current
    if (!file || !job) return
    const spec = UPLOAD_TARGETS[job.target]
    if (!spec.accept.split(',').includes(resolveMime(file.name, file.type))) {
      toast.error(
        t('Tipe tidak didukung. Gunakan {formats}.', { formats: spec.formats.join(', ') }),
      )
      return
    }
    if (spec.kind === 'DOCUMENT') {
      if (file.size > spec.maxBytes) {
        toast.error(t('Ukuran maksimal {size}.', { size: `${spec.maxBytes / 1024 / 1024} MB` }))
        return
      }
      void send({ file, ...job }, file, file.name)
      return
    }
    if (file.size > MAX_SOURCE_BYTES) {
      toast.error(t('Ukuran maksimal {size}.', { size: '25 MB' }))
      return
    }
    setPending({ file, ...job })
  }

  const element = (
    <>
      <input ref={input} type="file" hidden onChange={onChange} tabIndex={-1} aria-hidden="true" />
      {pending ? (
        <ImageCropDialog
          file={pending.file}
          target={pending.target}
          stage={stage}
          onCancel={() => setPending(null)}
          onConfirm={(blob, name) => void send(pending, blob, name)}
        />
      ) : null}
    </>
  )
  return { pick, element, busy }
}
