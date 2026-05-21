import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    /** Authenticated user id (Supabase uid), set by the `authenticate` preHandler. */
    userId?: string
    /** Authenticated user email, set by the `authenticate` preHandler. */
    userEmail?: string
  }
}
