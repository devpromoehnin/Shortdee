import type { TranscriptSegment, WindowFeatures } from './ai.js'

const WINDOW_SECONDS = 60

/**
 * Groups transcript segments into fixed-length windows for moment analysis.
 * Audio/visual feature values are left at defaults — the AI service (Phase 4.3)
 * is responsible for richer signals; the classifier works mainly off transcript.
 */
export function buildWindows(
  segments: TranscriptSegment[],
  windowSeconds = WINDOW_SECONDS,
): WindowFeatures[] {
  const windows: WindowFeatures[] = []
  let bucket: TranscriptSegment[] = []
  let windowStart = 0

  const flush = (end: number) => {
    if (bucket.length === 0) return
    windows.push({
      start: windowStart,
      end,
      transcript: bucket
        .map((s) => s.text.trim())
        .join(' ')
        .trim(),
      audio_energy: 0,
      comment_density: 0,
      visual_change: 0,
      speaker_clarity: 1,
    })
    bucket = []
  }

  for (const segment of segments) {
    if (bucket.length === 0) windowStart = segment.start
    bucket.push(segment)
    if (segment.end - windowStart >= windowSeconds) flush(segment.end)
  }
  flush(bucket.at(-1)?.end ?? windowStart)

  return windows
}

/** Joins the transcript text of all segments overlapping [start, end]. */
export function transcriptForRange(
  segments: TranscriptSegment[],
  start: number,
  end: number,
): string {
  return segments
    .filter((s) => s.end > start && s.start < end)
    .map((s) => s.text.trim())
    .join(' ')
    .trim()
}
