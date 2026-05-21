import { Queue, type JobProgress } from 'bullmq'
import IORedis from 'ioredis'
import { env } from './env.js'
import { AppError } from './errors.js'

/** Queue name — must match the worker in workers/video-processor. */
export const VIDEO_QUEUE = 'video-processing'

/** Job payload — mirrors VideoJobData in workers/video-processor/src/pipeline.ts. */
export interface VideoJobData {
  liveStreamId: string
  storageKey: string
}

let connection: IORedis | undefined
let queue: Queue<VideoJobData> | undefined

function getQueue(): Queue<VideoJobData> {
  if (!env.REDIS_URL) {
    throw new AppError('QUEUE_NOT_CONFIGURED', 'ระบบประมวลผลยังไม่พร้อมใช้งาน', 503)
  }
  if (!queue) {
    connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null })
    queue = new Queue<VideoJobData>(VIDEO_QUEUE, { connection })
  }
  return queue
}

/** Enqueue a Live recording for processing. Returns the BullMQ job id. */
export async function enqueueVideoJob(data: VideoJobData): Promise<string> {
  const job = await getQueue().add('process', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: { age: 86_400 },
    removeOnFail: { age: 604_800 },
  })
  return job.id as string
}

export interface JobStatus {
  id: string
  state: string
  progress: JobProgress
  failedReason: string | null
}

/** Look up a job's current state + progress, or null if not found. */
export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  const job = await getQueue().getJob(jobId)
  if (!job) return null
  return {
    id: job.id as string,
    state: await job.getState(),
    progress: job.progress,
    failedReason: job.failedReason ?? null,
  }
}
