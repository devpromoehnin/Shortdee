import type { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth.js'
import { Errors } from '../lib/errors.js'

/**
 * Live stream routes — see ARCHITECTURE.md §6.1.
 * TODO(Phase 3.1): upload-url, complete, list, delete, reprocess.
 */
export async function livesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  // GET /api/lives — list the user's live streams (paginated)
  app.get('/', async () => ({
    data: [],
    meta: { page: 1, perPage: 20, total: 0 },
  }))

  // GET /api/lives/:id
  app.get('/:id', async () => {
    throw Errors.notFound('ยังไม่ได้ implement — ดู Phase 3.1')
  })
}
