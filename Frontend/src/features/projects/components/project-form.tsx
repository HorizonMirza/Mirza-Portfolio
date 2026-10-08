'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { applyResult } from '@/components/admin/apply-result'
import { BilingualTabs, countLangErrors } from '@/components/admin/bilingual-tabs'
import { Field } from '@/components/admin/field'
import { FormFooter } from '@/components/admin/form-footer'
import { MarkdownEditor } from '@/components/admin/markdown-editor'
import { NativeSelect } from '@/components/admin/select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { SkillOptionGroup } from '@/features/skills/queries'
import { slugify } from '@/lib/validation'

import { importFromGithub, saveProject } from '../actions'
import {
  type ProjectInput,
  projectCategoryLabel,
  projectSchema,
  type ProjectValues,
} from '../schema'

type Lang = 'id' | 'en'

export function ProjectForm({
  projectId,
  defaultValues,
  skillGroups,
}: {
  projectId: string | null
  defaultValues: ProjectInput
  skillGroups: SkillOptionGroup[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [importing, startImport] = useTransition()
  const [importNote, setImportNote] = useState<string | null>(null)
  const form = useForm<ProjectInput, unknown, ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues,
  })
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = form

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveProject(projectId, values)
      if (!applyResult(result, setError) || !result.ok) return
      if (projectId) reset(values)
      else if (result.data) {
        router.replace(`/admin/projects/${result.data.id}`)
      }
    })
  })

  function fillSlug() {
    if (getValues('slug').trim() !== '') return
    const source = getValues('title_en') || getValues('title_id')
    if (source) setValue('slug', slugify(source), { shouldValidate: true })
  }

  function runImport() {
    setImportNote(null)
    startImport(async () => {
      const result = await importFromGithub(getValues('githubRepo'))
      if (!applyResult(result, setError) || !result.ok || !result.data) return
      const d = result.data
      const opts = { shouldDirty: true, shouldValidate: true }
      setValue('githubRepo', d.githubRepo, opts)
      setValue('repoUrl', d.repoUrl, opts)
      if (d.demoUrl) setValue('demoUrl', d.demoUrl, opts)
      if (d.summary_en && !getValues('summary_en')) setValue('summary_en', d.summary_en, opts)
      setValue('year', d.year, opts)
      const merged = Array.from(new Set([...getValues('skillIds'), ...d.skillIds]))
      setValue('skillIds', merged, opts)
      const extra = [d.language, ...d.topics].filter(Boolean).join(', ')
      setImportNote(
        `Terisi: URL repo, tahun, ${d.demoUrl ? 'URL demo, ' : ''}${d.skillIds.length} skill cocok.` +
          (extra ? ` Topik repo: ${extra}.` : '') +
          ' Teks bahasa Indonesia tetap ditulis manual.',
      )
    })
  }

  const langFields = (lang: Lang) => (
    <>
      <Field
        id={`title_${lang}`}
        label={lang === 'id' ? 'Judul' : 'Title'}
        error={errors[`title_${lang}`]?.message}
      >
        {(a) => <Input {...a} {...register(`title_${lang}`, { onBlur: fillSlug })} />}
      </Field>
      <Field
        id={`role_${lang}`}
        label={lang === 'id' ? 'Peran saya (opsional)' : 'My role (optional)'}
        hint={
          lang === 'id'
            ? 'Tampil di atas judul, mis. Front-End Developer. Kosongkan bila tidak ada.'
            : 'Shown above the title, e.g. Front-End Developer.'
        }
        error={errors[`role_${lang}`]?.message}
      >
        {(a) => <Input autoComplete="off" {...a} {...register(`role_${lang}`)} />}
      </Field>
      <Field
        id={`summary_${lang}`}
        label={lang === 'id' ? 'Ringkasan' : 'Summary'}
        hint={
          lang === 'id'
            ? 'Satu kalimat untuk kartu project, maksimal 240 karakter.'
            : 'One sentence for the project card.'
        }
        error={errors[`summary_${lang}`]?.message}
      >
        {(a) => <Textarea rows={2} {...a} {...register(`summary_${lang}`)} />}
      </Field>
      <Field
        id={`description_${lang}`}
        label={lang === 'id' ? 'Deskripsi' : 'Description'}
        hint={
          lang === 'id'
            ? 'Masalah, peran saya, teknologi, hasil. Saat ini tidak tampil di halaman detail (hanya foto dan tombol, keputusan pemilik 2026-10-08), tetap dipakai API.'
            : 'Problem, my role, stack, outcome. Not shown on the detail page for now.'
        }
        error={errors[`description_${lang}`]?.message}
      >
        {(a) => (
          <Controller
            control={control}
            name={`description_${lang}`}
            render={({ field }) => <MarkdownEditor {...a} {...field} rows={6} />}
          />
        )}
      </Field>
      <Field
        id={`caseStudy_${lang}`}
        label={lang === 'id' ? 'Studi kasus (opsional)' : 'Case study (optional)'}
        hint="Saat ini tidak ditampilkan di halaman detail project (keputusan pemilik 2026-10-08)."
        error={errors[`caseStudy_${lang}`]?.message}
      >
        {(a) => (
          <Controller
            control={control}
            name={`caseStudy_${lang}`}
            render={({ field }) => <MarkdownEditor {...a} {...field} rows={12} />}
          />
        )}
      </Field>
    </>
  )

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <h2 className="text-h3 font-semibold">Isi dua bahasa</h2>
        <BilingualTabs
          errors={countLangErrors(errors)}
          id={langFields('id')}
          en={langFields('en')}
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-h3 font-semibold">Impor dari GitHub</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <Field
            id="githubRepo"
            label="Repo GitHub"
            hint="Format pemilik/nama-repo. Mengisi URL repo, URL demo, tahun, dan skill yang cocok."
            error={errors.githubRepo?.message}
            className="flex-1"
          >
            {(a) => (
              <Input
                placeholder="HorizonMirza/nama-repo"
                autoComplete="off"
                {...a}
                {...register('githubRepo')}
              />
            )}
          </Field>
          <Button
            type="button"
            variant="secondary"
            onClick={runImport}
            disabled={importing}
            className="sm:mt-7"
          >
            <Download aria-hidden="true" />
            {importing ? 'Memuat…' : 'Impor'}
          </Button>
        </div>
        <p role="status" className="text-sm text-muted empty:hidden">
          {importNote}
        </p>
      </Card>

      <Card className="grid gap-5 md:grid-cols-2">
        <h2 className="text-h3 font-semibold md:col-span-2">Detail</h2>
        <Field
          id="slug"
          label="Slug"
          hint="Bagian URL: /projects/slug"
          error={errors.slug?.message}
        >
          {(a) => <Input autoComplete="off" {...a} {...register('slug')} />}
        </Field>
        <Field id="year" label="Tahun" error={errors.year?.message}>
          {(a) => (
            <Input
              type="number"
              inputMode="numeric"
              {...a}
              {...register('year', { valueAsNumber: true })}
            />
          )}
        </Field>
        <Field id="category" label="Kategori" error={errors.category?.message}>
          {(a) => (
            <NativeSelect {...a} {...register('category')}>
              {Object.entries(projectCategoryLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>
        <Field
          id="status"
          label="Status"
          hint="Draf tidak tampil di situs publik."
          error={errors.status?.message}
        >
          {(a) => (
            <NativeSelect {...a} {...register('status')}>
              <option value="DRAFT">Draf</option>
              <option value="PUBLISHED">Terbit</option>
            </NativeSelect>
          )}
        </Field>
        <Field id="demoUrl" label="URL demo (opsional)" error={errors.demoUrl?.message}>
          {(a) => <Input type="url" inputMode="url" {...a} {...register('demoUrl')} />}
        </Field>
        <Field id="repoUrl" label="URL repo (opsional)" error={errors.repoUrl?.message}>
          {(a) => <Input type="url" inputMode="url" {...a} {...register('repoUrl')} />}
        </Field>
        <fieldset className="flex flex-col gap-1 md:col-span-2">
          <legend className="text-sm font-medium">Tombol di halaman detail</legend>
          <p className="text-sm text-muted">
            Pilih keduanya, salah satu, atau tidak sama sekali. Tombol hanya tampil bila URL-nya
            diisi.
          </p>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" className="size-5 accent-primary" {...register('showDemo')} />
            <span>Tampilkan tombol &quot;Lihat aplikasi&quot; (URL demo)</span>
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" className="size-5 accent-primary" {...register('showRepo')} />
            <span>Tampilkan tombol &quot;GitHub&quot; (URL repo)</span>
          </label>
        </fieldset>
        <label className="flex min-h-11 items-center gap-3 md:col-span-2">
          <input type="checkbox" className="size-5 accent-primary" {...register('featured')} />
          <span>Tampilkan sebagai project unggulan di beranda</span>
        </label>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-h3 font-semibold">Skill yang dipakai</h2>
        {errors.skillIds?.message ? (
          <p className="text-sm text-danger">{errors.skillIds.message}</p>
        ) : null}
        {skillGroups.length === 0 ? (
          <p className="text-sm text-muted">Belum ada skill. Tambahkan di menu Skill.</p>
        ) : (
          <Controller
            control={control}
            name="skillIds"
            render={({ field }) => (
              <div className="flex flex-col gap-5">
                {skillGroups.map((group) => (
                  <fieldset key={group.id}>
                    <legend className="mb-2 text-sm font-medium text-muted">{group.name}</legend>
                    <div className="flex flex-wrap gap-2">
                      {group.skills.map((skill) => {
                        const checked = field.value.includes(skill.id)
                        return (
                          <label
                            key={skill.id}
                            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-sm has-checked:border-primary has-checked:bg-primary/10 has-focus-visible:outline-2 has-focus-visible:outline-primary"
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={() =>
                                field.onChange(
                                  checked
                                    ? field.value.filter((v) => v !== skill.id)
                                    : [...field.value, skill.id],
                                )
                              }
                            />
                            {skill.name}
                          </label>
                        )
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
            )}
          />
        )}
      </Card>

      <FormFooter
        pending={pending}
        cancelHref="/admin/projects"
        submitLabel={projectId ? 'Simpan' : 'Buat project'}
      />
    </form>
  )
}
