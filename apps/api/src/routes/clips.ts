import type { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth.js'

/**
 * Clip routes — see ARCHITECTURE.md §6.1.
 * TODO(Phase 6): list, get, update, approve/reject, publish, delete.
 */
export async function clipsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  app.get('/', async () => ({
    data: [],
    meta: { page: 1, perPage: 20, total: 0 },
  }))
}
