'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">World Cup 2026</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">{user.email}</span>
            <button
              onClick={signOut}
              className="bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-gray-900 rounded-xl p-6">
          <img
            src={profile.favourite_team_crest}
            alt={profile.favourite_team_name}
            className="w-16 h-16 object-contain"
          />
          <div>
            <p className="text-gray-400 text-sm">Your team</p>
            <p className="text-2xl font-bold">{profile.favourite_team_name}</p>
          </div>
        </div>
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Your Team's Fixtures</h2>
          <div className="flex flex-col gap-3">
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-gray-900 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={match.homeTeam.crest}
                    className="w-8 h-8 object-contain"
                  />
                  <span className="font-semibold">
                    {match.homeTeam.shortName}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-gray-400 text-xs">
                    {match.group?.replace('GROUP_', 'Group ')}
                  </span>
                  <span className="text-sm font-bold">
                    {match.score.fullTime.home !== null
                      ? `${match.score.fullTime.home} - ${match.score.fullTime.away}`
                      : 'vs'}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {new Date(match.utcDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">
                    {match.awayTeam.shortName}
                  </span>
                  <img
                    src={match.awayTeam.crest}
                    className="w-8 h-8 object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
