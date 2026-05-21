import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '@clipdee/database'
import { authenticate, requireUserId } from '../middleware/auth.js'
import { buildAuthorizeUrl, exchangeCode, generateCodeVerifier } from '../lib/tiktok.js'

/**
 * Social account integrations — OAuth connect/disconnect.
 * See commands.md Phase 7.1.
 */
export async function integrationsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', authenticate)
  const r = app.withTypeProvider<ZodTypeProvider>()

  // GET /api/integrations — the user's connected social accounts.
  r.get('/', async (request) => {
    const userId = requireUserId(request)
    const accounts = await prisma.socialAccount.findMany({
      where: { userId },
      select: { platform: true, expiresAt: true, createdAt: true },
    })
    return { data: accounts }
  })

  // GET /api/integrations/tiktok/connect — the TikTok consent URL + PKCE verifier.
  r.get('/tiktok/connect', async (request) => {
    requireUserId(request)
    const state = randomUUID()
    const codeVerifier = generateCodeVerifier()
    return { data: { authorizeUrl: buildAuthorizeUrl(state, codeVerifier), codeVerifier, state } }
  })

  // POST /api/integrations/tiktok/callback — exchange the code, store tokens.
  r.post(
    '/tiktok/callback',
    {
      schema: {
        body: z.object({ code: z.string().min(1), codeVerifier: z.string().min(1) }),
      },
    },
    async (request) => {
      const userId = requireUserId(request)
      const tokens = await exchangeCode(request.body.code, request.body.codeVerifier)

      const data = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + tokens.expiresInSec * 1000),
        metadata: { openId: tokens.openId, scope: tokens.scope },
      }
      await prisma.socialAccount.upsert({
        where: { userId_platform: { userId, platform: 'TIKTOK' } },
        create: { userId, platform: 'TIKTOK', ...data },
        update: data,
      })
      return { data: { platform: 'TIKTOK', connected: true } }
    },
  )

  // DELETE /api/integrations/tiktok — disconnect.
  r.delete('/tiktok', async (request) => {
    const userId = requireUserId(request)
    await prisma.socialAccount.deleteMany({ where: { userId, platform: 'TIKTOK' } })
    return { data: { platform: 'TIKTOK', connected: false } }
  })
}
