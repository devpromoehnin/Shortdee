import { Sidebar } from '@/components/shared/sidebar'

// TODO(Phase 2.2): protect this route group via middleware (Supabase session).
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}
