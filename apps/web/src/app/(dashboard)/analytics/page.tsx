export default function AnalyticsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary">สถิติ</h1>
      <p className="mt-1 text-ink/60">ผลงานคลิปของคุณในรอบ 30 วัน</p>

      {/* TODO(Phase 9.1): analytics dashboard with Recharts */}
      <div className="mt-12 rounded-xl border border-dashed border-secondary/20 py-20 text-center text-ink/50">
        ยังไม่มีข้อมูลสถิติ
      </div>
    </div>
  )
}
