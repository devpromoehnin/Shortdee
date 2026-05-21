import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '@clipdee/database'
import { authenticate, requireUserId } from '../middleware/auth.js'
import { Errors, AppError } from '../lib/errors.js'
import { createDownloadUrl, R2_BUCKETS } from '../lib/r2.js'
import { enqueuePublishJob } from '../lib/queue.js'

/**
 * Clip routes — review dashboard. See commands.md Phase 6.2.
 * Publishing (status PUBLISHED) is handled in Phase 7.
 */
export async function clipsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', authenticate)
  const r = app.withTypeProvider<ZodTypeProvider>()

  // GET /api/clips — the user's clips with presigned playback URLs.
  r.get(
    '/',
    {
      schema: {
        querystring: z.object({
          page: z.coerce.number().int().positive().default(1),
          perPage: z.coerce.number().int().positive().max(100).default(50),
        }),
      },
    },
    async (request) => {
      const userId = requireUserId(request)
      const { page, perPage } = request.query

      const [rows, total] = await Promise.all([
        prisma.clip.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * perPage,
          take: perPage,
          include: {
            moment: {
              select: {
                momentType: true,
                clipDeeScore: true,
                startTimeSec: true,
                endTimeSec: true,
                hookText: true,
              },
            },
            liveStream: { select: { title: true } },
          },
        }),
        prisma.clip.count({ where: { userId } }),
      ])

      const data = await Promise.all(
        rows.map(async (clip) => ({
          id: clip.id,
          liveTitle: clip.liveStream.title,
          momentType: clip.moment.momentType,
          clipDeeScore: clip.moment.clipDeeScore,
          startTimeSec: clip.moment.startTimeSec,
          endTimeSec: clip.moment.endTimeSec,
          hookText: clip.moment.hookText,
          captionText: clip.captionText,
          durationSec: clip.durationSec,
          status: clip.status,
          createdAt: clip.createdAt,
          playbackUrl: await createDownloadUrl(R2_BUCKETS.clips, clip.outputKey),
          thumbnailUrl: clip.thumbnailKey
            ? await createDownloadUrl(R2_BUCKETS.clips, clip.thumbnailKey)
            : null,
        })),
      )

      return { data, meta: { page, perPage, total } }
    },
  )

  // PATCH /api/clips/:id — review status, and edit the hook / moment type.
  // hookText + momentType live on the related Moment.
  r.patch(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: z
          .object({
            status: z.enum(['DRAFT', 'APPROVED', 'REJECTED']).optional(),
            hookText: z.string().max(120).optional(),
            momentType: z
              .enum([
                'CF',
                'PRODUCT_SHOWCASE',
                'CUSTOMER_QA',
                'PRICE_PROMO',
                'STORYTELLING',
                'URGENCY',
                'REACTION_PEAK',
              ])
              .optional(),
          })
          .refine((b) => Object.keys(b).length > 0, { message: 'ไม่มีข้อมูลที่จะอัปเดต' }),
      },
    },
    async (request) => {
      const userId = requireUserId(request)
      const { status, hookText, momentType } = request.body

      const clip = await prisma.clip.findUnique({
        where: { id: request.params.id },
        select: { userId: true, momentId: true },
      })
      if (!clip || clip.userId !== userId) throw Errors.notFound('ไม่พบคลิป')

      if (status) {
        await prisma.clip.update({ where: { id: request.params.id }, data: { status } })
      }
      if (hookText !== undefined || momentType !== undefined) {
        await prisma.moment.update({
          where: { id: clip.momentId },
          data: {
            ...(hookText !== undefined ? { hookText } : {}),
            ...(momentType !== undefined ? { momentType } : {}),
          },
        })
      }
      return { data: { id: request.params.id, status, hookText, momentType } }
    },
  )

  // POST /api/clips/:id/publish — queue the clip for publishing to TikTok.
  r.post(
    '/:id/publish',
    { schema: { params: z.object({ id: z.string().uuid() }) } },
    async (request) => {
      const userId = requireUserId(request)

      const clip = await prisma.clip.findUnique({
        where: { id: request.params.id },
        select: { userId: true },
      })
      if (!clip || clip.userId !== userId) throw Errors.notFound('ไม่พบคลิป')

      const tiktok = await prisma.socialAccount.findUnique({
        where: { userId_platform: { userId, platform: 'TIKTOK' } },
        select: { id: true },
      })
      if (!tiktok) {
        throw new AppError(
          'TIKTOK_NOT_CONNECTED',
          'ยังไม่ได้เชื่อมต่อ TikTok — ไปเชื่อมต่อที่หน้าตั้งค่าก่อน',
          400,
        )
      }

      const jobId = await enqueuePublishJob({
        clipId: request.params.id,
        platforms: ['TIKTOK'],
      })
      return { data: { jobId, queued: true } }
    },
  )
}
