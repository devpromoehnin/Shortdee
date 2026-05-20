import type { Job } from 'bullmq'
import type { Platform } from '@clipdee/types'
import { publishToTikTok } from './tiktok.js'
import { publishToFacebook } from './facebook.js'
import { publishToYouTube } from './youtube.js'

export interface PublishJobData {
  clipId: string
  platforms: Platform[]
}

/**
 * Publish a clip to one or more platforms in parallel.
 * TODO(Phase 7): OAuth token refresh, per-platform caption, retry logic.
 */
export async function publishClip(job: Job<PublishJobData>): Promise<void> {
  const { clipId, platforms } = job.data
  console.info(`[publisher] publishing clip ${clipId} to ${platforms.join(', ')}`)

  await Promise.all(
    platforms.map((platform) => {
      switch (platform) {
        case 'TIKTOK':
          return publishToTikTok(clipId)
        case 'FACEBOOK':
          return publishToFacebook(clipId)
        default:
          return publishToYouTube(clipId)
      }
    }),
  )
}
