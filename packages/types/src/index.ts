/**
 * @clipdee/types — Shared domain types across web, api, workers.
 *
 * These mirror the Prisma enums in `@clipdee/database`. Keep in sync.
 */

// ─────────────────────────────────────────────
// Enums (string unions — mirror Prisma enums)
// ─────────────────────────────────────────────

export const PLANS = ['FREE', 'STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE'] as const
export type Plan = (typeof PLANS)[number]

export const PLATFORMS = ['TIKTOK', 'FACEBOOK', 'SHOPEE', 'UPLOAD'] as const
export type Platform = (typeof PLATFORMS)[number]

export const PROCESS_STATUSES = [
  'PENDING_UPLOAD',
  'QUEUED',
  'PROCESSING',
  'DONE',
  'FAILED',
] as const
export type ProcessStatus = (typeof PROCESS_STATUSES)[number]

/** The 7 Commerce Moment types — ClipDee's core IP. */
export const MOMENT_TYPES = [
  'CF',
  'PRODUCT_SHOWCASE',
  'CUSTOMER_QA',
  'PRICE_PROMO',
  'STORYTELLING',
  'URGENCY',
  'REACTION_PEAK',
] as const
export type MomentType = (typeof MOMENT_TYPES)[number]

export const CLIP_STATUSES = ['DRAFT', 'APPROVED', 'PUBLISHED', 'REJECTED'] as const
export type ClipStatus = (typeof CLIP_STATUSES)[number]

// ─────────────────────────────────────────────
// Commerce Moment scoring
// ─────────────────────────────────────────────

/** Weight per moment type, used in the ClipDee Score formula. */
export const MOMENT_TYPE_WEIGHTS: Record<MomentType, number> = {
  CF: 1.0,
  PRODUCT_SHOWCASE: 1.0,
  CUSTOMER_QA: 0.9,
  PRICE_PROMO: 0.85,
  URGENCY: 0.85,
  STORYTELLING: 0.7,
  REACTION_PEAK: 0.7,
}

/** Minimum ClipDee Score for a moment to become an auto-clip candidate. */
export const CLIP_SCORE_THRESHOLD = 65

/** Clip duration bounds (seconds). */
export const MIN_CLIP_DURATION_SEC = 15
export const MAX_CLIP_DURATION_SEC = 60

/** Breakdown of the weighted ClipDee Score (0-100). */
export interface ClipDeeScoreBreakdown {
  momentTypeScore: number
  commentDensityScore: number
  audioEnergyScore: number
  visualChangeScore: number
  speakerClarityScore: number
  total: number
}

// ─────────────────────────────────────────────
// Domain models (DTO shapes — API payloads)
// ─────────────────────────────────────────────

export interface MomentDTO {
  id: string
  liveStreamId: string
  startTimeSec: number
  endTimeSec: number
  momentType: MomentType
  clipDeeScore: number
  transcript: string
  hookText: string | null
  reasoning: string | null
}

export interface ClipDTO {
  id: string
  momentId: string
  liveStreamId: string
  outputKey: string
  thumbnailKey: string | null
  captionText: string
  durationSec: number
  status: ClipStatus
  createdAt: string
}

export interface LiveStreamDTO {
  id: string
  title: string | null
  platform: Platform
  durationSeconds: number
  status: ProcessStatus
  clipCount: number
  createdAt: string
  processedAt: string | null
}

// ─────────────────────────────────────────────
// API envelope
// ─────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T
  meta?: {
    page: number
    perPage: number
    total: number
  }
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
