import path from 'node:path'
import { writeFile } from 'node:fs/promises'
import { prisma } from '@clipdee/database'
import { CLIP_SCORE_THRESHOLD } from '@clipdee/types'
import type { TranscriptSegment } from './lib/ai.js'
import { buildAssSubtitle } from './lib/caption.js'
import { renderClip, generateThumbnail } from './lib/clip.js'
import { uploadFile, R2_BUCKETS } from './lib/r2.js'

/**
 * Stage 4 — turn high-scoring Moments into 9:16 Short clips: cut, reframe,
 * burn captions, generate a thumbnail, upload to R2, and create Clip records.
 *
 * A failed clip is logged and skipped — it does not fail the whole job.
 */
export async function cutClipsStage(
  liveStreamId: string,
  videoPath: string,
  segments: TranscriptSegment[],
  workDir: string,
): Promise<number> {
  const live = await prisma.liveStream.findUnique({
    where: { id: liveStreamId },
    select: { userId: true },
  })
  if (!live) throw new Error('ไม่พบไลฟ์ใน DB')

  const moments = await prisma.moment.findMany({
    where: { liveStreamId, clipDeeScore: { gte: CLIP_SCORE_THRESHOLD } },
    orderBy: { startTimeSec: 'asc' },
  })

  const sourceFile = path.basename(videoPath)
  let made = 0

  for (const moment of moments) {
    try {
      const clipFile = `clip-${moment.id}.mp4`
      const thumbFile = `clip-${moment.id}.jpg`
      const assFile = `clip-${moment.id}.ass`

      await writeFile(
        path.join(workDir, assFile),
        buildAssSubtitle(segments, moment.startTimeSec, moment.endTimeSec),
        'utf-8',
      )
      await renderClip({
        workDir,
        sourceFile,
        outputFile: clipFile,
        startSec: moment.startTimeSec,
        endSec: moment.endTimeSec,
        subtitleFile: assFile,
      })
      await generateThumbnail({
        workDir,
        sourceFile,
        outputFile: thumbFile,
        atSec: (moment.startTimeSec + moment.endTimeSec) / 2,
      })

      const outputKey = `clips/${live.userId}/${moment.id}.mp4`
      const thumbnailKey = `clips/${live.userId}/${moment.id}.jpg`
      await uploadFile(R2_BUCKETS.clips, outputKey, path.join(workDir, clipFile), 'video/mp4')
      await uploadFile(
        R2_BUCKETS.clips,
        thumbnailKey,
        path.join(workDir, thumbFile),
        'image/jpeg',
      )

      await prisma.clip.create({
        data: {
          momentId: moment.id,
          liveStreamId,
          userId: live.userId,
          outputKey,
          thumbnailKey,
          captionText: moment.transcript,
          durationSec: moment.endTimeSec - moment.startTimeSec,
        },
      })
      made++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[cut-clips] moment ${moment.id} failed: ${message}`)
    }
  }
  return made
}
