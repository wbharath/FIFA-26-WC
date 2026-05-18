'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
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
    const teamMatches = data.matches.filter(
      (m: any) => m.homeTeam.id === teamId || m.awayTeam.id === teamId
    )
    setMatches(teamMatches)
  }

  if (!user || !profile) return null

  return (
    <main className="min-h-screen bg-[#06090f] text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-green-950/20 to-gray-950 border-b border-green-900/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(22,163,74,0.15),transparent_60%)]" />
        <div className="absolute top-4 right-8 opacity-[0.06] pointer-events-none">
          <img
            src="https://crests.football-data.org/wm26.png"
            alt=""
            className="w-64 h-64 object-contain"
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-8 py-10">
          <div className="flex items-center justify-between mb-10">
            <p className="text-green-400/60 text-xs font-semibold uppercase tracking-widest">
              FIFA World Cup 2026
            </p>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm hidden sm:block">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white px-5 py-2 rounded-full text-sm font-medium border border-gray-700 hover:border-gray-600 transition-all duration-200"
              >
                Sign out
              </button>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 blur-2xl bg-green-500/25 rounded-full scale-[1.8]" />
              <img
                src={profile.favourite_team_crest}
                alt={profile.favourite_team_name}
                className="relative w-28 h-28 object-contain drop-shadow-2xl"
              />
            </div>
            <div>
              <p className="text-yellow-500/70 text-xs font-semibold uppercase tracking-[0.25em] mb-2">
                Supporting
              </p>
              <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                {profile.favourite_team_name}
              </h1>
              <div className="mt-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400/70 text-sm">
                  World Cup 2026 Fan
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixtures Section */}
      <div className="max-w-4xl mx-auto px-8 py-10">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
          <span className="w-1 h-6 bg-gradient-to-b from-green-500 to-yellow-500 rounded-full inline-block" />
          Your Team's Fixtures
        </h2>

        <div className="flex flex-col gap-3">
          {matches.map((match) => (
            <Link href={`/match/${match.id}`} key={match.id}>
              <div className="group bg-gray-900/50 hover:bg-gray-800/60 border border-gray-800 hover:border-gray-700 rounded-xl p-4 flex items-center justify-between transition-all duration-200">
                <div className="flex items-center gap-3 w-2/5 justify-end">
                  <span className="font-semibold text-right text-sm">
                    {match.homeTeam.shortName}
                  </span>
                  <img
                    src={match.homeTeam.crest}
                    className="w-8 h-8 object-contain"
                  />
                </div>

                <div className="flex flex-col items-center gap-1 w-1/5">
                  <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                    {match.group?.replace('GROUP_', 'Group ')}
                  </span>
                  <span
                    className={`text-xs font-bold px-3 py-0.5 rounded-full ${
                      match.score.fullTime.home !== null
                        ? 'bg-green-950 text-green-400 border border-green-900'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {match.score.fullTime.home !== null
                      ? `${match.score.fullTime.home} - ${match.score.fullTime.away}`
                      : 'vs'}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {new Date(match.utcDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-3 w-2/5">
                  <img
                    src={match.awayTeam.crest}
                    className="w-8 h-8 object-contain"
                  />
                  <span className="font-semibold text-sm">
                    {match.awayTeam.shortName}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
