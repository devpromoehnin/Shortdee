import os from 'node:os'
import path from 'node:path'
import { mkdir, readFile, rm, stat } from 'node:fs/promises'
import { prisma } from '@clipdee/database'
import { env } from './lib/env.js'
import { downloadToFile } from './lib/r2.js'

/** TikTok video publishing (inbox / draft mode) — see commands.md Phase 7.1. */

const TIKTOK_API = 'https://open.tiktokapis.com'

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

interface TokenResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

interface TikTokEnvelope<T> {
  data?: T
  error?: { code?: string; message?: string }
}

interface InitData {
  publish_id: string
  upload_url: string
}

interface StatusData {
  status: string
  fail_reason?: string
}

async function refreshAccessToken(
  token: string,
): Promise<{ accessToken: string; refreshToken: string; expiresInSec: number }> {
  const res = await fetch(`${TIKTOK_API}/v2/oauth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: env.TIKTOK_CLIENT_KEY,
      client_secret: env.TIKTOK_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: token,
    }),
  })
  const json = (await res.json().catch(() => ({}))) as TokenResponse
  if (!res.ok || json.error || !json.access_token) {
    throw new Error(
      `รีเฟรช token TikTok ล้มเหลว: ${json.error_description ?? json.error ?? `HTTP ${res.status}`}`,
    )
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? token,
    expiresInSec: json.expires_in ?? 0,
  }
}

/** Returns a non-expired access token for the user, refreshing if needed. */
async function getValidAccessToken(userId: string): Promise<string> {
  const account = await prisma.socialAccount.findUnique({
    where: { userId_platform: { userId, platform: 'TIKTOK' } },
  })
  if (!account) throw new Error('ผู้ใช้ยังไม่ได้เชื่อมต่อบัญชี TikTok')

  const stillValid = account.expiresAt && account.expiresAt.getTime() > Date.now() + 60_000
  if (stillValid || !account.refreshToken) return account.accessToken

  const refreshed = await refreshAccessToken(account.refreshToken)
  await prisma.socialAccount.update({
    where: { userId_platform: { userId, platform: 'TIKTOK' } },
    data: {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiresAt: new Date(Date.now() + refreshed.expiresInSec * 1000),
    },
  })
  return refreshed.accessToken
}

/** Uploads a clip to the user's TikTok inbox (draft). */
export async function publishToTikTok(clipId: string): Promise<void> {
  const clip = await prisma.clip.findUnique({ where: { id: clipId } })
  if (!clip) throw new Error(`ไม่พบคลิป ${clipId}`)

  const accessToken = await getValidAccessToken(clip.userId)

  const workDir = path.join(os.tmpdir(), 'clipdee-publish')
  await mkdir(workDir, { recursive: true })
  const videoPath = path.join(workDir, `${clipId}.mp4`)

  try {
    await downloadToFile(env.R2_BUCKET_CLIPS, clip.outputKey, videoPath)
    const { size } = await stat(videoPath)

    // 1. Init the inbox upload session.
    const initRes = await fetch(`${TIKTOK_API}/v2/post/publish/inbox/video/init/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: size,
          chunk_size: size,
          total_chunk_count: 1,
        },
      }),
    })
    const init = (await initRes.json().catch(() => ({}))) as TikTokEnvelope<InitData>
    if (!initRes.ok || init.error?.code !== 'ok' || !init.data) {
      throw new Error(`TikTok init ล้มเหลว: ${init.error?.message ?? `HTTP ${initRes.status}`}`)
    }

    // 2. Upload the video bytes (single chunk).
    const video = await readFile(videoPath)
    const putRes = await fetch(init.data.upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Range': `bytes 0-${size - 1}/${size}`,
      },
      body: video,
    })
    if (!putRes.ok) {
      throw new Error(`อัปโหลดวิดีโอไป TikTok ล้มเหลว (HTTP ${putRes.status})`)
    }

    // 3. Poll until TikTok finishes ingesting the video.
    let status = 'PROCESSING_UPLOAD'
    for (let attempt = 0; attempt < 20; attempt++) {
      await sleep(3000)
      const stRes = await fetch(`${TIKTOK_API}/v2/post/publish/status/fetch/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ publish_id: init.data.publish_id }),
      })
      const st = (await stRes.json().catch(() => ({}))) as TikTokEnvelope<StatusData>
      status = st.data?.status ?? status
      if (status === 'SEND_TO_USER_INBOX' || status === 'PUBLISH_COMPLETE') break
      if (status === 'FAILED') {
        throw new Error(`TikTok ประมวลผลวิดีโอล้มเหลว: ${st.data?.fail_reason ?? ''}`)
      }
    }

    // 4. Record the result on the clip.
    await prisma.clip.update({
      where: { id: clipId },
      data: {
        status: 'PUBLISHED',
        publishedTo: {
          tiktok: {
            publishId: init.data.publish_id,
            status,
            postedAt: new Date().toISOString(),
          },
        },
      },
    })
    console.info(`[publisher] clip ${clipId} -> TikTok inbox (${status})`)
  } finally {
    await rm(videoPath, { force: true }).catch(() => undefined)
  }
}
