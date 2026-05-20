import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 rounded-full bg-accent/20 px-4 py-1 text-sm font-medium text-secondary">
        คลิปดี · AI Live-to-Shorts
      </span>

      <h1 className="text-4xl font-bold leading-tight text-secondary md:text-6xl">
        เปลี่ยน Live ขายของ
        <br />
        ให้เป็น <span className="text-primary">Short ขายดี</span>
      </h1>

      <p className="mt-6 max-w-2xl text-lg text-ink/70">
        Live 4 ชั่วโมง → 10-30 คลิปพร้อมโพสต์ ใน 30 นาที AI ที่เข้าใจ Live Commerce ไทย
        จับ &ldquo;Commerce Moment&rdquo; ที่ขายของได้จริง
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/signup"
          className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
        >
          เริ่มใช้ฟรี
        </Link>
        <Link
          href="/pricing"
          className="rounded-lg border border-secondary/20 px-6 py-3 font-semibold text-secondary transition hover:bg-secondary/5"
        >
          ดูราคา
        </Link>
      </div>

      <p className="mt-6 text-sm text-ink/50">เริ่มต้น 399฿/เดือน · ถูกกว่าคู่แข่งสากล 3 เท่า</p>
    </main>
  )
}
