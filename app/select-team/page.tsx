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

function SelectTeamSkeleton() {
  return (
    <main className="min-h-screen bg-wc-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-10">
          <div className="h-3 w-36 bg-wc-surface rounded animate-pulse mb-2" />
          <div className="h-10 w-48 bg-wc-surface rounded animate-pulse mb-2" />
          <div className="h-3 w-72 bg-wc-surface rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {[...Array(24)].map((_, i) => (
            <div
              key={i}
              className="h-28 bg-wc-surface border border-wc-border rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    </main>
  )
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
        data: { user },
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
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('user_profiles').upsert({
      id: user.id,
      email: user.email,
      favourite_team_id: team.team.id,
      favourite_team_name: team.team.name,
      favourite_team_crest: team.team.logo,
    })

    router.push('/dashboard')
  }

  if (loading) return <SelectTeamSkeleton />

  return (
    <main className="min-h-screen bg-wc-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-10">
          <p className="text-wc-muted text-xs font-semibold uppercase tracking-widest mb-2">
            FIFA World Cup 2026
          </p>
          <h1 className="font-bebas text-5xl uppercase">Pick Your Team</h1>
          <p className="text-wc-muted mt-2">
            Choose the team you&apos;ll be supporting at FIFA World Cup 2026
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
                className={`group flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-150 ${
                  selected === t.team.id
                    ? 'border-wc-red bg-wc-red/10'
                    : 'border-wc-border bg-wc-surface hover:-translate-y-1 hover:border-wc-red'
                } disabled:opacity-60`}
              >
                <img
                  src={t.team.logo}
                  alt={t.team.name}
                  className="w-12 h-12 object-contain transition-transform duration-150 group-hover:scale-110"
                  loading="lazy"
                />
                <span
                  className={`font-bebas text-sm text-center leading-tight ${
                    selected === t.team.id ? 'text-wc-red' : 'text-wc-muted group-hover:text-white'
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
