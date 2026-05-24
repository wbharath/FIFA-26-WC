'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-wc-black text-white">
      <div className="border-b border-wc-border bg-wc-surface">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div className="h-3 w-36 bg-wc-border rounded animate-pulse" />
            <div className="h-8 w-24 bg-wc-border rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 rounded-full bg-wc-border animate-pulse shrink-0" />
            <div className="flex-1">
              <div className="h-3 w-24 bg-wc-border rounded animate-pulse mb-3" />
              <div className="h-12 w-64 bg-wc-border rounded animate-pulse mb-3" />
              <div className="h-3 w-32 bg-wc-border rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="h-7 w-52 bg-wc-surface rounded animate-pulse mb-6" />
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-18 bg-wc-surface rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  )
}

export default function Dashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile?.favourite_team_id) {
        router.push('/select-team')
        return
      }
      setProfile(profile)
      await loadMatches(profile.favourite_team_id)
    }
    checkUser()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function loadMatches(teamId: number) {
    const res = await fetch('/api/matches')
    const data = await res.json()
    const teamMatches = (data.fixtures || []).filter(
      (m: any) => m.teams.home.id === teamId || m.teams.away.id === teamId
    )
    setMatches(teamMatches)
  }

  if (!user || !profile) return <DashboardSkeleton />

  return (
    <main className="min-h-screen bg-wc-black text-white">
      {/* Hero */}
      <div className="border-b border-wc-border bg-wc-surface">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <p className="text-wc-muted text-xs font-semibold uppercase tracking-widest">
              FIFA World Cup 2026
            </p>
            <div className="flex items-center gap-3">
              <span className="text-wc-muted text-sm hidden sm:block">{user.email}</span>
              <button
                onClick={signOut}
                className="border border-wc-border text-wc-muted hover:text-white hover:border-white px-4 py-1.5 rounded text-sm font-semibold uppercase tracking-wide transition-all duration-150"
              >
                Sign out
              </button>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="relative shrink-0">
              <div className="absolute inset-0 blur-2xl bg-wc-red/20 rounded-full scale-[1.8]" />
              <img
                src={profile.favourite_team_crest}
                alt={profile.favourite_team_name}
                className="relative w-24 h-24 object-contain drop-shadow-2xl"
                loading="lazy"
              />
            </div>
            <div>
              <p className="text-wc-muted text-xs font-semibold uppercase tracking-[0.25em] mb-2">
                Supporting
              </p>
              <h1 className="font-bebas text-5xl sm:text-6xl uppercase leading-tight">
                {profile.favourite_team_name}
              </h1>
              <div className="mt-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-wc-neon rounded-full live-dot" />
                <span className="text-wc-muted text-sm">World Cup 2026 Fan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixtures */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="font-bebas text-3xl uppercase mb-6">Your Team&apos;s Fixtures</h2>

        <div className="flex flex-col gap-3">
          {matches.map((match) => {
            const isLive = ['1H', '2H', 'HT', 'ET', 'P'].includes(
              match.fixture.status.short
            )
            const isFinished = match.fixture.status.short === 'FT'

            return (
              <Link href={`/match/${match.fixture.id}`} key={match.fixture.id}>
                <div className="group bg-wc-surface border-b border-wc-border hover:bg-wc-surface-2 transition-colors">
                  <div className="flex items-center justify-between px-4 h-13">
                    <div className="flex items-center gap-3 w-2/5 justify-end">
                      <span className="font-bebas text-base text-right">
                        {match.teams.home.name}
                      </span>
                      <img
                        src={match.teams.home.logo}
                        className="w-8 h-8 object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1 w-1/5">
                      <span className="text-wc-muted text-xs uppercase tracking-wide">
                        {match.league.round.replace('Group Stage - ', 'Group ')}
                      </span>
                      <span
                        className={`font-bold text-sm ${
                          isLive
                            ? 'text-wc-neon'
                            : isFinished
                              ? 'text-white'
                              : 'text-wc-muted'
                        }`}
                      >
                        {match.goals.home !== null
                          ? `${match.goals.home} â€“ ${match.goals.away}`
                          : new Date(match.fixture.date).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 w-2/5">
                      <img
                        src={match.teams.away.logo}
                        className="w-8 h-8 object-contain"
                        loading="lazy"
                      />
                      <span className="font-bebas text-base">{match.teams.away.name}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}

