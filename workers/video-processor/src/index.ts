import { Worker } from 'bullmq'
import IORedis from 'ioredis'
import { runPipeline } from './pipeline.js'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'
const QUEUE_NAME = 'video-processing'

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null })

const worker = new Worker(QUEUE_NAME, runPipeline, {
  connection,
  concurrency: Number(process.env.WORKER_CONCURRENCY ?? 2),
})

worker.on('ready', () => console.info(`[video-processor] listening on queue "${QUEUE_NAME}"`))
worker.on('failed', (job, err) =>
  console.error(`[video-processor] job ${job?.id ?? '?'} failed:`, err.message),
)

async function shutdown(): Promise<void> {
  await worker.close()
  await connection.quit()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

console.info('[video-processor] starting...')
