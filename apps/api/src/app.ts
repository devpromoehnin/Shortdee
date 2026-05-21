import Fastify, { type FastifyError, type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { env } from './lib/env.js'
import { AppError } from './lib/errors.js'
import { healthRoutes } from './routes/health.js'
import { authRoutes } from './routes/auth.js'
import { livesRoutes } from './routes/lives.js'
import { clipsRoutes } from './routes/clips.js'
import { jobsRoutes } from './routes/jobs.js'
import { integrationsRoutes } from './routes/integrations.js'
import { webhookRoutes } from './routes/webhooks.js'

/** Build a configured Fastify instance (no listening). */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: env.NODE_ENV === 'production' ? 'info' : 'debug' },
  })

  // Zod as the validation + serialization layer.
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  // Security + cross-cutting plugins.
  await app.register(helmet)
  await app.register(cors, { origin: env.WEB_ORIGIN, credentials: true })
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })

  // Consistent error envelope: { error: { code, message, details? } }
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details },
      })
    }
    if (error.validation) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ข้อมูลไม่ถูกต้อง',
          details: { issues: error.validation },
        },
      })
    }
    const status = error.statusCode ?? 500
    if (status >= 500) request.log.error(error)
    return reply.status(status).send({
      error: {
        code: status === 429 ? 'RATE_LIMITED' : 'INTERNAL_ERROR',
        message: status >= 500 ? 'เกิดข้อผิดพลาดในระบบ' : error.message,
      },
    })
  })

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: { code: 'NOT_FOUND', message: `ไม่พบเส้นทาง ${request.method} ${request.url}` },
    })
  })

  // Routes
  await app.register(healthRoutes)
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(livesRoutes, { prefix: '/api/lives' })
  await app.register(clipsRoutes, { prefix: '/api/clips' })
  await app.register(jobsRoutes, { prefix: '/api/jobs' })
  await app.register(integrationsRoutes, { prefix: '/api/integrations' })
  await app.register(webhookRoutes, { prefix: '/api/webhooks' })

  return app
}
