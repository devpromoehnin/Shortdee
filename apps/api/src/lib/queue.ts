import { Queue, type JobProgress } from 'bullmq'
import IORedis from 'ioredis'
import { env } from './env.js'
import { AppError } from './errors.js'

/** Queue names — must match the workers. */
export const VIDEO_QUEUE = 'video-processing'
export const PUBLISH_QUEUE = 'publishing'

/** Job payload — mirrors VideoJobData in workers/video-processor. */
export interface VideoJobData {
  liveStreamId: string
  storageKey: string
}

/** Job payload — mirrors PublishJobData in workers/publisher. */
export interface PublishJobData {
  clipId: string
  platforms: string[]
}

const JOB_OPTS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 10_000 },
  removeOnComplete: { age: 86_400 },
  removeOnFail: { age: 604_800 },
}

let connection: IORedis | undefined
let videoQueue: Queue<VideoJobData> | undefined
let publishQueue: Queue<PublishJobData> | undefined

function getConnection(): IORedis {
  if (!env.REDIS_URL) {
    throw new AppError('QUEUE_NOT_CONFIGURED', 'ระบบประมวลผลยังไม่พร้อมใช้งาน', 503)
  }
  if (!connection) {
    connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null })
  }
  return connection
}

function getVideoQueue(): Queue<VideoJobData> {
  if (!videoQueue) {
    videoQueue = new Queue<VideoJobData>(VIDEO_QUEUE, { connection: getConnection() })
  }
  return videoQueue
}

function getPublishQueue(): Queue<PublishJobData> {
  if (!publishQueue) {
    publishQueue = new Queue<PublishJobData>(PUBLISH_QUEUE, { connection: getConnection() })
  }
  return publishQueue
}

/** Enqueue a Live recording for processing. Returns the BullMQ job id. */
export async function enqueueVideoJob(data: VideoJobData): Promise<string> {
  const job = await getVideoQueue().add('process', data, JOB_OPTS)
  return job.id as string
}

/** Enqueue a clip for publishing. Returns the BullMQ job id. */
export async function enqueuePublishJob(data: PublishJobData): Promise<string> {
  const job = await getPublishQueue().add('publish', data, JOB_OPTS)
  return job.id as string
}

export interface JobStatus {
  id: string
  state: string
  progress: JobProgress
  failedReason: string | null
}

/** Look up a video-processing job's current state + progress. */
export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  const job = await getVideoQueue().getJob(jobId)
  if (!job) return null
  return {
    id: job.id as string,
    state: await job.getState(),
    progress: job.progress,
    failedReason: job.failedReason ?? null,
  }
}
