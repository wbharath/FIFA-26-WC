'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Trophy } from 'lucide-react'

interface Prediction {
  home: string
  away: string
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
  const [loading, setLoading] = useState(true)
  const [fixtures, setFixtures] = useState<any[]>([])
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
      const predData = await predRes.json()
      const matchData = await matchRes.json()
      setPredictions(predData)
      setFixtures(matchData.matches || [])
      setLoading(false)
    }
    init()
  }, [])

  function getTeamCrest(teamName: string) {
    const match = fixtures.find(
      (f) => f.homeTeam.name === teamName || f.awayTeam.name === teamName
    )
    if (!match) return null
    return match.homeTeam.name === teamName
      ? match.homeTeam.crest
      : match.awayTeam.crest
  }

  const groupStage = predictions.filter(
    (p) => p.stage === 'GROUP_STAGE' && p.home !== 'TBD'
  )
  const knockout = predictions.filter(
    (p) => p.stage !== 'GROUP_STAGE' && p.home !== 'TBD'
  )

  const byGroup = groupStage.reduce(
    (acc, match) => {
      const group = match.group?.replace('GROUP_', 'Group ') || 'Unknown'
      if (!acc[group]) acc[group] = []
      acc[group].push(match)
      return acc
    },
    {} as Record<string, Prediction[]>
  )

  const stageOrder = [
    'LAST_32',
    'LAST_16',
    'QUARTER_FINALS',
    'SEMI_FINALS',
    'THIRD_PLACE',
    'FINAL'
  ]

  const byStage = knockout.reduce(
    (acc, match) => {
      if (!acc[match.stage]) acc[match.stage] = []
      acc[match.stage].push(match)
      return acc
    },
    {} as Record<string, Prediction[]>
  )

  function formatStage(stage: string) {
    return stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }

  function MatchCard({ match }: { match: Prediction }) {
    return (
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-3 flex-1 justify-end ${match.predicted_winner === match.home ? 'text-white' : 'text-gray-500'}`}
          >
            {match.predicted_winner === match.home && (
              <Trophy className="w-4 h-4 text-yellow-500" />
            )}
            <span className="font-bold text-sm text-right">{match.home}</span>
            {getTeamCrest(match.home) && (
              <img
                src={getTeamCrest(match.home)!}
                className="w-10 h-10 object-contain"
              />
            )}
          </div>

          <div className="flex flex-col items-center gap-2 w-48">
            <div className="flex w-full h-2 rounded-full overflow-hidden">
              <div
                className="bg-green-500"
                style={{ width: `${match.home_win_prob * 100}%` }}
              />
              <div
                className="bg-gray-600"
                style={{ width: `${match.draw_prob * 100}%` }}
              />
              <div
                className="bg-blue-500"
                style={{ width: `${match.away_win_prob * 100}%` }}
              />
            </div>
            <div className="flex justify-between w-full text-xs">
              <span className="text-green-400">
                {Math.round(match.home_win_prob * 100)}%
              </span>
              <span className="text-gray-500">
                {Math.round(match.draw_prob * 100)}% draw
              </span>
              <span className="text-blue-400">
                {Math.round(match.away_win_prob * 100)}%
              </span>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 flex-1 ${match.predicted_winner === match.away ? 'text-white' : 'text-gray-500'}`}
          >
            {getTeamCrest(match.away) && (
              <img
                src={getTeamCrest(match.away)!}
                className="w-10 h-10 object-contain"
              />
            )}
            <span className="font-bold text-sm">{match.away}</span>
            {match.predicted_winner === match.away && (
              <Trophy className="w-4 h-4 text-yellow-500" />
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
            (1930–2022) + FIFA rankings
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
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
                {group}
              </h3>
              <div className="flex flex-col gap-3">
                {groupMatches.map((match, i) => (
                  <MatchCard key={i} match={match} />
                ))}
              </div>
            </div>
          ))}

        <div className="flex items-center gap-3 mb-6 mt-10">
          <span className="w-1 h-7 bg-gradient-to-b from-yellow-500 to-amber-600 rounded-full" />
          <h2 className="text-2xl font-bold">Knockout Stage Predictions</h2>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Based on predicted group stage qualifiers
        </p>

        {stageOrder
          .filter((s) => byStage[s])
          .map((stage) => (
            <div key={stage} className="mb-8">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
                {formatStage(stage)}
              </h3>
              <div className="flex flex-col gap-3">
                {byStage[stage].map((match, i) => (
                  <MatchCard key={i} match={match} />
                ))}
              </div>
            </div>
          ))}
      </div>
    </main>
  )
}
