import Link from 'next/link'

// TODO(Phase 2.2): wire Supabase Auth — email/password, Google OAuth, magic link.
export default function LoginPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-secondary">เข้าสู่ระบบ</h1>
      <p className="mt-1 text-sm text-ink/60">ยินดีต้อนรับกลับมา</p>

      <form className="mt-6 space-y-4">
        <input
          type="email"
          placeholder="อีเมล"
          className="w-full rounded-lg border border-secondary/20 px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <input
          type="password"
          placeholder="รหัสผ่าน"
          className="w-full rounded-lg border border-secondary/20 px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          เข้าสู่ระบบ
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-ink/60">
        ยังไม่มีบัญชี?{' '}
        <Link href="/signup" className="font-medium text-primary">
          สมัครสมาชิก
        </Link>
      </p>
    </div>
  )
}
