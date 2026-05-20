import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-2xl font-bold text-primary">
          ClipDee
        </Link>
        <div className="rounded-xl border border-secondary/15 bg-white p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
