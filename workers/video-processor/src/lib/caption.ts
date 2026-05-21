import type { TranscriptSegment } from './ai.js'

/**
 * Builds an ASS subtitle for a clip spanning [clipStart, clipEnd] of the
 * source, with timings rebased to the clip's local timeline (starting at 0).
 *
 * Styled for 9:16 1080x1920 video — bottom-centred, inside the mobile-safe
 * area (clear of the TikTok/Reels UI).
 */
export function buildAssSubtitle(
  segments: TranscriptSegment[],
  clipStart: number,
  clipEnd: number,
): string {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Sarabun,58,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,3,1,2,80,80,340,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`

  const dialogue = segments
    .filter((s) => s.end > clipStart && s.start < clipEnd && s.text.trim())
    .map((s) => {
      const start = Math.max(0, s.start - clipStart)
      const end = Math.min(clipEnd - clipStart, s.end - clipStart)
      return `Dialogue: 0,${assTime(start)},${assTime(end)},Default,,0,0,0,,${assText(s.text)}`
    })

  return header + dialogue.join('\n') + '\n'
}

/** Seconds -> ASS timestamp H:MM:SS.cc */
function assTime(seconds: number): string {
  const s = Math.max(0, seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  const cs = Math.round((s - Math.floor(s)) * 100)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${h}:${pad(m)}:${pad(sec)}.${pad(cs)}`
}

/** Escapes text for an ASS dialogue line. */
function assText(text: string): string {
  return text.trim().replace(/\r?\n/g, ' ').replace(/[{}]/g, '')
}
