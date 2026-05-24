import type { Metadata } from 'next'
import { Bebas_Neue, Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/app/components/Navbar'
const bebasNeue = Bebas_Neue({
  weight: '400',
  variable: '--bebas',
  subsets: ['latin']
})

const inter = Inter({
  variable: '--inter',
  subsets: ['latin']
})


export const metadata: Metadata = {
  title: 'KickBase | Your Football Community',
  description:
    'Live fixtures, match predictions, player ratings and tactical discussions — your base for World Cup 2026.',
  icons: {
    icon: '/favicon.svg'
  },
  openGraph: {
    title: 'KickBase | Your Football Community',
    description:
      'Live fixtures, match predictions, player ratings and tactical discussions — your base for World Cup 2026.',
    url: 'https://fifa-26-wc.vercel.app',
    siteName: 'KickBase',
    images: [
      {
        url: 'https://fifa-26-wc.vercel.app/og-preview.png',
        width: 1200,
        height: 630
      }
    ],
    type: 'website'
  }
}

export default function RootLayout({
  children
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
