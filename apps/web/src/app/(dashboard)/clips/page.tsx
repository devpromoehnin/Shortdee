'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ClipStatus, MomentType } from '@clipdee/types'
import { apiFetch } from '@/lib/api/client'

interface ClipItem {
  id: string
  liveTitle: string | null
  momentType: MomentType
  clipDeeScore: number
  startTimeSec: number
  endTimeSec: number
  hookText: string | null
  captionText: string
  durationSec: number
  status: ClipStatus
  playbackUrl: string
  thumbnailUrl: string | null
}

const MOMENT_LABEL: Record<MomentType, string> = {
  CF: 'CF · ปิดการขาย',
  PRODUCT_SHOWCASE: 'โชว์สินค้า',
  CUSTOMER_QA: 'ตอบคำถาม',
  PRICE_PROMO: 'ราคา/โปร',
  STORYTELLING: 'เล่าเรื่อง',
  URGENCY: 'เร่งด่วน',
  REACTION_PEAK: 'ไฮไลต์',
}

type FilterKey = 'ALL' | 'DRAFT' | 'APPROVED' | 'REJECTED'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'ทั้งหมด' },
  { key: 'DRAFT', label: 'รอรีวิว' },
  { key: 'APPROVED', label: 'อนุมัติแล้ว' },
  { key: 'REJECTED', label: 'ปฏิเสธ' },
]

function formatTime(seconds: number): string {
  const total = Math.round(seconds)
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`
}

export default function ClipsPage() {
  const [clips, setClips] = useState<ClipItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterKey>('ALL')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setClips(await apiFetch<ClipItem[]>('/api/clips'))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดคลิปไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function setStatus(id: string, status: ClipStatus) {
    setBusyId(id)
    try {
      await apiFetch(`/api/clips/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setClips((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'อัปเดตสถานะไม่สำเร็จ')
    } finally {
      setBusyId(null)
    }
  }

  const visible = useMemo(
    () => (filter === 'ALL' ? clips : clips.filter((c) => c.status === filter)),
    [clips, filter],
  )

  const approvedCount = clips.filter((c) => c.status === 'APPROVED').length

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary">คลิป</h1>
      <p className="mt-1 text-ink/60">
        รีวิว อนุมัติ และโพสต์คลิปของคุณ
        {clips.length > 0 && ` — อนุมัติแล้ว ${approvedCount}/${clips.length}`}
      </p>

      <div className="mt-5 flex gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              filter === key
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/10 text-ink/70 hover:bg-secondary/20'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
      )}

      {loading ? (
        <p className="mt-12 text-center text-ink/50">กำลังโหลด...</p>
      ) : visible.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-secondary/20 py-20 text-center text-ink/50">
          {clips.length === 0 ? 'ยังไม่มีคลิป — อัปโหลดไลฟ์เพื่อให้ AI ตัดให้' : 'ไม่มีคลิปในหมวดนี้'}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              busy={busyId === clip.id}
              onSetStatus={setStatus}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ClipCardProps {
  clip: ClipItem
  busy: boolean
  onSetStatus: (id: string, status: ClipStatus) => void
}

function ClipCard({ clip, busy, onSetStatus }: ClipCardProps) {
  const isCandidate = clip.clipDeeScore >= 65

  return (
    <div className="overflow-hidden rounded-xl border border-secondary/10 bg-white">
      <video
        src={clip.playbackUrl}
        poster={clip.thumbnailUrl ?? undefined}
        controls
        preload="metadata"
        className="aspect-[9/16] w-full bg-black object-contain"
      />
      <div className="p-3">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {MOMENT_LABEL[clip.momentType]}
          </span>
          <span
            className={`text-sm font-bold ${isCandidate ? 'text-success' : 'text-ink/40'}`}
            title="ClipDee Score"
          >
            {Math.round(clip.clipDeeScore)}
            <span className="text-xs font-normal text-ink/40">/100</span>
          </span>
        </div>

        <p className="mt-2 line-clamp-2 text-sm font-medium text-ink">
          {clip.hookText ?? clip.captionText}
        </p>
        <p className="mt-1 text-xs text-ink/50">
          {clip.liveTitle ?? 'ไม่มีชื่อ'} · {formatTime(clip.startTimeSec)}–
          {formatTime(clip.endTimeSec)} · {Math.round(clip.durationSec)} วิ
        </p>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onSetStatus(clip.id, 'APPROVED')}
            disabled={busy || clip.status === 'APPROVED'}
            className="flex-1 rounded-lg bg-success/10 py-1.5 text-sm font-semibold text-success transition hover:bg-success/20 disabled:opacity-50"
          >
            {clip.status === 'APPROVED' ? '✓ อนุมัติแล้ว' : 'อนุมัติ'}
          </button>
          <button
            onClick={() => onSetStatus(clip.id, clip.status === 'REJECTED' ? 'DRAFT' : 'REJECTED')}
            disabled={busy}
            className="flex-1 rounded-lg bg-error/10 py-1.5 text-sm font-semibold text-error transition hover:bg-error/20 disabled:opacity-50"
          >
            {clip.status === 'REJECTED' ? 'เอากลับมา' : 'ปฏิเสธ'}
          </button>
        </div>
      </div>
    </div>
  )
}
