import { randomBytes, createHash } from 'node:crypto'
import { env } from './env.js'
import { AppError } from './errors.js'

/**
 * TikTok OAuth (v2) — Login Kit with PKCE. See commands.md Phase 7.1.
 * The video publishing calls live in workers/publisher.
 */

const AUTHORIZE_URL = 'https://www.tiktok.com/v2/auth/authorize/'
const TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/'
const SCOPES = 'user.info.basic,video.upload'

/**
 * Must exactly match the redirect URI registered in the TikTok app.
 * TikTok rejects localhost — set TIKTOK_REDIRECT_URI to the tunnel URL in dev.
 */
export const TIKTOK_REDIRECT_URI =
  env.TIKTOK_REDIRECT_URI ?? `${env.WEB_ORIGIN}/auth/tiktok/callback`

export function isTikTokConfigured(): boolean {
  return Boolean(env.TIKTOK_CLIENT_KEY && env.TIKTOK_CLIENT_SECRET)
}

function requireConfig(): { key: string; secret: string } {
  if (!env.TIKTOK_CLIENT_KEY || !env.TIKTOK_CLIENT_SECRET) {
    throw new AppError('TIKTOK_NOT_CONFIGURED', 'ยังไม่ได้ตั้งค่า TikTok', 503)
  }
  return { key: env.TIKTOK_CLIENT_KEY, secret: env.TIKTOK_CLIENT_SECRET }
}

/** PKCE — a fresh random verifier; its SHA-256 challenge goes in the auth URL. */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url')
}

function deriveCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url')
}

/** Builds the TikTok consent URL the user is redirected to (PKCE S256). */
export function buildAuthorizeUrl(state: string, codeVerifier: string): string {
  const { key } = requireConfig()
  const params = new URLSearchParams({
    client_key: key,
    scope: SCOPES,
    response_type: 'code',
    redirect_uri: TIKTOK_REDIRECT_URI,
    state,
    code_challenge: deriveCodeChallenge(codeVerifier),
    code_challenge_method: 'S256',
  })
  return `${AUTHORIZE_URL}?${params.toString()}`
}

export interface TikTokTokens {
  accessToken: string
  refreshToken: string
  expiresInSec: number
  openId: string
  scope: string
}

interface TikTokTokenResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  open_id?: string
  scope?: string
  error?: string
  error_description?: string
}

async function postTokenRequest(body: Record<string, string>): Promise<TikTokTokens> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  })
  const json = (await res.json().catch(() => ({}))) as TikTokTokenResponse

  if (!res.ok || json.error || !json.access_token) {
    const detail = json.error_description ?? json.error ?? `HTTP ${res.status}`
    throw new AppError('TIKTOK_OAUTH_FAILED', `เชื่อมต่อ TikTok ไม่สำเร็จ: ${detail}`, 502)
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? '',
    expiresInSec: json.expires_in ?? 0,
    openId: json.open_id ?? '',
    scope: json.scope ?? '',
  }
}

/** Exchanges an authorization code (+ PKCE verifier) for tokens. */
export function exchangeCode(code: string, codeVerifier: string): Promise<TikTokTokens> {
  const { key, secret } = requireConfig()
  return postTokenRequest({
    client_key: key,
    client_secret: secret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: TIKTOK_REDIRECT_URI,
    code_verifier: codeVerifier,
  })
}

/** Refreshes an expired access token. */
export function refreshToken(token: string): Promise<TikTokTokens> {
  const { key, secret } = requireConfig()
  return postTokenRequest({
    client_key: key,
    client_secret: secret,
    grant_type: 'refresh_token',
    refresh_token: token,
  })
}
