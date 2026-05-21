import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import type { Readable } from 'node:stream'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { env } from './env.js'

/** Cloudflare R2 (S3-compatible) client for the worker. */
const client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
})

export const R2_BUCKETS = {
  uploads: env.R2_BUCKET_UPLOADS,
  clips: env.R2_BUCKET_CLIPS,
}

/** Streams an R2 object to a local file. */
export async function downloadToFile(
  bucket: string,
  key: string,
  destPath: string,
): Promise<void> {
  const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  if (!res.Body) {
    throw new Error(`R2 object not found: ${bucket}/${key}`)
  }
  await pipeline(res.Body as Readable, createWriteStream(destPath))
}
