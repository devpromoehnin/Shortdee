import type { Job } from 'bullmq'

/**
 * Stage 4 — for each moment with score >= 65: FFmpeg cut, 9:16 reframe
 * (see reframe.ts), burn captions (see caption.ts), generate thumbnail.
 */
export async function cutClipsStage(_job: Job): Promise<void> {
  throw new Error('cutClipsStage not implemented — see Phase 5.1')
}
