import { prisma } from '@clipdee/database'
import { MOMENT_TYPES, type MomentType } from '@clipdee/types'
import { analyzeMoments, type TranscriptSegment } from './lib/ai.js'
import { buildWindows, transcriptForRange } from './lib/transcript.js'

const VALID_TYPES = new Set<string>(MOMENT_TYPES)

function isMomentType(value: string): value is MomentType {
  return VALID_TYPES.has(value)
}

/**
 * Stage 3 — detect Commerce Moments via the AI service and persist them.
 * Windows that the AI classifies as "NONE" are dropped. Returns the count saved.
 */
export async function detectMomentsStage(
  liveStreamId: string,
  segments: TranscriptSegment[],
): Promise<number> {
  const windows = buildWindows(segments)
  if (windows.length === 0) return 0

  const { moments } = await analyzeMoments(windows)

  const rows = moments
    .filter((m) => isMomentType(m.moment_type))
    .map((m) => ({
      liveStreamId,
      startTimeSec: m.start,
      endTimeSec: m.end,
      momentType: m.moment_type as MomentType,
      clipDeeScore: m.score,
      transcript: transcriptForRange(segments, m.start, m.end),
      hookText: m.hook_suggestion.trim() || null,
      reasoning: m.reasoning.trim() || null,
    }))

  if (rows.length > 0) {
    await prisma.moment.createMany({ data: rows })
  }
  return rows.length
}
