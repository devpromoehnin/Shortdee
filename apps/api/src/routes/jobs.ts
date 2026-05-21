import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../middleware/auth.js'
import { Errors } from '../lib/errors.js'
import { getJobStatus } from '../lib/queue.js'

/**
 * Background job status routes — see commands.md Phase 3.2.
 * Reports BullMQ job state so the frontend can poll processing progress.
 */
export async function jobsRoutes(app: FastifyInstance): Promise<void> {
  // onRequest runs before schema validation (see lives.ts).
  app.addHook('onRequest', authenticate)
  const r = app.withTypeProvider<ZodTypeProvider>()

  // GET /api/jobs/:id — processing job state + progress.
  r.get(
    '/:id',
    { schema: { params: z.object({ id: z.string().min(1) }) } },
    async (request) => {
      const status = await getJobStatus(request.params.id)
      if (!status) throw Errors.notFound('ไม่พบงานประมวลผล')
      return { data: status }
    },
  )
}
