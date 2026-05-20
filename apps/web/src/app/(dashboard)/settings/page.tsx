export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary">ตั้งค่า</h1>
      <p className="mt-1 text-ink/60">จัดการบัญชี การเชื่อมต่อ และการชำระเงิน</p>

      {/* TODO(Phase 2 / 7 / 8): profile, integrations, billing */}
      <div className="mt-8 space-y-4">
        {['โปรไฟล์', 'การเชื่อมต่อแพลตฟอร์ม', 'การชำระเงิน'].map((section) => (
          <div
            key={section}
            className="rounded-xl border border-secondary/10 bg-white p-5 text-ink/70"
          >
            {section}
          </div>
        ))}
      </div>
    </div>
  )
}
