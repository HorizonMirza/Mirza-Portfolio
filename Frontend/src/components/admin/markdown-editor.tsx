'use client'

import type { ComponentProps } from 'react'

import { useAdminT } from '@/components/admin/admin-lang'
import { MarkdownView } from '@/components/shared/markdown-view'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

// Textarea Markdown + pratinjau (tanpa editor WYSIWYG, ARCHITECTURE.md bagian 2).
export function MarkdownEditor({
  value,
  ...textareaProps
}: ComponentProps<typeof Textarea> & { value: string }) {
  const t = useAdminT()
  return (
    <Tabs defaultValue="write">
      <TabsList>
        <TabsTrigger value="write">{t('Tulis')}</TabsTrigger>
        <TabsTrigger value="preview">{t('Pratinjau')}</TabsTrigger>
      </TabsList>
      <TabsContent value="write">
        <Textarea value={value} rows={10} className="text-sm" {...textareaProps} />
        <p className="mt-2 text-xs text-muted">
          {t(
            'Markdown: **tebal**, *miring*, ## judul, - daftar, [teks](https://tautan). HTML tidak didukung.',
          )}
        </p>
      </TabsContent>
      <TabsContent value="preview">
        <div className="min-h-40 rounded-md border border-border bg-surface p-4">
          {value.trim() ? (
            <MarkdownView source={value} />
          ) : (
            <p className="text-sm text-muted">{t('Belum ada isi.')}</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
