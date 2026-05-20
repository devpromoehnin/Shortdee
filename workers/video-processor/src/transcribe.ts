import type { Job } from 'bullmq'

/** Stage 2 — extract audio, call AI service POST /ai/transcribe. */
export async function transcribeStage(_job: Job): Promise<void> {
  throw new Error('transcribeStage not implemented — see Phase 3.2')
}
