'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Match {
  id: number
  utcDate: string
  stage: string
  group: string | null
  homeTeam: { id: number; name: string; shortName: string; crest: string }
  awayTeam: { id: number; name: string; shortName: string; crest: string }
  score: { fulltime: { home: number | null; away: number | null } }
}

interface Prediction {
  match_id: number
  predicted_winner_id: number
}

export default function Bracket() {
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
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

      const res = await fetch('/api/matches')
      const data = await res.json()
      setMatches(data.matches || [])

      const { data: existingPredictions } = await supabase
        .from('/predictions')
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
    team: { id: number; name: string; shortName: string; crest: string }
  ) {
    setSaving(match.id)
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('predictions').upsert(
      {
        user_id: user.id,
        match_id: match.id,
        predicted_winner_id: team.id,
        predicted_winner_name: team.name,
        predicted_winner_crest: team.crest
      },
      { onConflict: 'user_id,match_id' }
    )

    setPredictions((prev) => ({
      ...prev,
      [match.id]: { match_id: match.id, predicted_winner_id: team.id }
    }))
    setSaving(null)
  }

  const groupStageMatches = matches.filter((m) => m.stage === 'GROUP_STAGE')

  const fixturesByGroup = groupStageMatches.reduce(
    (acc, match) => {
      const group = match.group?.replace('GROUP_', 'Group ') || 'Unknown'
      if (!acc[group]) acc[group] = []
      acc[group].push(match)
      return acc
    },
    {} as Record<string, Match[]>
  )

  if (loading)
    return (
      <main className="min-h-screen bg-[#06090f] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading bracket...</p>
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
          <h1 className="text-4xl font-black">Bracket & Predictions</h1>
          <p className="text-gray-500 mt-2 text-sm">Tap a team to pick the winner of each match</p>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <span className="w-1 h-7 bg-gradient-to-b from-green-500 to-yellow-500 rounded-full inline-block" />
          <h2 className="text-2xl font-bold text-white">Group Stage</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.entries(fixturesByGroup)
            .sort()
            .map(([group, groupMatches]) => (
              <div
                key={group}
                className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors duration-200"
              >
                <div className="bg-gradient-to-r from-green-900/40 to-gray-800/60 px-4 py-3 border-b border-gray-800">
                  <h3 className="font-bold text-white">{group}</h3>
                </div>

                <div className="p-3 flex flex-col gap-2.5">
                  {groupMatches.map((match) => {
                    const prediction = predictions[match.id]
                    const isSaving = saving === match.id

                    return (
                      <div
                        key={match.id}
                        className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50"
                      >
                        <p className="text-gray-500 text-xs text-center mb-2.5 font-medium">
                          {new Date(match.utcDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => pickWinner(match, match.homeTeam)}
                            disabled={isSaving}
                            className={`flex-1 flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-200 ${
                              prediction?.predicted_winner_id === match.homeTeam.id
                                ? 'border-yellow-500/60 bg-yellow-950/40 shadow-lg shadow-yellow-950/30'
                                : 'border-gray-700 hover:border-gray-500 hover:bg-gray-700/40'
                            } disabled:opacity-60`}
                          >
                            <img
                              src={match.homeTeam.crest}
                              className="w-9 h-9 object-contain"
                            />
                            <span className="text-xs text-center font-medium text-gray-200">
                              {match.homeTeam.shortName}
                            </span>
                            {prediction?.predicted_winner_id === match.homeTeam.id && (
                              <span className="text-yellow-500 text-xs font-bold">✓ Pick</span>
                            )}
                          </button>

                          <div className="flex items-center px-1">
                            <span className="text-gray-600 text-xs font-black tracking-widest">
                              VS
                            </span>
                          </div>

                          <button
                            onClick={() => pickWinner(match, match.awayTeam)}
                            disabled={isSaving}
                            className={`flex-1 flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-200 ${
                              prediction?.predicted_winner_id === match.awayTeam.id
                                ? 'border-yellow-500/60 bg-yellow-950/40 shadow-lg shadow-yellow-950/30'
                                : 'border-gray-700 hover:border-gray-500 hover:bg-gray-700/40'
                            } disabled:opacity-60`}
                          >
                            <img
                              src={match.awayTeam.crest}
                              className="w-9 h-9 object-contain"
                            />
                            <span className="text-xs text-center font-medium text-gray-200">
                              {match.awayTeam.shortName}
                            </span>
                            {prediction?.predicted_winner_id === match.awayTeam.id && (
                              <span className="text-yellow-500 text-xs font-bold">✓ Pick</span>
                            )}
                          </button>
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
