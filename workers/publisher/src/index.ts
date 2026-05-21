import { env } from './lib/env.js'
import { Worker } from 'bullmq'
import IORedis from 'ioredis'
import { publishClip } from './publish.js'

const QUEUE_NAME = 'publishing'

const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null })

const worker = new Worker(QUEUE_NAME, publishClip, {
  connection,
  concurrency: env.WORKER_CONCURRENCY,
})

worker.on('ready', () =>
  console.info(
    `[publisher] listening on "${QUEUE_NAME}" (concurrency ${env.WORKER_CONCURRENCY})`,
  ),
)
worker.on('completed', (job) => console.info(`[publisher] job ${job.id} completed`))
worker.on('failed', (job, err) =>
  console.error(`[publisher] job ${job?.id ?? '?'} failed: ${err.message}`),
)

async function shutdown(): Promise<void> {
  console.info('[publisher] shutting down...')
  await worker.close()
  await connection.quit()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

console.info('[publisher] starting...')
