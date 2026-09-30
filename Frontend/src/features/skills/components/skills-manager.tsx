'use client'

import { Pencil, Plus } from 'lucide-react'

import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { ReorderButtons } from '@/components/admin/reorder-buttons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { deleteSkill, deleteSkillCategory, moveSkill, moveSkillCategory } from '../actions'
import type { SkillCategoryAdmin } from '../queries'
import { CategoryDialog, SkillDialog } from './skill-dialogs'

export function SkillsManager({ categories }: { categories: SkillCategoryAdmin[] }) {
  const options = categories.map((c) => ({ id: c.id, name: c.name_id }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <CategoryDialog
          categoryId={null}
          trigger={
            <Button>
              <Plus aria-hidden="true" />
              Kategori baru
            </Button>
          }
        />
      </div>

      {categories.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
          Belum ada kategori. Buat kategori dulu, lalu tambahkan skill di dalamnya.
        </p>
      ) : null}

      {categories.map((category, ci) => (
        <Card key={category.id} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-h3 font-semibold">{category.name_id}</h2>
              <p className="text-sm text-muted" lang="en">
                {category.name_en}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <ReorderButtons
                itemLabel={`kategori ${category.name_id}`}
                isFirst={ci === 0}
                isLast={ci === categories.length - 1}
                onMove={(dir) => moveSkillCategory(category.id, dir)}
              />
              <CategoryDialog
                categoryId={category.id}
                defaultValues={{ name_id: category.name_id, name_en: category.name_en }}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Ubah kategori ${category.name_id}`}
                  >
                    <Pencil aria-hidden="true" />
                    <span className="sr-only md:not-sr-only">Ubah</span>
                  </Button>
                }
              />
              <ConfirmDelete
                itemLabel={`kategori ${category.name_id}`}
                onConfirm={() => deleteSkillCategory(category.id)}
              />
            </div>
          </div>

          {category.skills.length === 0 ? (
            <p className="text-sm text-muted">Belum ada skill di kategori ini.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {category.skills.map((skill, si) => (
                <li
                  key={skill.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{skill.name}</p>
                    <p className="text-xs text-muted">
                      {skill._count.projects > 0
                        ? `Dipakai di ${skill._count.projects} project`
                        : 'Belum dipakai project'}
                      {skill.icon ? ` · ikon ${skill.icon}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <ReorderButtons
                      itemLabel={skill.name}
                      isFirst={si === 0}
                      isLast={si === category.skills.length - 1}
                      onMove={(dir) => moveSkill(skill.id, dir)}
                    />
                    <SkillDialog
                      skillId={skill.id}
                      categories={options}
                      defaultValues={{
                        name: skill.name,
                        icon: skill.icon ?? '',
                        categoryId: category.id,
                      }}
                      trigger={
                        <Button variant="ghost" size="sm" aria-label={`Ubah ${skill.name}`}>
                          <Pencil aria-hidden="true" />
                        </Button>
                      }
                    />
                    <ConfirmDelete itemLabel={skill.name} onConfirm={() => deleteSkill(skill.id)} />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div>
            <SkillDialog
              skillId={null}
              categories={options}
              defaultValues={{ name: '', icon: '', categoryId: category.id }}
              trigger={
                <Button variant="secondary" size="sm">
                  <Plus aria-hidden="true" />
                  Tambah skill ke {category.name_id}
                </Button>
              }
            />
          </div>
        </Card>
      ))}
    </div>
  )
}
