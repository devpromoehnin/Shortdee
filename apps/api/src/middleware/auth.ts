import type { FastifyRequest, FastifyReply } from 'fastify'
import { Errors } from '../lib/errors.js'

/**
 * Auth preHandler — verifies the request is authenticated.
 *
 * TODO(Phase 2.2): verify the Supabase JWT signature and decode the real
 * user id. For now it only checks that a Bearer token is present.
 */
export async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw Errors.unauthorized()
  }
  request.userId = 'stub-user-id'
}
