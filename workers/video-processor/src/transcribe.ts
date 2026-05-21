import { transcribeAudio, type TranscriptSegment } from './lib/ai.js'

/** Stage 2 — transcribe the extracted audio via the AI service (Whisper). */
export async function transcribeStage(audioPath: string): Promise<TranscriptSegment[]> {
  const { segments } = await transcribeAudio(audioPath)
  if (segments.length === 0) {
    throw new Error('ถอดเสียงไม่สำเร็จ — ไม่พบเสียงพูดในไฟล์')
  }
  return segments
}
