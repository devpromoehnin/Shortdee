import ffmpeg from 'fluent-ffmpeg'

export interface VideoMetadata {
  durationSec: number
  width: number
  height: number
}

const toError = (err: unknown): Error =>
  err instanceof Error ? err : new Error(String(err))

/**
 * Retries a flaky ffmpeg call. On loaded Windows machines spawning ffmpeg can
 * fail with exit code 3221225794 (0xC0000142 — process init failed); that is
 * transient, so a short backoff usually clears it.
 */
async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      const message = toError(err).message
      const transient = message.includes('3221225794')
      if (!transient || attempt === attempts) break
      console.warn(`[ffmpeg] ${label} attempt ${attempt} failed (${message}) — retrying`)
      await new Promise((resolve) => setTimeout(resolve, 4000 * attempt))
    }
  }
  throw toError(lastError)
}

function probeOnce(input: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(input, (err, data) => {
      if (err) return reject(toError(err))
      const video = data.streams.find((s) => s.codec_type === 'video')
      resolve({
        durationSec: data.format.duration ?? 0,
        width: video?.width ?? 0,
        height: video?.height ?? 0,
      })
    })
  })
}

function extractAudioOnce(input: string, output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .noVideo()
      // FFT denoise — cleans background noise so Whisper hallucinates less.
      .audioFilters('afftdn=nf=-25')
      .audioChannels(1)
      .audioFrequency(16000)
      .format('wav')
      .on('end', () => resolve())
      .on('error', (err) => reject(toError(err)))
      .save(output)
  })
}

/** Reads video metadata via ffprobe. */
export function probeVideo(input: string): Promise<VideoMetadata> {
  return withRetry('probe', () => probeOnce(input))
}

/** Extracts a 16kHz mono WAV — the format Whisper expects. */
export function extractAudio(input: string, output: string): Promise<void> {
  return withRetry('extract-audio', () => extractAudioOnce(input, output))
}
