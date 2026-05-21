import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '@clipdee/database'
import { authenticate, requireUserId } from '../middleware/auth.js'
import { Errors, AppError } from '../lib/errors.js'
import { createUploadUrl, headObject, deleteObject, R2_BUCKETS } from '../lib/r2.js'
import { enqueueVideoJob } from '../lib/queue.js'

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024 * 1024 // 4 GB
const CONTENT_TYPE_EXT: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
}

/**
 * Live stream routes — upload, processing kick-off, and CRUD.
 * See ARCHITECTURE.md §6.1 and commands.md Phase 3.1.
 */
export async function livesRoutes(app: FastifyInstance): Promise<void> {
  // onRequest runs before schema validation — unauthenticated requests get
  // 401 rather than leaking the request schema via a 400.
  app.addHook('onRequest', authenticate)
  const r = app.withTypeProvider<ZodTypeProvider>()

  // POST /api/lives/upload-url — reserve a Live + presigned R2 upload URL.
  r.post(
    '/upload-url',
    {
      schema: {
        body: z.object({
          filename: z.string().min(1).max(255),
          size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
          contentType: z.enum(['video/mp4', 'video/quicktime', 'video/webm']),
          platform: z.enum(['TIKTOK', 'FACEBOOK', 'SHOPEE', 'UPLOAD']).default('UPLOAD'),
          title: z.string().max(200).optional(),
        }),
      },
    },
    async (request) => {
      const userId = requireUserId(request)
      const { filename, size, contentType, platform, title } = request.body

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { creditsMinutes: true },
      })
      if (!user) throw Errors.notFound('ไม่พบผู้ใช้')
      if (user.creditsMinutes <= 0) throw Errors.quotaExceeded()

      const ext = CONTENT_TYPE_EXT[contentType]
      const storageKey = `uploads/${userId}/${randomUUID()}.${ext}`

      const live = await prisma.liveStream.create({
        data: {
          userId,
          platform,
          title: title ?? filename,
          storageKey,
          status: 'PENDING_UPLOAD',
          metadata: { originalFilename: filename, sizeBytes: size },
        },
        select: { id: true },
      })

      const uploadUrl = await createUploadUrl(storageKey, contentType)
      return { data: { liveStreamId: live.id, uploadUrl, storageKey } }
    },
  )

  // POST /api/lives/:id/complete — confirm upload finished, enqueue processing.
  r.post(
    '/:id/complete',
    { schema: { params: z.object({ id: z.string().uuid() }) } },
    async (request) => {
      const userId = requireUserId(request)
      const live = await prisma.liveStream.findUnique({ where: { id: request.params.id } })
      if (!live || live.userId !== userId) throw Errors.notFound('ไม่พบไลฟ์')
      if (live.status !== 'PENDING_UPLOAD') {
        throw new AppError('INVALID_STATE', 'ไลฟ์นี้เริ่มประมวลผลไปแล้ว', 409)
      }

      // Verify the file actually landed in R2 before we queue work.
      const head = await headObject(R2_BUCKETS.uploads, live.storageKey)
      if (!head) throw new AppError('UPLOAD_INCOMPLETE', 'ยังอัปโหลดไฟล์ไม่เสร็จ', 409)

      const updated = await prisma.liveStream.update({
        where: { id: live.id },
        data: { status: 'QUEUED' },
        select: { id: true, status: true },
      })
      const jobId = await enqueueVideoJob({
        liveStreamId: live.id,
        storageKey: live.storageKey,
      })
      return { data: { ...updated, jobId } }
    },
  )

  // GET /api/lives — list the user's Live streams (paginated, newest first).
  r.get(
    '/',
    {
      schema: {
        querystring: z.object({
          page: z.coerce.number().int().positive().default(1),
          perPage: z.coerce.number().int().positive().max(50).default(20),
        }),
      },
    },
    async (request) => {
      const userId = requireUserId(request)
      const { page, perPage } = request.query

      const [rows, total] = await Promise.all([
        prisma.liveStream.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * perPage,
          take: perPage,
          select: {
            id: true,
            title: true,
            platform: true,
            durationSeconds: true,
            status: true,
            createdAt: true,
            processedAt: true,
            _count: { select: { clips: true } },
          },
        }),
        prisma.liveStream.count({ where: { userId } }),
      ])

      const data = rows.map(({ _count, ...live }) => ({ ...live, clipCount: _count.clips }))
      return { data, meta: { page, perPage, total } }
    },
  )

  // GET /api/lives/:id — Live detail with its detected moments.
  r.get(
    '/:id',
    { schema: { params: z.object({ id: z.string().uuid() }) } },
    async (request) => {
      const userId = requireUserId(request)
      const live = await prisma.liveStream.findUnique({
        where: { id: request.params.id },
        include: {
          moments: { orderBy: { startTimeSec: 'asc' } },
          _count: { select: { clips: true } },
        },
      })
      if (!live || live.userId !== userId) throw Errors.notFound('ไม่พบไลฟ์')
      return { data: live }
    },
  )

  // DELETE /api/lives/:id — remove the Live (cascades moments + clips).
  r.delete(
    '/:id',
    { schema: { params: z.object({ id: z.string().uuid() }) } },
    async (request) => {
      const userId = requireUserId(request)
      const live = await prisma.liveStream.findUnique({
        where: { id: request.params.id },
        select: { id: true, userId: true, storageKey: true },
      })
      if (!live || live.userId !== userId) throw Errors.notFound('ไม่พบไลฟ์')

      // Best-effort storage cleanup; the DB cascade handles moments + clips.
      try {
        await deleteObject(R2_BUCKETS.uploads, live.storageKey)
      } catch {
        request.log.warn(`R2 cleanup skipped for ${live.storageKey}`)
      }
      await prisma.liveStream.delete({ where: { id: live.id } })
      return { data: { id: live.id, deleted: true } }
    },
  )
}
