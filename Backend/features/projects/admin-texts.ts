// Teks tombol halaman detail project dalam dua bahasa, untuk pratinjau di admin (hanya server).

import 'server-only'

import { getTranslations } from 'next-intl/server'

export async function projectPreviewTexts() {
  const [msgId, msgEn] = await Promise.all([
    getTranslations({ locale: 'id', namespace: 'Projects' }),
    getTranslations({ locale: 'en', namespace: 'Projects' }),
  ])
  const pick = (msg: typeof msgId) => ({
    demo: msg('demo'),
    repo: msg('repo'),
    back: msg('back'),
    stack: msg('stack'),
  })
  return { id: pick(msgId), en: pick(msgEn) }
}
