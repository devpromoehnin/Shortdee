import type { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth.js'

/**
 * Auth routes — see ARCHITECTURE.md §6.1.
 * TODO(Phase 2.2): wire Supabase Auth (signup/login/session).
 */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.get('/me', { preHandler: authenticate }, async (request) => ({
    data: { userId: request.userId },
  }))
}
