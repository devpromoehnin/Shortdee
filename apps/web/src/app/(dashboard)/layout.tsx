import { Sidebar } from '@/components/shared/sidebar'
import { createClient } from '@/lib/supabase/server'

// Route protection is enforced by middleware.ts (Supabase session).
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen">
      <Sidebar userEmail={user?.email} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}
