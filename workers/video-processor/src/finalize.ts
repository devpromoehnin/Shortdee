import { prisma } from '@clipdee/database'

/** Stage 5 — mark the Live as processed. Temp files are cleaned by the pipeline. */
export async function finalizeStage(liveStreamId: string): Promise<void> {
  await prisma.liveStream.update({
    where: { id: liveStreamId },
    data: { status: 'DONE', processedAt: new Date() },
  })
}
