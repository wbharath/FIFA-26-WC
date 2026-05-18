'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/dashboard', label: 'My Team' },
  { href: '/fixtures', label: 'Fixtures' },
  { href: '/bracket', label: 'Bracket' },
  { href: '/squad', label: 'Squad' },
  { href: '/predictions', label: 'Predictions' },
  { href: '/community', label: 'Community' }
]

export default function Navbar() {
  const pathname = usePathname()
  if (pathname === '/') return null

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-8 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <img
            src="https://crests.football-data.org/wm26.png"
            alt="FIFA WC 2026"
            className="w-9 h-9 object-contain transition-transform group-hover:scale-110"
          />
          <span className="font-black text-white text-lg tracking-tight">
            WC <span className="text-yellow-500">2026</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                pathname === href
                  ? 'bg-green-700 text-white shadow-lg shadow-green-950/60'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/70'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-green-600/50 to-transparent" />
    </nav>
  )
}
