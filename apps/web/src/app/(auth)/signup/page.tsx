'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const inputClass =
  'w-full rounded-lg border border-secondary/20 px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50'

export default function SignupPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmSent, setConfirmSent] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร')
      return
    }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setLoading(false)
      setError(
        error.message.includes('already registered')
          ? 'อีเมลนี้ถูกใช้สมัครแล้ว'
          : 'สมัครสมาชิกไม่สำเร็จ ลองใหม่อีกครั้ง',
      )
      return
    }

    // Email confirmation ON → no session yet. OFF → session ready.
    if (data.session) {
      router.replace('/dashboard')
      router.refresh()
    } else {
      setLoading(false)
      setConfirmSent(true)
    }
  }

  if (confirmSent) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-semibold text-secondary">ยืนยันอีเมลของคุณ</h1>
        <p className="mt-2 text-sm text-ink/60">
          เราส่งลิงก์ยืนยันไปที่ <span className="font-medium text-ink">{email}</span> แล้ว
          กดลิงก์ในอีเมลเพื่อเริ่มใช้ ClipDee
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-secondary">สมัครสมาชิก</h1>
      <p className="mt-1 text-sm text-ink/60">เริ่มใช้ ClipDee ฟรี</p>

      {error && (
        <p className="mt-4 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
      )}

      <form className="mt-6 space-y-4" onSubmit={handleSignup}>
        <input
          type="text"
          required
          placeholder="ชื่อร้าน / ชื่อของคุณ"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          className={inputClass}
        />
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
          placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
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
          {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-ink/60">
        มีบัญชีอยู่แล้ว?{' '}
        <Link href="/login" className="font-medium text-primary">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  )
}
