import type { FastifyInstance } from 'fastify'
import { prisma } from '@clipdee/database'
import { authenticate } from '../middleware/auth.js'
import { Errors } from '../lib/errors.js'

/**
 * Auth routes — see ARCHITECTURE.md §6.1.
 * Signup/login happen client-side via Supabase; the API only reads the
 * authenticated user's profile here.
 */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/auth/me — current user's profile from our database.
  app.get('/me', { preHandler: authenticate }, async (request) => {
    const user = await prisma.user.findUnique({
      where: { id: request.userId },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        creditsMinutes: true,
        createdAt: true,
      },
    })

    if (!user) {
      // The auth user exists but the public.users row hasn't synced.
      throw Errors.notFound('ไม่พบโปรไฟล์ผู้ใช้ — ลองเข้าสู่ระบบใหม่')
    }

    return { data: user }
  })
}
