import type { FastifyRequest, FastifyReply } from 'fastify'
import { Errors } from '../lib/errors.js'
import { getSupabase } from '../lib/supabase.js'

/**
 * Auth preHandler — verifies the Supabase access token from the
 * `Authorization: Bearer <jwt>` header and attaches the user to the request.
 */
export async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw Errors.unauthorized()
  }

  const token = header.slice('Bearer '.length).trim()
  const { data, error } = await getSupabase().auth.getUser(token)
  if (error || !data.user) {
    throw Errors.unauthorized('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่')
  }

  request.userId = data.user.id
  request.userEmail = data.user.email ?? undefined
}
