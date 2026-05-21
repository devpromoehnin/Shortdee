'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LiveStreamDTO, ProcessStatus } from '@clipdee/types'
import { UploadDropzone } from '@/components/shared/upload-dropzone'
import { apiFetch } from '@/lib/api/client'

const STATUS_BADGE: Record<ProcessStatus, { label: string; className: string }> = {
  PENDING_UPLOAD: { label: 'รออัปโหลด', className: 'bg-secondary/10 text-secondary' },
  QUEUED: { label: 'รอประมวลผล', className: 'bg-warning/15 text-warning' },
  PROCESSING: { label: 'กำลังประมวลผล', className: 'bg-primary/10 text-primary' },
  DONE: { label: 'เสร็จแล้ว', className: 'bg-success/15 text-success' },
  FAILED: { label: 'ล้มเหลว', className: 'bg-error/10 text-error' },
}

function formatDuration(seconds: number): string {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return h > 0 ? `${h} ชม. ${m} นาที` : `${m} นาที`
}

export default function LivesPage() {
  const router = useRouter()
  const [lives, setLives] = useState<LiveStreamDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  const load = useCallback(async () => {
    try {
      setLives(await apiFetch<LiveStreamDTO[]>('/api/lives'))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">ไลฟ์ของฉัน</h1>
          <p className="mt-1 text-ink/60">อัปโหลด Live แล้วให้ AI ตัดคลิปให้</p>
        </div>
        <button
          onClick={() => setShowUpload((v) => !v)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          {showUpload ? 'ปิด' : '+ อัปโหลดไลฟ์'}
        </button>
      </div>

      {showUpload && (
        <div className="mt-6">
          <UploadDropzone
            onUploaded={() => {
              setShowUpload(false)
              void load()
            }}
          />
        </div>
      )}

      {error && (
        <p className="mt-6 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
      )}

      {loading ? (
        <p className="mt-12 text-center text-ink/50">กำลังโหลด...</p>
      ) : lives.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-secondary/20 py-20 text-center text-ink/50">
          ยังไม่มีไลฟ์ — อัปโหลดเลย!
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-secondary/10">
          <table className="w-full text-sm">
            <thead className="bg-secondary/5 text-left text-xs uppercase text-ink/50">
              <tr>
                <th className="px-4 py-3 font-medium">ชื่อ</th>
                <th className="px-4 py-3 font-medium">ความยาว</th>
                <th className="px-4 py-3 font-medium">คลิป</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/10">
              {lives.map((live) => {
                const badge = STATUS_BADGE[live.status]
                return (
                  <tr
                    key={live.id}
                    onClick={() => router.push(`/lives/${live.id}`)}
                    className="cursor-pointer transition hover:bg-secondary/5"
                  >
                    <td className="px-4 py-3 font-medium text-ink">{live.title ?? 'ไม่มีชื่อ'}</td>
                    <td className="px-4 py-3 text-ink/60">
                      {formatDuration(live.durationSeconds)}
                    </td>
                    <td className="px-4 py-3 text-ink/60">{live.clipCount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
