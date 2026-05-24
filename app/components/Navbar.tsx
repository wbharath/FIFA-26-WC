'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
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
  const [mobileOpen, setMobileOpen] = useState(false)

  if (pathname === '/' || pathname === '/login') return null

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-wc-black border-b border-wc-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0"
          >
            <KickbaseLogo size={32} />
            <span className="font-bebas text-xl tracking-wide text-white">
              KICK<span className="text-wc-red">BASE</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-0.5">
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

          {/* Hamburger button — mobile only */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 text-wc-muted hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-wc-border bg-wc-black">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`block px-6 py-3.5 text-sm font-medium border-b border-wc-border/40 transition-colors ${
                  pathname === href
                    ? 'text-white bg-wc-surface border-l-2 border-l-wc-red pl-5'
                    : 'text-wc-muted hover:text-white hover:bg-wc-surface'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </nav>
      {/* Spacer for fixed navbar */}
      <div className="h-16 shrink-0" />
    </>
  )
}
