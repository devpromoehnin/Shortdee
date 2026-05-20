import type { Metadata } from 'next'
import { Sarabun, Inter } from 'next/font/google'
import './globals.css'

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sarabun',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ClipDee — เปลี่ยน Live ขายของให้เป็น Short ขายดี',
  description:
    'AI ที่เปลี่ยน Live ขายของไทยให้เป็น Short Video พร้อมโพสต์ จับ Commerce Moment ที่ขายได้จริง',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${sarabun.variable} ${inter.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
