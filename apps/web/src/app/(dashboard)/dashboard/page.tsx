export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary">แดชบอร์ด</h1>
      <p className="mt-1 text-ink/60">ภาพรวมการใช้งานของคุณ</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'ไลฟ์ทั้งหมด', value: '0' },
          { label: 'คลิปที่สร้าง', value: '0' },
          { label: 'เครดิตคงเหลือ', value: '4 ชม.' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-secondary/10 bg-white p-5"
          >
            <p className="text-sm text-ink/60">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* TODO(Phase 6): real metrics from API */}
    </div>
  )
}
