'use client'

import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'

const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const MAX_BYTES = 4 * 1024 * 1024 * 1024 // 4 GB

interface UploadUrlResponse {
  liveStreamId: string
  uploadUrl: string
  storageKey: string
}

interface UploadDropzoneProps {
  /** Called after a Live has been uploaded and queued for processing. */
  onUploaded: () => void
}

type Phase = 'idle' | 'requesting' | 'uploading' | 'finalizing'

const PHASE_LABEL: Record<Exclude<Phase, 'idle'>, string> = {
  requesting: 'กำลังเตรียมอัปโหลด...',
  uploading: 'กำลังอัปโหลด',
  finalizing: 'กำลังเข้าคิวประมวลผล...',
}

export function UploadDropzone({ onUploaded }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const busy = phase !== 'idle'

  async function handleFile(file: File) {
    setError(null)

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('รองรับเฉพาะไฟล์ .mp4, .mov, .webm')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('ไฟล์ใหญ่เกิน 4GB')
      return
    }

    try {
      setPhase('requesting')
      const { liveStreamId, uploadUrl } = await apiFetch<UploadUrlResponse>(
        '/api/lives/upload-url',
        {
          method: 'POST',
          body: JSON.stringify({
            filename: file.name,
            size: file.size,
            contentType: file.type,
          }),
        },
      )

      setPhase('uploading')
      setProgress(0)
      await putToR2(uploadUrl, file, setProgress)

      setPhase('finalizing')
      await apiFetch(`/api/lives/${liveStreamId}/complete`, { method: 'POST' })

      setPhase('idle')
      setProgress(0)
      onUploaded()
    } catch (e) {
      setPhase('idle')
      setProgress(0)
      setError(e instanceof Error ? e.message : 'อัปโหลดไม่สำเร็จ')
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (busy) return
    const file = e.dataTransfer.files[0]
    if (file) void handleFile(file)
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !busy && inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${
          dragging ? 'border-primary bg-primary/5' : 'border-secondary/20 hover:border-primary/50'
        } ${busy ? 'pointer-events-none opacity-70' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
            e.target.value = ''
          }}
        />

        <UploadCloud className="mx-auto h-10 w-10 text-primary" />

        {busy ? (
          <div className="mt-3">
            <p className="text-sm font-medium text-ink">
              {PHASE_LABEL[phase as Exclude<Phase, 'idle'>]}
              {phase === 'uploading' && ` ${progress}%`}
            </p>
            <div className="mx-auto mt-2 h-2 w-64 overflow-hidden rounded-full bg-secondary/10">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${phase === 'uploading' ? progress : 100}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm font-medium text-ink">
              ลากไฟล์ Live มาวาง หรือคลิกเพื่อเลือก
            </p>
            <p className="mt-1 text-xs text-ink/50">.mp4, .mov, .webm — สูงสุด 4GB</p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
      )}
    </div>
  )
}

/** Uploads the file straight to R2 via the presigned URL, reporting progress. */
function putToR2(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`อัปโหลดไป R2 ไม่สำเร็จ (${xhr.status})`))
    xhr.onerror = () => reject(new Error('เชื่อมต่อ R2 ไม่ได้ — ตรวจการตั้งค่า CORS ของ bucket'))
    xhr.send(file)
  })
}
