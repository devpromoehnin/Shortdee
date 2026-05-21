import path from 'node:path'
import { downloadToFile, R2_BUCKETS } from './lib/r2.js'
import { probeVideo, extractAudio } from './lib/ffmpeg.js'

export interface PreprocessResult {
  audioPath: string
  durationSec: number
}

/** Stage 1 — download the raw recording from R2 and extract its audio. */
export async function preprocessStage(
  storageKey: string,
  workDir: string,
): Promise<PreprocessResult> {
  const ext = path.extname(storageKey) || '.mp4'
  const videoPath = path.join(workDir, `source${ext}`)
  const audioPath = path.join(workDir, 'audio.wav')

  await downloadToFile(R2_BUCKETS.uploads, storageKey, videoPath)

  const meta = await probeVideo(videoPath)
  if (!meta.durationSec) {
    throw new Error('อ่านความยาววิดีโอไม่ได้ — ไฟล์อาจเสียหาย')
  }

  await extractAudio(videoPath, audioPath)
  return { audioPath, durationSec: meta.durationSec }
}
