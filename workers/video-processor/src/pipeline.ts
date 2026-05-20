import type { Job } from 'bullmq'
import { transcribeStage } from './transcribe.js'
import { detectMomentsStage } from './detect-moments.js'
import { cutClipsStage } from './cut-clips.js'
import { uploadStage } from './upload.js'

export interface VideoJobData {
  liveStreamId: string
  storageKey: string
}

/**
 * End-to-end video processing pipeline — see ARCHITECTURE.md §3.1.
 *
 * Stages: preprocess → transcribe → detect moments → cut/reframe/caption →
 * upload → notify.
 *
 * TODO(Phase 3.2): implement each stage; report progress via Redis pub/sub.
 */
export async function runPipeline(job: Job<VideoJobData>): Promise<void> {
  console.info(`[pipeline] processing live ${job.data.liveStreamId}`)

  await transcribeStage(job)
  await detectMomentsStage(job)
  await cutClipsStage(job)
  await uploadStage(job)
}
