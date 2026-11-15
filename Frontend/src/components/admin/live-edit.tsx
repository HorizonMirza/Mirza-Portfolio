'use client'

import {
  type ComponentPropsWithoutRef,
  type ReactNode,
  type Ref,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { useAdminLang, useAdminT } from '@/components/admin/admin-lang'
import { MarkdownView } from '@/components/shared/markdown-view'
import { cn } from '@/lib/utils'

// Alat bersama "ubah langsung di pratinjau" (DESIGN.md bagian 133): halaman admin tampil seperti di
// situs dan teksnya diketik langsung di tempatnya, tanpa kotak isian, hanya kursor berkedip.

export type Lang = 'id' | 'en'
export const LANG_NAME: Record<Lang, string> = { id: 'Indonesia', en: 'Inggris' }

// Bahasa isi yang sedang diubah: awalnya sama dengan bahasa tampilan admin dan ikut berganti saat
// bahasa admin diganti di top bar; tombol ID/EN di panggung bisa memilih bahasa lain.
export function useEditLang(): [Lang, (lang: Lang) => void] {
  const { lang: adminLang } = useAdminLang()
  const [lang, setLang] = useState<Lang>(adminLang)
  const [followed, setFollowed] = useState<Lang>(adminLang)
  if (adminLang !== followed) {
    setFollowed(adminLang)
    setLang(adminLang)
  }
  return [lang, setLang]
}

// panggung pratinjau selebar panel isi sampai tepi kiri-kanan, sudut kecil seperti tab
export function LiveStage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('admin-bleed overflow-hidden rounded-md', className)}>{children}</div>
}

// tombol Simpan satu baris penuh selebar panel, sudut kecil (revisi pemilik 2026-11-12)
export function SaveBar({ pending, label = 'Simpan' }: { pending: boolean; label?: string }) {
  const t = useAdminT()
  return (
    <button
      type="submit"
      disabled={pending}
      className="admin-bleed min-h-11 rounded-md bg-text text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? t('Menyimpan…') : t(label)}
    </button>
  )
}

// pilihan bahasa yang sedang diubah; titik kecil = bahasa itu sudah diubah tetapi belum disimpan
export function LangToggle({
  lang,
  onChange,
  dirty,
  className,
}: {
  lang: Lang
  onChange: (lang: Lang) => void
  dirty?: Partial<Record<Lang, boolean>>
  className?: string
}) {
  const t = useAdminT()
  return (
    <div
      role="group"
      aria-label={t('Bahasa yang diubah')}
      className={cn('inline-flex rounded-md border border-border bg-surface p-0.5', className)}
    >
      {(['id', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={l === lang}
          onClick={() => onChange(l)}
          className={cn(
            'relative min-h-9 min-w-11 rounded-[5px] px-3 text-xs font-semibold',
            l === lang ? 'bg-text text-bg' : 'text-muted hover:text-text',
          )}
        >
          {l.toUpperCase()}
          {dirty?.[l] ? (
            <span
              aria-hidden="true"
              className="absolute top-1 right-1 size-1.5 rounded-full bg-current"
            />
          ) : null}
        </button>
      ))}
    </div>
  )
}

function setRefs<T>(el: T, refs: (Ref<T> | undefined)[]) {
  for (const r of refs) {
    if (typeof r === 'function') r(el)
    else if (r) (r as { current: T }).current = el
  }
}

type InlineBase = { label: string; invalid?: boolean; describedBy?: string }

// Teks satu baris yang diketik langsung: huruf, warna, dan ukuran ikut teks di sekitarnya.
export function InlineInput({
  label,
  invalid,
  describedBy,
  className,
  ref,
  ...rest
}: InlineBase & ComponentPropsWithoutRef<'input'> & { ref?: Ref<HTMLInputElement> }) {
  return (
    <input
      {...rest}
      ref={ref}
      aria-label={label}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      spellCheck={false}
      className={cn('admin-inline', invalid && 'admin-inline-bad', className)}
    />
  )
}

// Teks beberapa baris yang diketik langsung; tingginya mengikuti isi.
export function InlineArea({
  label,
  invalid,
  describedBy,
  className,
  measure,
  ref,
  ...rest
}: InlineBase &
  ComponentPropsWithoutRef<'textarea'> & {
    // isi saat ini (mis. dari useWatch), untuk menyesuaikan tinggi setiap kali berubah
    measure?: string
    ref?: Ref<HTMLTextAreaElement>
  }) {
  const area = useRef<HTMLTextAreaElement | null>(null)
  useLayoutEffect(() => {
    const el = area.current
    if (!el) return
    const fit = () => {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
    fit()
    // lebar berubah (panel atau bingkai pratinjau berubah ukuran): tinggi dihitung ulang
    let width = el.clientWidth
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === width) return
      width = el.clientWidth
      fit()
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [measure])
  return (
    <textarea
      rows={1}
      {...rest}
      ref={(el) => setRefs(el, [area, ref])}
      aria-label={label}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      spellCheck={false}
      className={cn(
        'admin-inline block w-full resize-none overflow-hidden',
        invalid && 'admin-inline-bad',
        className,
      )}
    />
  )
}

// galat di bawah panggung
export function LiveErrors({ messages }: { messages: { id?: string; text: string }[] }) {
  if (messages.length === 0) return null
  return (
    <div className="flex flex-col gap-1 text-sm text-danger">
      {messages.map((m) => (
        <p key={m.text} id={m.id}>
          {m.text}
        </p>
      ))}
    </div>
  )
}

// keterangan kecil untuk bagian yang di situs hanya muncul pada keadaan tertentu
export function Note({ children, className }: { children: ReactNode; className?: string }) {
  const t = useAdminT()
  return (
    <p
      className={cn(
        'mb-2 font-mono text-[0.6875rem] tracking-widest text-muted uppercase',
        className,
      )}
    >
      {typeof children === 'string' ? t(children) : children}
    </p>
  )
}

// kotak bergaris putus untuk keadaan kosong atau tersembunyi
export function StateBox({ note, children }: { note: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border p-4">
      <Note>{note}</Note>
      {children}
    </div>
  )
}

// Pilihan bahasa isi dalam satu baris selebar Simpan, tepat di atasnya; bentuknya sama dengan tombol
// Chip kampus/Chip bendera (revisi pemilik 2026-11-13, DESIGN.md bagian 147)
export function LangRow({
  lang,
  onChange,
  dirty,
}: {
  lang: Lang
  onChange: (lang: Lang) => void
  // titik: bahasa ini sudah diubah dan belum disimpan
  dirty?: Partial<Record<Lang, boolean>>
}) {
  const t = useAdminT()
  return (
    <div
      role="group"
      aria-label={t('Bahasa yang diubah')}
      className="admin-bleed grid grid-cols-2 gap-2"
    >
      {(['id', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={l === lang}
          onClick={() => onChange(l)}
          className={cn(
            'relative inline-flex min-h-11 items-center justify-center rounded-md border px-3 text-sm font-semibold',
            l === lang
              ? 'border-text bg-text text-bg'
              : 'border-dashed border-border text-muted hover:text-text',
          )}
        >
          {l.toUpperCase()}
          {dirty?.[l] ? (
            <span
              aria-hidden="true"
              className="absolute top-2 right-2 size-1.5 rounded-full bg-current"
            />
          ) : null}
        </button>
      ))}
    </div>
  )
}

// Teks Markdown (uraian, grade): tampil seperti di situs, ditekan untuk diketik; saat kolom
// ditinggalkan tampil lagi seperti di situs (DESIGN.md bagian 147)
export function MarkdownInline({
  value,
  onChange,
  label,
  placeholder,
  invalid,
  className,
  size = 'base',
}: {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  invalid?: boolean
  className?: string
  size?: 'sm' | 'base'
}) {
  const [editing, setEditing] = useState(false)
  if (editing)
    return (
      <InlineArea
        label={label}
        value={value}
        measure={value}
        autoFocus
        placeholder={placeholder}
        invalid={invalid}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => setEditing(false)}
        className={cn(size === 'sm' ? 'text-sm leading-relaxed' : 'max-w-prose', className)}
      />
    )
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          setEditing(true)
        }
      }}
      className={cn(
        'admin-editable cursor-text rounded-sm text-left',
        invalid && 'admin-inline-bad',
        className,
      )}
    >
      {/* nama tombol = label isian + teks yang terlihat (axe label-content-name-mismatch) */}
      <span className="sr-only">{label}: </span>
      {value.trim() ? (
        <MarkdownView source={value} size={size} />
      ) : (
        <span className="opacity-40">{placeholder}</span>
      )}
    </div>
  )
}
