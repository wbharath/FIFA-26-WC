'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Trophy } from 'lucide-react'

interface Prediction {
  fixture_id: number
  home: string
  away: string
  home_team_id: number
  away_team_id: number
  stage: string
  group?: string
  utcDate: string
  predicted_winner: string
  home_win_prob: number
  draw_prob: number
  away_win_prob: number
}

export default function Predictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [logoMap, setLogoMap] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
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

      const [predRes, matchRes] = await Promise.all([
        fetch('/api/predictions'),
        fetch('/api/matches')
      ])
      const predData: Prediction[] = await predRes.json()
      const matchData = await matchRes.json()

      // Build team id → logo map from fixtures
      const map: Record<number, string> = {}
      const fixtures = matchData.fixtures || []
      fixtures.forEach((f: any) => {
        map[f.teams.home.id] = f.teams.home.logo
        map[f.teams.away.id] = f.teams.away.logo
      })
      setLogoMap(map)
      setPredictions(predData.filter((p) => p.home !== 'TBD'))
      setLoading(false)
    }
    init()
  }, [])

  // Group stage only for now — knockout unlocks after June 11
  const groupStage = predictions.filter((p) => p.stage?.includes('Group Stage'))

  const byGroup = groupStage.reduce(
    (acc, match) => {
      const group = match.group || 'Unknown'
      if (!acc[group]) acc[group] = []
      acc[group].push(match)
      return acc
    },
    {} as Record<string, Prediction[]>
  )

  function MatchCard({ match }: { match: Prediction }) {
    const homeLogo = logoMap[match.home_team_id]
    const awayLogo = logoMap[match.away_team_id]
    const homeWinPct = Math.round(match.home_win_prob * 100)
    const drawPct = Math.round(match.draw_prob * 100)
    const awayWinPct = Math.round(match.away_win_prob * 100)

    return (
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-4">
          {/* Home */}
          <div
            className={`flex items-center gap-3 flex-1 justify-end ${
              match.predicted_winner === match.home
                ? 'text-white'
                : 'text-gray-500'
            }`}
          >
            {match.predicted_winner === match.home && (
              <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            )}
            <span className="font-bold text-sm text-right">{match.home}</span>
            {homeLogo && (
              <img
                src={homeLogo}
                className="w-9 h-9 object-contain flex-shrink-0"
              />
            )}
          </div>

          {/* Probability bar */}
          <div className="flex flex-col items-center gap-2 w-44 flex-shrink-0">
            <div className="flex w-full h-2 rounded-full overflow-hidden">
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${homeWinPct}%` }}
              />
              <div
                className="bg-gray-600 transition-all"
                style={{ width: `${drawPct}%` }}
              />
              <div
                className="bg-blue-500 transition-all"
                style={{ width: `${awayWinPct}%` }}
              />
            </div>
            <div className="flex justify-between w-full text-xs">
              <span className="text-green-400">{homeWinPct}%</span>
              <span className="text-gray-500">{drawPct}% draw</span>
              <span className="text-blue-400">{awayWinPct}%</span>
            </div>
          </div>

          {/* Away */}
          <div
            className={`flex items-center gap-3 flex-1 ${
              match.predicted_winner === match.away
                ? 'text-white'
                : 'text-gray-500'
            }`}
          >
            {awayLogo && (
              <img
                src={awayLogo}
                className="w-9 h-9 object-contain flex-shrink-0"
              />
            )}
            <span className="font-bold text-sm">{match.away}</span>
            {match.predicted_winner === match.away && (
              <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading)
    return (
      <main className="min-h-screen bg-[#06090f] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </main>
    )

  return (
    <main className="min-h-screen bg-[#06090f] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <p className="text-green-400/60 text-xs font-semibold uppercase tracking-widest mb-2">
            Machine Learning
          </p>
          <h1 className="text-4xl font-black mb-2">AI Predictions</h1>
          <p className="text-gray-400 text-sm">
            Logistic regression model trained on 852 World Cup matches
            (1930–2022) · 14 features including FIFA rankings, H2H records,
            confederation strength
          </p>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <span className="w-1 h-7 bg-gradient-to-b from-green-500 to-yellow-500 rounded-full" />
          <h2 className="text-2xl font-bold">Group Stage</h2>
        </div>

        {Object.entries(byGroup)
          .sort()
          .map(([group, groupMatches]) => (
            <div key={group} className="mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 pb-2 border-b border-gray-800">
                {group}
              </h3>
              <div className="flex flex-col gap-3">
                {groupMatches.map((match) => (
                  <MatchCard key={match.fixture_id} match={match} />
                ))}
              </div>
            </div>
          ))}

        {/* Knockout placeholder */}
        <div className="flex items-center gap-3 mb-4 mt-10">
          <span className="w-1 h-7 bg-gradient-to-b from-yellow-500 to-amber-600 rounded-full" />
          <h2 className="text-2xl font-bold">Knockout Stage</h2>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm">
            Knockout predictions will be generated after the group stage
            concludes on June 28
          </p>
        </div>
      </div>
    </main>
  )
}
