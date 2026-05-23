'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useMatchStore } from '@/lib/stores/matchStore'

interface Match {
  fixture: { id: number; date: string }
  league: { round: string }
  teams: {
    home: { id: number; name: string; logo: string }
    away: { id: number; name: string; logo: string }
  }
  goals: { home: number | null; away: number | null }
  group: string | null
}

interface Prediction {
  match_id: number
  predicted_winner_id: number
}

function BracketSkeleton() {
  return (
    <main className="min-h-screen bg-wc-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-10">
          <div className="h-3 w-36 bg-wc-surface rounded animate-pulse mb-2" />
          <div className="h-10 w-64 bg-wc-surface rounded animate-pulse mb-2" />
          <div className="h-3 w-48 bg-wc-surface rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-wc-surface border border-wc-border rounded-xl overflow-hidden">
              <div className="h-11 bg-wc-border/40 animate-pulse" />
              <div className="p-3 flex flex-col gap-2.5">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-24 bg-wc-border/30 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

export default function Bracket() {
  const { fixtures: matches, loaded, load } = useMatchStore()
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({})
  const [loading, setLoading] = useState(!loaded)
  const [saving, setSaving] = useState<number | null>(null)
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

      await load()

      const { data: existingPredictions } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id)

      const predictionsMap: Record<number, Prediction> = {}
      existingPredictions?.forEach((p) => {
        predictionsMap[p.match_id] = p
      })
      setPredictions(predictionsMap)
      setLoading(false)
    }
    init()
  }, [])

  async function pickWinner(
    match: Match,
    team: { id: number; name: string; logo: string }
  ) {
    setSaving(match.fixture.id)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('predictions').upsert(
      {
        user_id: user.id,
        match_id: match.fixture.id,
        predicted_winner_id: team.id,
        predicted_winner_name: team.name,
        predicted_winner_crest: team.logo,
      },
      { onConflict: 'user_id,match_id' }
    )

    setPredictions((prev) => ({
      ...prev,
      [match.fixture.id]: {
        match_id: match.fixture.id,
        predicted_winner_id: team.id,
      },
    }))
    setSaving(null)
  }

  const fixturesByGroup: Record<string, Match[]> = {}
  matches
    .filter((m) => m.group)
    .forEach((match) => {
      if (!fixturesByGroup[match.group!]) fixturesByGroup[match.group!] = []
      fixturesByGroup[match.group!].push(match as Match)
    })

  if (loading) return <BracketSkeleton />

  return (
    <main className="min-h-screen bg-wc-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-10">
          <p className="text-wc-muted text-xs font-semibold uppercase tracking-widest mb-2">
            FIFA World Cup 2026
          </p>
          <h1 className="font-bebas text-5xl uppercase">Bracket &amp; Predictions</h1>
          <p className="text-wc-muted mt-2 text-sm">Tap a team to pick the winner of each match</p>
        </div>

        <h2 className="font-bebas text-3xl uppercase mb-6">Group Stage</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.entries(fixturesByGroup)
            .sort()
            .map(([group, groupMatches]) => (
              <div
                key={group}
                className="bg-wc-surface border border-wc-border rounded-xl overflow-hidden transition-all duration-150 hover:border-wc-red"
              >
                <div className="bg-wc-border/30 px-4 py-3 border-b border-wc-border">
                  <h3 className="font-bebas text-lg text-white">{group}</h3>
                </div>

                <div className="p-3 flex flex-col gap-2.5">
                  {groupMatches.map((match) => {
                    const prediction = predictions[match.fixture.id]
                    const isSaving = saving === match.fixture.id

                    return (
                      <div
                        key={match.fixture.id}
                        className="bg-wc-black rounded-xl p-3 border border-wc-border"
                      >
                        <p className="text-wc-muted text-xs text-center mb-2.5 font-medium">
                          {new Date(match.fixture.date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                        <div className="flex gap-2">
                          {([match.teams.home, match.teams.away] as const).map((team) => {
                            const isPicked =
                              prediction?.predicted_winner_id === team.id
                            return (
                              <button
                                key={team.id}
                                onClick={() => pickWinner(match, team)}
                                disabled={isSaving}
                                className={`flex-1 flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-150 ${
                                  isPicked
                                    ? 'border-wc-red bg-wc-red/10'
                                    : 'border-wc-border hover:border-wc-muted hover:bg-wc-border/20'
                                } disabled:opacity-60`}
                              >
                                <img
                                  src={team.logo}
                                  className="w-9 h-9 object-contain"
                                  loading="lazy"
                                />
                                <span className="font-bebas text-xs text-center text-white">
                                  {team.name}
                                </span>
                                {isPicked && (
                                  <span className="text-wc-red text-xs font-bold uppercase">
                                    ✓ Pick
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
        </div>
      </div>
    </main>
  )
}
