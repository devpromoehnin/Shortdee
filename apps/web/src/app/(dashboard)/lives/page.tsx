export default function LivesPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">ไลฟ์ของฉัน</h1>
          <p className="mt-1 text-ink/60">อัปโหลด Live แล้วให้ AI ตัดคลิปให้</p>
        </div>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
          + อัปโหลดไลฟ์
        </button>
      </div>

      {/* TODO(Phase 6.1): live stream grid + upload dropzone */}
      <div className="mt-12 rounded-xl border border-dashed border-secondary/20 py-20 text-center text-ink/50">
        ยังไม่มีไลฟ์ — อัปโหลดเลย!
      </div>
    </div>
  )
}
