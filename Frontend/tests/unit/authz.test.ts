// Tes unit: otorisasi Server Action admin.

import { beforeEach, describe, expect, it, vi } from 'vitest'

// Semua Server Action admin wajib menolak tanpa sesi SUPER_ADMIN, sebelum menyentuh database.
const getDb = vi.fn(() => {
  throw new Error('database tidak boleh disentuh tanpa sesi admin')
})

vi.mock('@backend/lib/db', () => ({ getDb }))
vi.mock('next/cache', () => ({
  updateTag: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }))
vi.mock('@backend/lib/auth', () => ({ getAuth: vi.fn() }))
vi.mock('@backend/lib/auth-guard', () => {
  class UnauthorizedError extends Error {}
  return {
    UnauthorizedError,
    requireSuperAdmin: vi.fn(async () => {
      throw new UnauthorizedError()
    }),
  }
})

const id = '01a0f218-0209-7656-a356-02d34f1c52c3'

const cases: [string, () => Promise<unknown>][] = []
// semua fungsi yang diekspor modul Server Action admin, untuk memastikan tidak ada yang terlewat
const exported: string[] = []
async function load() {
  const projects = await import('@backend/features/projects/actions')
  const skills = await import('@backend/features/skills/actions')
  const experience = await import('@backend/features/experience/actions')
  const profile = await import('@backend/features/profile/actions')
  const messages = await import('@backend/features/messages/actions')
  const assets = await import('@backend/features/assets/actions')
  const account = await import('@backend/features/account/actions')
  const settings = await import('@backend/features/settings/actions')
  const siteText = await import('@backend/features/site-text/actions')
  const sessions = await import('@backend/features/account/session-actions')
  for (const mod of [
    projects,
    skills,
    experience,
    profile,
    messages,
    assets,
    account,
    settings,
    siteText,
    sessions,
  ]) {
    for (const [name, value] of Object.entries(mod)) {
      if (typeof value === 'function') exported.push(name)
    }
  }
  cases.push(
    ['saveProject', () => projects.saveProject(null, {})],
    ['saveProjectTexts', () => projects.saveProjectTexts([])],
    ['deleteProject', () => projects.deleteProject(id)],
    ['moveProject', () => projects.moveProject(id, 'up')],
    ['saveSkillCategory', () => skills.saveSkillCategory(null, {})],
    ['deleteSkillCategory', () => skills.deleteSkillCategory(id)],
    ['saveSkill', () => skills.saveSkill(null, {})],
    ['deleteSkill', () => skills.deleteSkill(id)],
    ['saveExperience', () => experience.saveExperience(null, {})],
    ['deleteExperience', () => experience.deleteExperience(id)],
    ['saveProfile', () => profile.saveProfile({})],
    ['setMessageStatus', () => messages.setMessageStatus(id, 'READ')],
    ['deleteMessage', () => messages.deleteMessage(id)],
    ['signAssetUpload', () => assets.signAssetUpload('profile-photo')],
    ['attachUploadedAsset', () => assets.attachUploadedAsset('profile-photo', null, {}, {})],
    ['removeAsset', () => assets.removeAsset(id)],
    ['changePassword', () => account.changePassword({})],
    ['renameAccount', () => account.renameAccount({ name: 'Nama Baru', password: 'x' })],
    ['changeAccountEmail', () => account.changeAccountEmail({ email: 'a@b.co', password: 'x' })],
    ['revokeSession', () => sessions.revokeSession(id)],
    ['revokeOtherSessions', () => sessions.revokeOtherSessions()],
    ['saveSiteTexts', () => siteText.saveSiteTexts('about', {})],
    ['saveIntroNotice', () => settings.saveIntroNotice({})],
    ['saveGithubPalette', () => settings.saveGithubPalette({})],
    ['saveHeroRoles', () => profile.saveHeroRoles({})],
    ['saveContactLinks', () => profile.saveContactLinks({})],
    ['saveSiteOption', () => settings.saveSiteOption({ key: 'heroAnimation', value: false })],
  )
}

describe('otorisasi Server Action admin', async () => {
  await load()
  beforeEach(() => {
    getDb.mockClear()
  })

  it.each(cases)('%s menolak tanpa sesi', async (_name, run) => {
    await expect(run()).resolves.toMatchObject({
      ok: false,
      message: expect.stringMatching(/Sesi berakhir/),
    })
    expect(getDb).not.toHaveBeenCalled()
  })

  it('setiap Server Action admin yang diekspor ada di daftar uji', () => {
    expect([...exported].sort()).toEqual(cases.map(([name]) => name).sort())
  })
})
