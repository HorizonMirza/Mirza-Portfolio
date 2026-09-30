import { beforeEach, describe, expect, it, vi } from 'vitest'

// Semua Server Action admin wajib menolak tanpa sesi SUPER_ADMIN, sebelum menyentuh database.
const getDb = vi.fn(() => {
  throw new Error('database tidak boleh disentuh tanpa sesi admin')
})

vi.mock('@/lib/db', () => ({ getDb }))
vi.mock('next/cache', () => ({
  updateTag: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }))
vi.mock('@/lib/auth', () => ({ getAuth: vi.fn() }))
vi.mock('@/lib/auth-guard', () => {
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
async function load() {
  const projects = await import('@/features/projects/actions')
  const skills = await import('@/features/skills/actions')
  const experience = await import('@/features/experience/actions')
  const profile = await import('@/features/profile/actions')
  const messages = await import('@/features/messages/actions')
  const subscribers = await import('@/features/subscribers/actions')
  const assets = await import('@/features/assets/actions')
  const account = await import('@/features/account/actions')
  cases.push(
    ['saveProject', () => projects.saveProject(null, {})],
    ['deleteProject', () => projects.deleteProject(id)],
    ['moveProject', () => projects.moveProject(id, 'up')],
    ['importFromGithub', () => projects.importFromGithub('a/b')],
    ['saveSkillCategory', () => skills.saveSkillCategory(null, {})],
    ['deleteSkillCategory', () => skills.deleteSkillCategory(id)],
    ['moveSkillCategory', () => skills.moveSkillCategory(id, 'up')],
    ['saveSkill', () => skills.saveSkill(null, {})],
    ['deleteSkill', () => skills.deleteSkill(id)],
    ['moveSkill', () => skills.moveSkill(id, 'down')],
    ['saveExperience', () => experience.saveExperience(null, {})],
    ['deleteExperience', () => experience.deleteExperience(id)],
    ['saveProfile', () => profile.saveProfile({})],
    ['setMessageStatus', () => messages.setMessageStatus(id, 'READ')],
    ['deleteMessage', () => messages.deleteMessage(id)],
    ['deleteSubscriber', () => subscribers.deleteSubscriber(id)],
    ['signAssetUpload', () => assets.signAssetUpload('profile-photo')],
    ['attachUploadedAsset', () => assets.attachUploadedAsset('profile-photo', null, {}, {})],
    ['updateAssetAlt', () => assets.updateAssetAlt(id, {})],
    ['removeAsset', () => assets.removeAsset(id)],
    ['changePassword', () => account.changePassword({})],
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
})
