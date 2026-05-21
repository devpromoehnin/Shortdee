import ffmpeg from 'fluent-ffmpeg'

export interface VideoMetadata {
  durationSec: number
  width: number
  height: number
}

const toError = (err: unknown): Error =>
  err instanceof Error ? err : new Error(String(err))

/** Reads video metadata via ffprobe. */
export function probeVideo(input: string): Promise<VideoMetadata> {
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

/** Extracts a 16kHz mono WAV — the format Whisper expects. */
export function extractAudio(input: string, output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(16000)
      .format('wav')
      .on('end', () => resolve())
      .on('error', (err) => reject(toError(err)))
      .save(output)
  })
}
