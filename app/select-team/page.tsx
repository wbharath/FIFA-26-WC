'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Team {
  team: {
    id: number
    name: string
    logo: string
    country: string
  }
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
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('favourite_team_id')
        .eq('id', user.id)
        .single()

      if (profile?.favourite_team_id) {
        router.push('/dashboard')
        return
      }

      const res = await fetch('/api/teams')
      const data = await res.json()
      setTeams(data || [])
      setLoading(false)
    }
    init()
  }, [])

  async function pickTeam(team: Team) {
    setSelected(team.team.id)
    setSaving(true)
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('user_profiles').upsert({
      id: user.id,
      email: user.email,
      favourite_team_id: team.team.id,
      favourite_team_name: team.team.name,
      favourite_team_crest: team.team.logo
    })

    router.push('/dashboard')
  }

  if (loading)
    return (
      <main className="min-h-screen bg-[#06090f] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading teams...</p>
        </div>
      </main>
    )

  return (
    <main className="min-h-screen bg-[#06090f] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <p className="text-green-400/60 text-xs font-semibold uppercase tracking-widest mb-2">
            FIFA World Cup 2026
          </p>
          <h1 className="text-4xl font-black">Pick Your Team</h1>
          <p className="text-gray-500 mt-2">
            Choose the team you'll be supporting at FIFA World Cup 2026
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {[...teams]
            .sort((a, b) => a.team.name.localeCompare(b.team.name))
            .map((t) => (
              <button
                key={t.team.id}
                onClick={() => pickTeam(t)}
                disabled={saving}
                className={`group flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-200 ${
                  selected === t.team.id
                    ? 'border-yellow-500/70 bg-yellow-950/30 shadow-lg shadow-yellow-950/40'
                    : 'border-gray-800 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-800/60 hover:shadow-lg hover:shadow-black/30'
                } disabled:opacity-60`}
              >
                <img
                  src={t.team.logo}
                  alt={t.team.name}
                  className="w-12 h-12 object-contain transition-transform duration-200 group-hover:scale-110"
                />
                <span
                  className={`text-xs text-center font-medium leading-tight transition-colors ${
                    selected === t.team.id
                      ? 'text-yellow-400'
                      : 'text-gray-400 group-hover:text-gray-200'
                  }`}
                >
                  {t.team.name}
                </span>
              </button>
            ))}
        </div>
      </div>
    </main>
  )
}
