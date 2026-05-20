import type { Job } from 'bullmq'

/** Stage 3 — call AI service POST /ai/analyze, save Moments to DB. */
export async function detectMomentsStage(_job: Job): Promise<void> {
  throw new Error('detectMomentsStage not implemented — see Phase 3.2')
}
