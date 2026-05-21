import { spawn } from 'node:child_process'

/**
 * Clip rendering runs ffmpeg directly (not fluent-ffmpeg) with cwd set to the
 * job's work dir, so the burned-in .ass subtitle is referenced by a bare
 * filename — sidestepping ffmpeg's notorious Windows filtergraph path escaping.
 */

const FFMPEG = process.env.FFMPEG_PATH ?? 'ffmpeg'

// Largest centred 9:16 region of the source, scaled to 1080x1920. Commas
// inside min() are protected by single quotes from the filtergraph parser.
const REFRAME_CROP = "crop='min(iw,ih*9/16)':'min(ih,iw*16/9)',scale=1080:1920"

function runFfmpegOnce(cwd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG, args, { cwd, windowsHide: true })
    let stderr = ''
    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
      if (stderr.length > 6000) stderr = stderr.slice(-6000)
    })
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code === 0) return resolve()
      const tail = stderr.trim().split('\n').slice(-3).join(' ')
      reject(new Error(`ffmpeg exited ${code}: ${tail}`))
    })
  })
}

/** Runs ffmpeg, retrying the transient Windows 0xC0000142 spawn failure. */
async function runFfmpeg(cwd: string, args: string[], label: string): Promise<void> {
  let lastError: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await runFfmpegOnce(cwd, args)
    } catch (err) {
      lastError = err
      const message = err instanceof Error ? err.message : String(err)
      if (!message.includes('3221225794') || attempt === 3) break
      console.warn(`[ffmpeg] ${label} attempt ${attempt} failed — retrying`)
      await new Promise((resolve) => setTimeout(resolve, 4000 * attempt))
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

export interface RenderClipOptions {
  /** All files are referenced relative to this directory. */
  workDir: string
  sourceFile: string
  outputFile: string
  startSec: number
  endSec: number
  /** Optional .ass subtitle filename to burn in (clip-local timing). */
  subtitleFile?: string
}

/** Cuts [startSec, endSec] from the source, reframes to 9:16, burns captions. */
export function renderClip(opts: RenderClipOptions): Promise<void> {
  const filters = [REFRAME_CROP]
  if (opts.subtitleFile) filters.push(`ass=${opts.subtitleFile}`)

  return runFfmpeg(
    opts.workDir,
    [
      '-y',
      '-ss',
      String(opts.startSec),
      '-i',
      opts.sourceFile,
      '-t',
      String(opts.endSec - opts.startSec),
      '-vf',
      filters.join(','),
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '23',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      opts.outputFile,
    ],
    'render-clip',
  )
}

export interface ThumbnailOptions {
  workDir: string
  sourceFile: string
  outputFile: string
  atSec: number
}

/** Extracts a single 9:16 JPG frame from the source at the given time. */
export function generateThumbnail(opts: ThumbnailOptions): Promise<void> {
  return runFfmpeg(
    opts.workDir,
    [
      '-y',
      '-ss',
      String(opts.atSec),
      '-i',
      opts.sourceFile,
      '-frames:v',
      '1',
      '-vf',
      REFRAME_CROP,
      '-q:v',
      '3',
      opts.outputFile,
    ],
    'thumbnail',
  )
}
