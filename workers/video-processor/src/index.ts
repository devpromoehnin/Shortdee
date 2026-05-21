import { env } from './lib/env.js'
import { Worker } from 'bullmq'
import IORedis from 'ioredis'
import { runPipeline } from './pipeline.js'

const QUEUE_NAME = 'video-processing'

const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null })

const worker = new Worker(QUEUE_NAME, runPipeline, {
  connection,
  concurrency: env.WORKER_CONCURRENCY,
  // Long jobs renew the lock automatically while actively processing.
  lockDuration: 60_000,
})

worker.on('ready', () =>
  console.info(
    `[video-processor] listening on "${QUEUE_NAME}" (concurrency ${env.WORKER_CONCURRENCY})`,
  ),
)
worker.on('completed', (job) => console.info(`[video-processor] job ${job.id} completed`))
worker.on('failed', (job, err) =>
  console.error(`[video-processor] job ${job?.id ?? '?'} failed: ${err.message}`),
)

async function shutdown(): Promise<void> {
  console.info('[video-processor] shutting down...')
  await worker.close()
  await connection.quit()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

console.info('[video-processor] starting...')
