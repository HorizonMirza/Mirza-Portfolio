'use server'

import { z } from 'zod'

import type { Prisma } from '@/generated/prisma/client'
import { type ActionResult, fail, ok, toActionError, zodFieldErrors } from '@/lib/action-result'
import { writeAudit } from '@/lib/audit'
import { requireSuperAdmin } from '@/lib/auth-guard'
import {
  destroyRemoteAsset,
  getCloudinaryConfig,
  signParams,
  verifyUploadSignature,
} from '@/lib/cloudinary'
import { getDb } from '@/lib/db'
import { revalidateContent } from '@/lib/revalidate'
import { requiredText } from '@/lib/validation'

import {
  UPLOAD_TARGET_KEYS,
  UPLOAD_TARGETS,
  type UploadSignature,
  type UploadTarget,
} from './targets'

const targetSchema = z.enum(UPLOAD_TARGET_KEYS as [UploadTarget, ...UploadTarget[]])
const idSchema = z.uuid()

const NOT_CONFIGURED =
  'Unggah belum aktif: isi CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET.'

const altSchema = z.object({
  alt_id: requiredText('Teks alternatif', 200),
  alt_en: requiredText('Alt text', 200),
})

// Bagian respons Cloudinary yang dipakai. Tanda tangannya diverifikasi di server.
const uploadResultSchema = z.object({
  public_id: z.string().min(1).max(255),
  version: z.union([z.number(), z.string()]),
  signature: z.string().regex(/^[0-9a-f]{40}$/),
  resource_type: z.enum(['image', 'raw']),
  secure_url: z.url(),
  bytes: z.number().int().nonnegative(),
  format: z.string().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
})

function revalidateFor(target: UploadTarget) {
  revalidateContent(target.startsWith('profile') ? 'profile' : 'projects')
}

export async function signAssetUpload(target: unknown): Promise<ActionResult<UploadSignature>> {
  try {
    await requireSuperAdmin()
    const parsed = targetSchema.safeParse(target)
    if (!parsed.success) return fail('Tujuan unggahan tidak valid.')
    const config = getCloudinaryConfig()
    if (!config) return fail(NOT_CONFIGURED)
    const spec = UPLOAD_TARGETS[parsed.data]
    const timestamp = Math.floor(Date.now() / 1000)
    // allowed_formats hanya berlaku untuk gambar; PDF diperiksa ulang saat disimpan.
    const allowedFormats = spec.resourceType === 'image' ? spec.formats.join(',') : null
    const params: Record<string, string | number> = { folder: spec.folder, timestamp }
    if (allowedFormats) params.allowed_formats = allowedFormats
    return ok('', {
      cloudName: config.cloudName,
      apiKey: config.apiKey,
      timestamp,
      signature: signParams(params, config.apiSecret),
      folder: spec.folder,
      resourceType: spec.resourceType,
      allowedFormats,
    })
  } catch (error) {
    return toActionError(error)
  }
}

export async function attachUploadedAsset(
  target: unknown,
  targetId: unknown,
  upload: unknown,
  alt: unknown,
): Promise<ActionResult> {
  let uploadedPublicId: string | null = null
  let uploadedType: 'image' | 'raw' = 'image'
  try {
    const admin = await requireSuperAdmin()
    const config = getCloudinaryConfig()
    if (!config) return fail(NOT_CONFIGURED)
    const t = targetSchema.safeParse(target)
    const u = uploadResultSchema.safeParse(upload)
    if (!t.success || !u.success) return fail('Data unggahan tidak valid.')
    const spec = UPLOAD_TARGETS[t.data]
    const result = u.data

    if (!verifyUploadSignature(result, config.apiSecret))
      return fail('Tanda tangan unggahan tidak cocok.')
    uploadedPublicId = result.public_id
    uploadedType = result.resource_type
    // Setelah titik ini berkas sudah ada di Cloudinary: setiap penolakan juga menghapusnya.
    const reject = async (message: string, fieldErrors?: Record<string, string>) => {
      await destroyRemoteAsset(result.public_id, result.resource_type)
      uploadedPublicId = null
      return fail(message, fieldErrors)
    }

    // Pemeriksaan ulang di server: folder, tipe, format, ukuran, dan asal URL.
    const format = (result.format ?? result.public_id.split('.').pop() ?? '').toLowerCase()
    const validOrigin = result.secure_url.startsWith(
      `https://res.cloudinary.com/${config.cloudName}/`,
    )
    if (
      !result.public_id.startsWith(`${spec.folder}/`) ||
      result.resource_type !== spec.resourceType ||
      !(spec.formats as readonly string[]).includes(format) ||
      result.bytes > spec.maxBytes ||
      !validOrigin
    ) {
      return reject('Berkas ditolak: tipe atau ukuran tidak sesuai.')
    }

    let altValues: { alt_id: string; alt_en: string } | null = null
    if (spec.kind === 'IMAGE') {
      const a = altSchema.safeParse(alt)
      if (!a.success)
        return reject(
          'Teks alternatif wajib diisi dalam dua bahasa.',
          zodFieldErrors(a.error.issues),
        )
      altValues = a.data
    }

    const needsProject = t.data === 'project-cover' || t.data === 'project-gallery'
    const projectId = needsProject ? idSchema.safeParse(targetId) : null
    if (projectId && !projectId.success) return reject('Project tidak valid.')

    const replaced = await getDb().$transaction(async (tx) => {
      const asset = await tx.asset.create({
        data: {
          publicId: result.public_id,
          url: result.secure_url,
          kind: spec.kind,
          format,
          bytes: result.bytes,
          width: result.width ?? null,
          height: result.height ?? null,
          alt_id: altValues?.alt_id ?? null,
          alt_en: altValues?.alt_en ?? null,
        },
      })
      let old: { id: string; publicId: string } | null = null

      if (t.data === 'profile-photo' || t.data === 'profile-cv') {
        const field = t.data === 'profile-photo' ? 'photo' : 'cv'
        const profile = await tx.profile.findUnique({
          where: { id: 1 },
          select: {
            photo: { select: { id: true, publicId: true } },
            cv: { select: { id: true, publicId: true } },
          },
        })
        if (!profile) throw new ProfileMissingError()
        old = profile[field]
        const data: Prisma.ProfileUncheckedUpdateInput =
          field === 'photo' ? { photoId: asset.id } : { cvId: asset.id }
        await tx.profile.update({ where: { id: 1 }, data })
      } else if (t.data === 'project-cover') {
        const project = await tx.project.findUniqueOrThrow({
          where: { id: projectId!.data },
          select: { cover: { select: { id: true, publicId: true } } },
        })
        old = project.cover
        await tx.project.update({ where: { id: projectId!.data }, data: { coverId: asset.id } })
      } else {
        await tx.project.findUniqueOrThrow({ where: { id: projectId!.data }, select: { id: true } })
        const last = await tx.projectImage.aggregate({
          where: { projectId: projectId!.data },
          _max: { order: true },
        })
        await tx.projectImage.create({
          data: {
            projectId: projectId!.data,
            assetId: asset.id,
            order: (last._max.order ?? -1) + 1,
          },
        })
      }

      if (old) await tx.asset.delete({ where: { id: old.id } })
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'create',
        entity: 'Asset',
        entityId: asset.id,
        before: old ? { target: t.data, replaced: old.publicId } : null,
        after: {
          target: t.data,
          targetId: projectId?.data ?? null,
          publicId: asset.publicId,
          bytes: asset.bytes,
        },
      })
      return old
    })

    uploadedPublicId = null
    if (replaced) await destroyRemoteAsset(replaced.publicId, spec.resourceType)
    revalidateFor(t.data)
    return ok(`${spec.label} tersimpan.`)
  } catch (error) {
    // Berkas sudah di Cloudinary tapi gagal dicatat: hapus agar tidak jadi yatim.
    if (uploadedPublicId) await destroyRemoteAsset(uploadedPublicId, uploadedType)
    if (error instanceof ProfileMissingError) return fail('Simpan profil dulu sebelum mengunggah.')
    return toActionError(error)
  }
}

class ProfileMissingError extends Error {}

export async function updateAssetAlt(assetId: unknown, alt: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const id = idSchema.safeParse(assetId)
    const a = altSchema.safeParse(alt)
    if (!id.success) return fail('Berkas tidak valid.')
    if (!a.success) return fail('Periksa kembali isian.', zodFieldErrors(a.error.issues))
    const usage = await getDb().$transaction(async (tx) => {
      const before = await tx.asset.findUniqueOrThrow({
        where: { id: id.data },
        select: { alt_id: true, alt_en: true, profilePhoto: { select: { id: true } } },
      })
      const after = await tx.asset.update({
        where: { id: id.data },
        data: a.data,
        select: { alt_id: true, alt_en: true },
      })
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'update',
        entity: 'Asset',
        entityId: id.data,
        before: { alt_id: before.alt_id, alt_en: before.alt_en },
        after,
      })
      return before.profilePhoto ? 'profile' : 'projects'
    })
    revalidateContent(usage)
    return ok('Teks alternatif disimpan.')
  } catch (error) {
    return toActionError(error)
  }
}

export async function removeAsset(assetId: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const id = idSchema.safeParse(assetId)
    if (!id.success) return fail('Berkas tidak valid.')
    const removed = await getDb().$transaction(async (tx) => {
      const before = await tx.asset.findUniqueOrThrow({
        where: { id: id.data },
        select: {
          publicId: true,
          kind: true,
          profilePhoto: { select: { id: true } },
          profileCv: { select: { id: true } },
        },
      })
      // Relasi ke profil/project menjadi null, baris galeri ikut terhapus (onDelete di skema).
      await tx.asset.delete({ where: { id: id.data } })
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'delete',
        entity: 'Asset',
        entityId: id.data,
        before: { publicId: before.publicId, kind: before.kind },
      })
      return before
    })
    await destroyRemoteAsset(removed.publicId, removed.kind === 'DOCUMENT' ? 'raw' : 'image')
    revalidateContent(removed.profilePhoto || removed.profileCv ? 'profile' : 'projects')
    return ok('Berkas dihapus.')
  } catch (error) {
    return toActionError(error)
  }
}
