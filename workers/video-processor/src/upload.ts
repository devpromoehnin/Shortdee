import type { Job } from 'bullmq'

/** Stage 5 — upload processed clips to Cloudflare R2, save Clip rows. */
export async function uploadStage(_job: Job): Promise<void> {
  throw new Error('uploadStage not implemented — see Phase 3.2')
}
