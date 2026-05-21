import { setGlobalDispatcher, Agent } from 'undici'
import { env } from './env.js'

/**
 * HTTP client for the ClipDee AI service (apps/ai).
 * Shapes mirror the Pydantic schemas in apps/ai/app/models/schemas.py.
 */

// Transcription of a long Live can run for many minutes — disable undici's
// default 300s header/body timeouts (0 = unlimited). Keep a connect timeout
// so a genuinely-down AI service still fails fast.
setGlobalDispatcher(
  new Agent({ headersTimeout: 0, bodyTimeout: 0, connectTimeout: 15_000 }),
)

export interface TranscriptSegment {
  start: number
  end: number
  text: string
}

interface TranscriptionResult {
  segments: TranscriptSegment[]
  language: string
  duration: number
}

/** A transcript window with feature signals — input to moment detection. */
export interface WindowFeatures {
  start: number
  end: number
  transcript: string
  audio_energy: number
  comment_density: number
  visual_change: number
  speaker_clarity: number
}

/** A moment detected by the AI — mirrors MomentResult. */
export interface DetectedMoment {
  start: number
  end: number
  moment_type: string
  confidence: number
  score: number
  hook_suggestion: string
  reasoning: string
}

interface AnalyzeResult {
  moments: DetectedMoment[]
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${env.AI_SERVICE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error(
      `เชื่อมต่อ AI service ไม่ได้ (${env.AI_SERVICE_URL}) — ตรวจว่า apps/ai รันอยู่`,
    )
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`AI service ${path} ตอบกลับ ${res.status}: ${detail.slice(0, 200)}`)
  }
  return (await res.json()) as T
}

/** POST /ai/transcribe — Whisper transcription. */
export function transcribeAudio(audioPath: string): Promise<TranscriptionResult> {
  return postJson<TranscriptionResult>('/ai/transcribe', {
    audio_path: audioPath,
    language: 'th',
  })
}

/** POST /ai/analyze — Commerce Moment detection. */
export function analyzeMoments(windows: WindowFeatures[]): Promise<AnalyzeResult> {
  return postJson<AnalyzeResult>('/ai/analyze', { windows })
}
