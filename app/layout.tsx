import type { Metadata } from 'next'
import { Bebas_Neue, Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/app/components/Navbar'
const bebasNeue = Bebas_Neue({
  weight: '400',
  variable: '--bebas',
  subsets: ['latin'],
})

const inter = Inter({
  variable: '--inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'FIFA WC 2026',
  description: 'Your Fantasy Football app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-wc-black text-white">
        <Navbar />
        {children}
      </body>
    </html>
  )
}
