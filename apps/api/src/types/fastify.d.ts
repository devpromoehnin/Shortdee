import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    /** Authenticated user id, set by the `authenticate` preHandler. */
    userId?: string
  }
}
