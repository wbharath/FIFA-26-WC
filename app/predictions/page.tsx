'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Trophy } from 'lucide-react'
import { useMatchStore } from '@/lib/stores/matchStore'

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

function PredictionsSkeleton() {
  return (
    <main className="min-h-screen bg-wc-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="h-3 w-28 bg-wc-surface rounded animate-pulse mb-2" />
          <div className="h-9 w-48 bg-wc-surface rounded animate-pulse mb-2" />
          <div className="h-3 w-80 bg-wc-surface rounded animate-pulse" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="mb-6">
            <div className="h-8 bg-wc-surface animate-pulse mb-0" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="flex items-center px-4 h-13 border-b border-wc-border gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-5 h-5 bg-wc-surface rounded animate-pulse shrink-0" />
                  <div className="h-3 w-24 bg-wc-surface rounded animate-pulse" />
                </div>
                <div className="w-48 h-3 bg-wc-surface rounded animate-pulse shrink-0" />
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <div className="h-3 w-24 bg-wc-surface rounded animate-pulse" />
                  <div className="w-5 h-5 bg-wc-surface rounded animate-pulse shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  )
}

function MatchRow({
  match,
  logoMap,
}: {
  match: Prediction
  logoMap: Record<number, string>
}) {
  const homeLogo = logoMap[match.home_team_id]
  const awayLogo = logoMap[match.away_team_id]
  const homeWinPct = Math.round(match.home_win_prob * 100)
  const drawPct = Math.round(match.draw_prob * 100)
  const awayWinPct = Math.round(match.away_win_prob * 100)
  const homeWins = match.predicted_winner === match.home
  const awayWins = match.predicted_winner === match.away

  return (
    <div className="flex items-center px-4 h-13 border-b border-wc-border hover:bg-wc-surface-2 transition-colors">
      {/* Home */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {homeLogo && (
          <img src={homeLogo} className="w-5 h-5 object-contain shrink-0" loading="lazy" />
        )}
        <span
          className={`text-sm truncate ${
            homeWins ? 'text-white font-semibold' : 'text-wc-dimmed'
          }`}
        >
          {match.home}
        </span>
        {homeWins && (
          <Trophy className="w-3.5 h-3.5 text-wc-gold shrink-0" />
        )}
      </div>

      {/* Probability bar */}
      <div className="flex items-center gap-2 w-52 shrink-0 mx-3">
        <span className="text-xs font-bold text-wc-red w-8 text-right shrink-0">
          {homeWinPct}%
        </span>
        <div className="flex flex-1 h-1.5 overflow-hidden">
          <div className="bg-wc-red h-full" style={{ width: `${homeWinPct}%` }} />
          <div className="bg-wc-border h-full" style={{ width: `${drawPct}%` }} />
          <div className="bg-wc-blue h-full" style={{ width: `${awayWinPct}%` }} />
        </div>
        <span className="text-xs font-bold text-wc-blue w-8 shrink-0">
          {awayWinPct}%
        </span>
      </div>

      {/* Away */}
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        {awayWins && (
          <Trophy className="w-3.5 h-3.5 text-wc-gold shrink-0" />
        )}
        <span
          className={`text-sm truncate ${
            awayWins ? 'text-white font-semibold' : 'text-wc-dimmed'
          }`}
        >
          {match.away}
        </span>
        {awayLogo && (
          <img src={awayLogo} className="w-5 h-5 object-contain shrink-0" loading="lazy" />
        )}
      </div>
    </div>
  )
}

export default function Predictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [logoMap, setLogoMap] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const { fixtures, loaded, load } = useMatchStore()
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

      const [predRes] = await Promise.all([fetch('/api/predictions'), load()])
      const predData: Prediction[] = await predRes.json()

      const map: Record<number, string> = {}
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

  useEffect(() => {
    if (!loaded) return
    const map: Record<number, string> = {}
    fixtures.forEach((f: any) => {
      map[f.teams.home.id] = f.teams.home.logo
      map[f.teams.away.id] = f.teams.away.logo
    })
    setLogoMap(map)
  }, [loaded, fixtures])

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

  if (loading) return <PredictionsSkeleton />

  return (
    <main className="min-h-screen bg-wc-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-wc-dimmed text-xs font-semibold uppercase tracking-widest mb-2">
            Machine Learning
          </p>
          <h1 className="font-bebas text-5xl uppercase mb-2">AI Predictions</h1>
          <p className="text-wc-muted text-sm">
            Logistic regression model trained on 852 World Cup matches (1930–2022) · 14
            features including FIFA rankings, H2H records, confederation strength
          </p>
        </div>

        <h2 className="font-bebas text-2xl uppercase mb-4 text-wc-muted tracking-wide">
          Group Stage
        </h2>

        {Object.entries(byGroup)
          .sort()
          .map(([group, groupMatches]) => (
            <div key={group} className="mb-6">
              <div className="px-4 py-2 bg-wc-surface border-b border-wc-border">
                <span className="text-[11px] font-semibold text-wc-dimmed uppercase tracking-widest">
                  {group}
                </span>
              </div>
              <div>
                {groupMatches.map((match) => (
                  <MatchRow key={match.fixture_id} match={match} logoMap={logoMap} />
                ))}
              </div>
            </div>
          ))}

        <h2 className="font-bebas text-2xl uppercase mb-4 mt-10 text-wc-muted tracking-wide">
          Knockout Stage
        </h2>
        <div className="border border-wc-border bg-wc-surface px-6 py-8 text-center">
          <p className="text-wc-muted text-sm">
            Knockout predictions will be generated after the group stage concludes on June 28
          </p>
        </div>
      </div>
    </main>
  )
}
