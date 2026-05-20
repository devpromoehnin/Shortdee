import type { FastifyInstance } from 'fastify'

/**
 * External webhook receivers — see ARCHITECTURE.md §6.1.
 * Webhooks are unauthenticated by Bearer token; verify provider signatures.
 * TODO(Phase 7/8): omise (payments), tiktok/facebook (publish status).
 */
export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  app.post('/omise', async (_request, reply) => reply.status(501).send({
    error: { code: 'NOT_IMPLEMENTED', message: 'ดู Phase 8' },
  }))

  app.post('/tiktok', async (_request, reply) => reply.status(501).send({
    error: { code: 'NOT_IMPLEMENTED', message: 'ดู Phase 7' },
  }))
}
