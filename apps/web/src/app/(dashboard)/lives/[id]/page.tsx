'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { MomentType, Platform, ProcessStatus } from '@clipdee/types'
import { apiFetch } from '@/lib/api/client'

interface MomentItem {
  id: string
  startTimeSec: number
  endTimeSec: number
  momentType: MomentType
  clipDeeScore: number
  transcript: string
  hookText: string | null
  reasoning: string | null
}

interface LiveDetail {
  id: string
  title: string | null
  platform: Platform
  status: ProcessStatus
  durationSeconds: number
  errorMessage: string | null
  processedAt: string | null
  moments: MomentItem[]
}

const STATUS_BADGE: Record<ProcessStatus, { label: string; className: string }> = {
  PENDING_UPLOAD: { label: 'รออัปโหลด', className: 'bg-secondary/10 text-secondary' },
  QUEUED: { label: 'รอประมวลผล', className: 'bg-warning/15 text-warning' },
  PROCESSING: { label: 'กำลังประมวลผล', className: 'bg-primary/10 text-primary' },
  DONE: { label: 'เสร็จแล้ว', className: 'bg-success/15 text-success' },
  FAILED: { label: 'ล้มเหลว', className: 'bg-error/10 text-error' },
}

const MOMENT_BADGE: Record<MomentType, { label: string; className: string }> = {
  CF: { label: 'CF · ปิดการขาย', className: 'bg-primary/10 text-primary' },
  PRODUCT_SHOWCASE: { label: 'โชว์สินค้า', className: 'bg-accent/15 text-accent-foreground' },
  CUSTOMER_QA: { label: 'ตอบคำถาม', className: 'bg-secondary/10 text-secondary' },
  PRICE_PROMO: { label: 'ราคา/โปร', className: 'bg-success/15 text-success' },
  STORYTELLING: { label: 'เล่าเรื่อง', className: 'bg-ink/10 text-ink' },
  URGENCY: { label: 'เร่งด่วน', className: 'bg-error/10 text-error' },
  REACTION_PEAK: { label: 'ไฮไลต์', className: 'bg-warning/15 text-warning' },
}

function formatTime(seconds: number): string {
  const total = Math.round(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function LiveDetailPage() {
  const params = useParams<{ id: string }>()
  const [live, setLive] = useState<LiveDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLive(await apiFetch<LiveDetail>(`/api/lives/${params.id}`))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    void load()
  }, [load])

  // Poll while the Live is still being processed.
  useEffect(() => {
    if (live?.status !== 'QUEUED' && live?.status !== 'PROCESSING') return
    const timer = setInterval(() => void load(), 5000)
    return () => clearInterval(timer)
  }, [live?.status, load])

  if (loading) {
    return <p className="text-center text-ink/50">กำลังโหลด...</p>
  }
  if (error || !live) {
    return (
      <div>
        <BackLink />
        <p className="mt-6 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
          {error ?? 'ไม่พบไลฟ์'}
        </p>
      </div>
    )
  }

  const status = STATUS_BADGE[live.status]
  const clipCandidates = live.moments.filter((m) => m.clipDeeScore >= 65).length

  return (
    <div>
      <BackLink />

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">{live.title ?? 'ไม่มีชื่อ'}</h1>
          <p className="mt-1 text-sm text-ink/60">
            {Math.round(live.durationSeconds / 60)} นาที · {live.moments.length} moment
            {clipCandidates > 0 && ` · ${clipCandidates} ตัวพร้อมตัดคลิป`}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {live.status === 'FAILED' && live.errorMessage && (
        <p className="mt-4 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
          ประมวลผลล้มเหลว: {live.errorMessage}
        </p>
      )}

      {(live.status === 'QUEUED' || live.status === 'PROCESSING') && (
        <p className="mt-4 rounded-lg bg-primary/5 px-3 py-2 text-sm text-ink/60">
          AI กำลังวิเคราะห์ไลฟ์ — หน้านี้จะอัปเดตเองเมื่อเสร็จ
        </p>
      )}

      {live.status === 'DONE' && live.moments.length === 0 && (
        <div className="mt-12 rounded-xl border border-dashed border-secondary/20 py-16 text-center text-ink/50">
          ไม่พบ Commerce Moment ในไลฟ์นี้
        </div>
      )}

      {live.moments.length > 0 && (
        <div className="mt-6 space-y-3">
          {live.moments.map((moment) => {
            const badge = MOMENT_BADGE[moment.momentType]
            const isCandidate = moment.clipDeeScore >= 65
            return (
              <div
                key={moment.id}
                className="rounded-xl border border-secondary/10 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-xs text-ink/50">
                      {formatTime(moment.startTimeSec)} → {formatTime(moment.endTimeSec)}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      isCandidate ? 'text-success' : 'text-ink/40'
                    }`}
                    title="ClipDee Score"
                  >
                    {Math.round(moment.clipDeeScore)}
                    <span className="text-xs font-normal text-ink/40">/100</span>
                  </span>
                </div>

                {moment.hookText && (
                  <p className="mt-2 font-medium text-ink">“{moment.hookText}”</p>
                )}
                <p className="mt-1 line-clamp-2 text-sm text-ink/60">{moment.transcript}</p>
                {moment.reasoning && (
                  <p className="mt-2 text-xs text-ink/40">เหตุผล AI: {moment.reasoning}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/lives"
      className="inline-flex items-center gap-1 text-sm text-ink/60 transition hover:text-primary"
    >
      <ArrowLeft className="h-4 w-4" />
      กลับไปไลฟ์ทั้งหมด
    </Link>
  )
}
