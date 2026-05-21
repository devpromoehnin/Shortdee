'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const inputClass =
  'w-full rounded-lg border border-secondary/20 px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50'

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink/60">กำลังโหลด...</p>}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    searchParams.get('error') ? 'เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง' : null,
  )
  const [magicSent, setMagicSent] = useState(false)

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      return
    }
    router.replace(redirectTo)
    router.refresh()
  }

  async function handleGoogle() {
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })
    if (error) setError('เชื่อมต่อ Google ไม่สำเร็จ')
  }

  async function handleMagicLink() {
    if (!email) {
      setError('กรอกอีเมลก่อนรับลิงก์')
      return
    }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })
    setLoading(false)
    if (error) {
      setError('ส่งลิงก์ไม่สำเร็จ ลองใหม่อีกครั้ง')
      return
    }
    setMagicSent(true)
  }

  if (magicSent) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-semibold text-secondary">เช็คอีเมลของคุณ</h1>
        <p className="mt-2 text-sm text-ink/60">
          เราส่งลิงก์เข้าสู่ระบบไปที่ <span className="font-medium text-ink">{email}</span> แล้ว
          กดลิงก์ในอีเมลเพื่อเข้าใช้งาน
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-secondary">เข้าสู่ระบบ</h1>
      <p className="mt-1 text-sm text-ink/60">ยินดีต้อนรับกลับมา</p>

      {error && (
        <p className="mt-4 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
      )}

      <form className="mt-6 space-y-4" onSubmit={handlePasswordLogin}>
        <input
          type="email"
          required
          placeholder="อีเมล"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className={inputClass}
        />
        <input
          type="password"
          required
          placeholder="รหัสผ่าน"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>

      <button
        type="button"
        onClick={handleMagicLink}
        disabled={loading}
        className="mt-3 w-full text-center text-sm font-medium text-primary hover:underline disabled:opacity-50"
      >
        ส่งลิงก์เข้าสู่ระบบทางอีเมลแทน
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-ink/40">
        <span className="h-px flex-1 bg-secondary/15" />
        หรือ
        <span className="h-px flex-1 bg-secondary/15" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="w-full rounded-lg border border-secondary/20 py-2 text-sm font-medium text-ink transition hover:bg-secondary/5 disabled:opacity-50"
      >
        เข้าสู่ระบบด้วย Google
      </button>

      <p className="mt-4 text-center text-sm text-ink/60">
        ยังไม่มีบัญชี?{' '}
        <Link href="/signup" className="font-medium text-primary">
          สมัครสมาชิก
        </Link>
      </p>
    </div>
  )
}
