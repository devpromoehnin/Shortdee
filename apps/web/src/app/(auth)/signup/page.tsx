import Link from 'next/link'

// TODO(Phase 2.2): wire Supabase Auth signup + create User row via trigger.
export default function SignupPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-secondary">สมัครสมาชิก</h1>
      <p className="mt-1 text-sm text-ink/60">เริ่มใช้ ClipDee ฟรี</p>

      <form className="mt-6 space-y-4">
        <input
          type="text"
          placeholder="ชื่อร้าน / ชื่อของคุณ"
          className="w-full rounded-lg border border-secondary/20 px-3 py-2 text-sm outline-none focus:border-primary"
        />
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
          สมัครสมาชิก
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
