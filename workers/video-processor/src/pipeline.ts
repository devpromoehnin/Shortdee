import os from 'node:os'
import path from 'node:path'
import { mkdir, rm } from 'node:fs/promises'
import type { Job } from 'bullmq'
import { prisma } from '@clipdee/database'
import { preprocessStage } from './preprocess.js'
import { transcribeStage } from './transcribe.js'
import { detectMomentsStage } from './detect-moments.js'
import { cutClipsStage } from './cut-clips.js'
import { finalizeStage } from './finalize.js'

/** Job payload — mirrors VideoJobData in apps/api/src/lib/queue.ts. */
export interface VideoJobData {
  liveStreamId: string
  storageKey: string
}

/**
 * End-to-end video processing pipeline — see ARCHITECTURE.md §3.1.
 * Stages: preprocess → transcribe → detect moments → cut clips → finalize.
 */
export async function runPipeline(job: Job<VideoJobData>): Promise<void> {
  const { liveStreamId, storageKey } = job.data
  const workDir = path.join(os.tmpdir(), 'clipdee', `job-${job.id}`)
  const log = (msg: string) => console.info(`[pipeline ${liveStreamId}] ${msg}`)

  await mkdir(workDir, { recursive: true })

  try {
    await prisma.liveStream.update({
      where: { id: liveStreamId },
      data: { status: 'PROCESSING', errorMessage: null },
    })

    // Stage 1 — preprocess: download from R2, extract audio, read metadata.
    await job.updateProgress({ stage: 'preprocess', percent: 10 })
    log('stage 1 — preprocess')
    const { videoPath, audioPath, durationSec } = await preprocessStage(storageKey, workDir)
    await prisma.liveStream.update({
      where: { id: liveStreamId },
      data: { durationSeconds: Math.round(durationSec) },
    })

    // Stage 2 — transcribe via the AI service (Whisper).
    await job.updateProgress({ stage: 'transcribe', percent: 30 })
    log('stage 2 — transcribe')
    const segments = await transcribeStage(audioPath)

    // Stage 3 — detect Commerce Moments and save them.
    await job.updateProgress({ stage: 'detect-moments', percent: 55 })
    log('stage 3 — detect moments')
    const momentCount = await detectMomentsStage(liveStreamId, segments)

    // Stage 4 — cut high-scoring moments into 9:16 clips.
    await job.updateProgress({ stage: 'cut-clips', percent: 75 })
    log('stage 4 — cut clips')
    const clipCount = await cutClipsStage(liveStreamId, videoPath, segments, workDir)

    // Stage 5 — finalize.
    await job.updateProgress({ stage: 'finalize', percent: 95 })
    await finalizeStage(liveStreamId)

    await job.updateProgress({ stage: 'done', percent: 100 })
    log(`done — ${momentCount} moments, ${clipCount} clips`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[pipeline ${liveStreamId}] failed: ${message}`)
    await prisma.liveStream
      .update({
        where: { id: liveStreamId },
        data: { status: 'FAILED', errorMessage: message },
      })
      .catch(() => undefined)
    throw err // surface to BullMQ for retry / failure tracking
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined)
  }
}
