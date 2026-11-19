'use client'

// Bagian kecil editor skill di admin: chip skill (logo + nama yang bisa diketik + alat melayang),
// kolom tambah butir baru, dan tombol buang untuk butir yang belum disimpan.

import { ImagePlus, X } from 'lucide-react'
import { useState } from 'react'

import { useAdminT } from '@/components/admin/admin-lang'
import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { InlineInput } from '@/components/admin/live-edit'
import { RemoveAssetButton } from '@/features/assets/components/remove-asset-button'
import { cn } from '@/lib/utils'

import { deleteSkill } from '@backend/features/skills/actions'

import type { NewSkill, SkillRow } from './use-skill-drafts'

// Enter tidak mengirim formulir dari kolom nama
export function holdEnter(event: React.KeyboardEvent<HTMLInputElement>) {
  if (event.key === 'Enter') {
    event.preventDefault()
    event.currentTarget.blur()
  }
}

// Kolom tambah (kategori atau skill baru): Enter atau keluar dari kolom menambah butir baru ke
// daftar, lalu kolom kosong lagi. Butir baru baru tersimpan saat Simpan ditekan.
export function AddInline({
  label,
  placeholder,
  className,
  onAdd,
}: {
  label: string
  placeholder: string
  className?: string
  onAdd: (text: string) => void
}) {
  const [text, setText] = useState('')
  const submit = () => {
    const next = text.trim()
    if (!next) return
    onAdd(next)
    setText('')
  }
  return (
    <InlineInput
      label={label}
      value={text}
      placeholder={placeholder}
      maxLength={60}
      size={Math.max(placeholder.length, text.length + 1)}
      className={className}
      onChange={(event) => setText(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          submit()
        }
      }}
      onBlur={submit}
    />
  )
}

export function DiscardButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-text"
    >
      <X className="size-4" aria-hidden="true" />
    </button>
  )
}

// Satu skill: tersimpan (`skill`) atau baru (`draft`). Logo ditekan untuk diunggah atau diganti;
// alat hapus melayang di atas chip saat disorot atau difokus (di HP: ketuk nama skill).
export function SkillChip({
  skill,
  draft,
  name,
  onPickLogo,
  onNameChange,
  onNameBlur,
  onDiscard,
  onRefresh,
}: {
  skill?: SkillRow
  draft?: NewSkill
  name: string
  onPickLogo: () => void
  onNameChange: (value: string) => void
  onNameBlur: () => void
  /** hanya untuk skill baru: buang dari daftar */
  onDiscard?: () => void
  onRefresh: () => void
}) {
  const t = useAdminT()
  const shown = skill?.shown
  const logoPreview = draft?.logo?.preview
  return (
    <li className="group/skill relative inline-flex min-h-9 items-center gap-2 rounded-md border border-border bg-surface pr-3 pl-1 text-sm font-medium">
      <button
        type="button"
        onClick={onPickLogo}
        className={cn(
          'admin-editable grid size-7 shrink-0 place-items-center rounded-md hover:bg-surface-2',
          !shown && !logoPreview && 'text-muted',
        )}
      >
        {logoPreview || shown ? (
          // logo kecil statis (unggahan atau public/skills), tanpa optimasi next/image
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoPreview ?? shown!.src}
            alt=""
            width={20}
            height={20}
            className="size-5 object-contain"
            data-invert-dark={!logoPreview && shown?.invertDark ? '' : undefined}
          />
        ) : (
          <ImagePlus className="size-4" aria-hidden="true" />
        )}
        <span className="sr-only">{t('Logo {item}', { item: name })}</span>
      </button>
      <InlineInput
        label={t('Nama Skill')}
        value={name}
        maxLength={60}
        size={Math.max(3, name.length + 1)}
        // nama pendek (mis. "C") tetap mudah ditekan (axe target-size)
        className="min-h-6 min-w-6"
        onChange={(event) => onNameChange(event.target.value)}
        onKeyDown={holdEnter}
        onBlur={onNameBlur}
      />
      <span className="absolute bottom-full left-0 z-20 hidden pb-1 group-focus-within/skill:flex group-hover/skill:flex">
        <span className="flex items-center rounded-md border border-border bg-surface p-0.5 shadow-lg">
          {skill ? (
            <>
              {skill.logo ? (
                <RemoveAssetButton
                  assetId={skill.logo.id}
                  label={t('Logo {item}', { item: skill.name })}
                  onDone={onRefresh}
                />
              ) : null}
              <ConfirmDelete
                title="Hapus Skill"
                iconOnly
                itemLabel={skill.name}
                onConfirm={() => deleteSkill(skill.id)}
              />
            </>
          ) : (
            <DiscardButton
              label={t('Buang {item}', { item: name })}
              onClick={() => onDiscard?.()}
            />
          )}
        </span>
      </span>
    </li>
  )
}
