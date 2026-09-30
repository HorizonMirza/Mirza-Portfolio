'use client'

import type { ReactNode } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Tab ID/EN untuk isian dua bahasa. Kedua panel tetap ter-mount agar validasi berjalan di keduanya,
// dan jumlah galat tampil di label tab supaya galat di tab tersembunyi tetap terlihat.
export function BilingualTabs({
  errors,
  id,
  en,
}: {
  errors: { id: number; en: number }
  id: ReactNode
  en: ReactNode
}) {
  return (
    <Tabs defaultValue="id">
      <TabsList aria-label="Bahasa isian">
        <TabsTrigger value="id">
          Indonesia
          <ErrorCount count={errors.id} />
        </TabsTrigger>
        <TabsTrigger value="en">
          English
          <ErrorCount count={errors.en} />
        </TabsTrigger>
      </TabsList>
      <TabsContent
        value="id"
        forceMount
        className="flex flex-col gap-5 data-[state=inactive]:hidden"
      >
        {id}
      </TabsContent>
      <TabsContent
        value="en"
        forceMount
        className="flex flex-col gap-5 data-[state=inactive]:hidden"
      >
        {en}
      </TabsContent>
    </Tabs>
  )
}

function ErrorCount({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-xs font-semibold text-white dark:text-bg">
      {count}
      <span className="sr-only"> galat</span>
    </span>
  )
}

// Hitung galat per bahasa dari nama field berakhiran _id / _en.
export function countLangErrors(errors: Record<string, unknown>) {
  const keys = Object.keys(errors)
  return {
    id: keys.filter((k) => k.endsWith('_id')).length,
    en: keys.filter((k) => k.endsWith('_en')).length,
  }
}
