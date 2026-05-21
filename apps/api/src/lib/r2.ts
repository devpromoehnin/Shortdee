import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from './env.js'
import { AppError } from './errors.js'

/** Cloudflare R2 is S3-compatible — see CLAUDE.md decision log. */

let client: S3Client | undefined

export const R2_BUCKETS = {
  uploads: env.R2_BUCKET_UPLOADS,
  clips: env.R2_BUCKET_CLIPS,
}

export function isR2Configured(): boolean {
  return Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY)
}

function getClient(): S3Client {
  if (!isR2Configured()) {
    throw new AppError('R2_NOT_CONFIGURED', 'ระบบจัดเก็บไฟล์ยังไม่พร้อมใช้งาน', 503)
  }
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY as string,
      },
    })
  }
  return client
}

/** Presigned PUT URL — the browser uploads a raw Live recording directly. */
export function createUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> {
  return getSignedUrl(
    getClient(),
    new PutObjectCommand({ Bucket: R2_BUCKETS.uploads, Key: key, ContentType: contentType }),
    { expiresIn },
  )
}

/** Presigned GET URL for reading an object (expires in 1 hour by default). */
export function createDownloadUrl(
  bucket: string,
  key: string,
  expiresIn = 3600,
): Promise<string> {
  return getSignedUrl(getClient(), new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn,
  })
}

/** Returns the object's size if it exists, or null if it does not. */
export async function headObject(
  bucket: string,
  key: string,
): Promise<{ sizeBytes: number } | null> {
  try {
    const res = await getClient().send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return { sizeBytes: res.ContentLength ?? 0 }
  } catch {
    return null
  }
}

export async function deleteObject(bucket: string, key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}
