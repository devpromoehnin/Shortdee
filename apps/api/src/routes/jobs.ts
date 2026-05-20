import type { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth.js'
import { Errors } from '../lib/errors.js'

/**
 * Background job status routes — see ARCHITECTURE.md §6.1.
 * TODO(Phase 3): job status, cancel (BullMQ).
 */
export async function jobsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  app.get('/:id', async () => {
    throw Errors.notFound('ยังไม่ได้ implement — ดู Phase 3')
  })
}
