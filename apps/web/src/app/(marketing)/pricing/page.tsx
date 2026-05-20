import Link from 'next/link'

interface PricingPlan {
  name: string
  price: string
  hours: string
  highlight?: boolean
}

const PLANS: PricingPlan[] = [
  { name: 'Free', price: '0฿', hours: '4 ชม./เดือน' },
  { name: 'Starter', price: '399฿', hours: '20 ชม./เดือน', highlight: true },
  { name: 'Pro', price: '1,490฿', hours: '60 ชม./เดือน' },
  { name: 'Business', price: '4,990฿', hours: '200 ชม./เดือน' },
]

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <h1 className="text-center text-3xl font-bold text-secondary md:text-4xl">
        ราคาที่จับต้องได้
      </h1>
      <p className="mt-3 text-center text-ink/60">เลือกแพ็กเกจที่เหมาะกับร้านของคุณ</p>

      <div className="mt-12 grid gap-6 md:grid-cols-4">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-xl border p-6 ${
              plan.highlight
                ? 'border-primary bg-white shadow-lg'
                : 'border-secondary/15 bg-white'
            }`}
          >
            {plan.highlight && (
              <span className="mb-2 inline-block rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                แนะนำ
              </span>
            )}
            <h2 className="text-lg font-semibold text-secondary">{plan.name}</h2>
            <p className="mt-2 text-3xl font-bold text-ink">{plan.price}</p>
            <p className="mt-1 text-sm text-ink/60">{plan.hours}</p>
            <Link
              href="/signup"
              className="mt-4 block rounded-lg bg-secondary py-2 text-center text-sm font-semibold text-secondary-foreground transition hover:opacity-90"
            >
              เลือกแพ็กเกจ
            </Link>
          </div>
        ))}
      </div>
    </main>
  )
}
