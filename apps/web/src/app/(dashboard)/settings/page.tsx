'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'

interface SocialAccount {
  platform: string
  createdAt: string
}

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    try {
      setAccounts(await apiFetch<SocialAccount[]>('/api/integrations'))
    } catch {
      // ignore — the section just shows "not connected"
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Surface the result of the OAuth round-trip (?tiktok=connected|error).
  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get('tiktok')
    if (result === 'connected') setNotice({ kind: 'ok', text: 'เชื่อมต่อ TikTok สำเร็จ' })
    else if (result === 'error') setNotice({ kind: 'error', text: 'เชื่อมต่อ TikTok ไม่สำเร็จ' })
    if (result) window.history.replaceState(null, '', '/settings')
  }, [])

  const tiktokConnected = accounts.some((a) => a.platform === 'TIKTOK')

  async function connectTikTok() {
    setBusy(true)
    try {
      const { authorizeUrl, codeVerifier } = await apiFetch<{
        authorizeUrl: string
        codeVerifier: string
      }>('/api/integrations/tiktok/connect')
      // PKCE verifier — needed by the callback to exchange the code.
      document.cookie = `tiktok_cv=${codeVerifier}; path=/; max-age=600; samesite=lax`
      window.location.href = authorizeUrl
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'เริ่มเชื่อมต่อไม่สำเร็จ' })
      setBusy(false)
    }
  }

  async function disconnectTikTok() {
    setBusy(true)
    try {
      await apiFetch('/api/integrations/tiktok', { method: 'DELETE' })
      await load()
      setNotice({ kind: 'ok', text: 'ยกเลิกการเชื่อมต่อ TikTok แล้ว' })
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'ยกเลิกไม่สำเร็จ' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary">ตั้งค่า</h1>
      <p className="mt-1 text-ink/60">จัดการบัญชี การเชื่อมต่อ และการชำระเงิน</p>

      {notice && (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            notice.kind === 'ok' ? 'bg-success/15 text-success' : 'bg-error/10 text-error'
          }`}
        >
          {notice.text}
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase text-ink/50">การเชื่อมต่อแพลตฟอร์ม</h2>
        <div className="mt-3 rounded-xl border border-secondary/10 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-ink">TikTok</p>
              <p className="mt-0.5 text-sm text-ink/60">
                {loading
                  ? 'กำลังตรวจสอบ...'
                  : tiktokConnected
                    ? 'เชื่อมต่อแล้ว — โพสต์คลิปขึ้น TikTok ได้'
                    : 'ยังไม่ได้เชื่อมต่อ'}
              </p>
            </div>
            {!loading &&
              (tiktokConnected ? (
                <button
                  onClick={disconnectTikTok}
                  disabled={busy}
                  className="rounded-lg border border-secondary/20 px-4 py-2 text-sm font-medium text-ink transition hover:bg-secondary/5 disabled:opacity-50"
                >
                  ยกเลิกการเชื่อมต่อ
                </button>
              ) : (
                <button
                  onClick={connectTikTok}
                  disabled={busy}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  เชื่อมต่อ TikTok
                </button>
              ))}
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase text-ink/50">โปรไฟล์ · การชำระเงิน</h2>
        <div className="mt-3 rounded-xl border border-dashed border-secondary/20 p-5 text-sm text-ink/50">
          จะเปิดให้ใช้งานใน Phase ถัดไป
        </div>
      </section>
    </div>
  )
}
