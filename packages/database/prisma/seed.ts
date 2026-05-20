/**
 * Database seed — demo data for local development.
 * Run with: pnpm db:seed
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.info('🌱 Seeding ClipDee demo data...')

  const user = await prisma.user.upsert({
    where: { email: 'demo@clipdee.ai' },
    update: {},
    create: {
      email: 'demo@clipdee.ai',
      name: 'Demo Seller',
      plan: 'STARTER',
      creditsMinutes: 1200,
    },
  })

  const live = await prisma.liveStream.create({
    data: {
      userId: user.id,
      platform: 'UPLOAD',
      title: 'ขายเสื้อ Sale ใหญ่ 5/15',
      durationSeconds: 14400,
      status: 'DONE',
      storageKey: 'demo/live-1.mp4',
      processedAt: new Date(),
      moments: {
        create: [
          {
            startTimeSec: 23,
            endTimeSec: 38,
            momentType: 'CF',
            clipDeeScore: 87,
            transcript: 'ตะกร้าเปิดแล้วนะคะ ใครอยากได้กดเลข 1 เลยค่ะ',
            hookText: 'ตะกร้าเปิดแล้ว ใครอยากได้กดเลข 1 เลย!',
            reasoning: 'ชัดเจนว่าแม่ค้าเชิญให้ลูกค้า CF — มี trigger "กดเลข 1"',
          },
          {
            startTimeSec: 72,
            endTimeSec: 95,
            momentType: 'PRODUCT_SHOWCASE',
            clipDeeScore: 82,
            transcript: 'ตัวนี้นะคะ เนื้อผ้าดีมาก ใส่สบาย ระบายอากาศ',
            hookText: 'เนื้อผ้าตัวนี้ดียังไง เดี๋ยวให้ดูใกล้ๆ',
            reasoning: 'กำลังโชว์และอธิบายคุณสมบัติสินค้า',
          },
        ],
      },
    },
    include: { moments: true },
  })

  console.info(`✅ Seeded user ${user.email}, live ${live.id} with ${live.moments.length} moments`)
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
