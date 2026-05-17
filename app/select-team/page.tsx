'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Team {
  id: number
  name: string
  shortName: string
  tla: string
  crest: string
}

export default function SelectTeam() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function init() {
      // Check auth
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      // Check if already picked a team
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('favourite_team_id')
        .eq('id', user.id)
        .single()

      if (profile?.favourite_team_id) {
        router.push('/dashboard')
        return
      }

      // Fetch teams
      const res = await fetch('/api/teams')
      const data = await res.json()
      setTeams(data.teams || [])
      setLoading(false)
    }
    init()
  }, [])

  async function pickTeam(team: Team) {
    setSelected(team.id)
    setSaving(true)
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('user_profiles').upsert({
      id: user.id,
      email: user.email,
      favourite_team_id: team.id,
      favourite_team_name: team.name,
      favourite_team_crest: team.crest
    })

    router.push('/dashboard')
  }

  if (loading)
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading teams...</p>
      </main>
    )

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Pick Your Team</h1>
        <p className="text-gray-400 mb-8">
          Choose the team you'll be supporting at FIFA World Cup 2026
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => pickTeam(team)}
              disabled={saving}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition
                ${
                  selected === team.id
                    ? 'border-green-500 bg-green-950'
                    : 'border-gray-700 bg-gray-900 hover:border-gray-500'
                }`}
            >
              <img
                src={team.crest}
                alt={team.name}
                className="w-12 h-12 object-contain"
              />
              <span className="text-xs text-center text-gray-300">
                {team.shortName}
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
