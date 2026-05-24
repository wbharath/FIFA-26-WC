'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import KickbaseLogo from '@/app/components/KickbaseLogo'

const navLinks = [
  { href: '/dashboard', label: 'My Team' },
  { href: '/fixtures', label: 'Fixtures' },
  { href: '/bracket', label: 'Bracket' },
  { href: '/squad', label: 'Squad' },
  { href: '/predictions', label: 'Predictions' },
  { href: '/community', label: 'Community' },
  { href: '/tactics', label: 'Tactics' },
]

export default function Navbar() {
  const pathname = usePathname()
  if (pathname === '/' || pathname === '/login') return null

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-wc-black border-b border-wc-border">
        <div className="max-w-7xl mx-auto px-6 h-16 grid grid-cols-3 items-center">
          {/* Logo — left */}
          <Link href="/dashboard" className="flex items-center gap-2.5 whitespace-nowrap">
            <KickbaseLogo size={32} />
            <span className="font-bebas text-xl tracking-wide text-white">
              KICK<span className="text-wc-red">BASE</span>
            </span>
          </Link>

          {/* Links — center */}
          <div className="flex items-center justify-center gap-0.5">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-2 py-1 text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                  pathname === href
                    ? 'text-white border-b-2 border-wc-red'
                    : 'text-wc-muted hover:text-white'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right col — intentionally empty for balance */}
          <div />
        </div>
      </nav>
      {/* Offset for fixed navbar */}
      <div className="h-16 shrink-0" />
    </>
  )
}
