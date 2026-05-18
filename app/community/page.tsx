'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Users } from 'lucide-react'

export default function Community() {
  const [matches, setMatches] = useState<any[]>([])
  const [fanPicks, setFanPicks] = useState<
    Record<number, Record<string, number>>
  >({})
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

      const res = await fetch('/api/matches')
      const data = await res.json()
      setMatches(data.matches || [])

      const { data: picks } = await supabase
        .from('predictions')
        .select('match_id, predicted_winner_name')

      const fanMap: Record<number, Record<string, number>> = {}
      picks?.forEach((pick) => {
        if (!fanMap[pick.match_id]) fanMap[pick.match_id] = {}
        const name = pick.predicted_winner_name
        fanMap[pick.match_id][name] = (fanMap[pick.match_id][name] || 0) + 1
      })
      setFanPicks(fanMap)
      setLoading(false)
    }
    init()
  }, [])

  const groupStageMatches = matches.filter((m) => m.stage === 'GROUP_STAGE')

  const byGroup: Record<string, any[]> = groupStageMatches.reduce(
    (acc: Record<string, any[]>, match) => {
      const group = match.group?.replace('GROUP_', 'Group ') || 'Unknown'
      if (!acc[group]) acc[group] = []
      acc[group].push(match)
      return acc
    },
    {}
  )

  function getPickStats(matchId: number, homeTeam: string, awayTeam: string) {
    const picks = fanPicks[matchId] || {}
    const homePicks = picks[homeTeam] || 0
    const awayPicks = picks[awayTeam] || 0
    const total = homePicks + awayPicks
    if (total === 0) return null
    return {
      homePct: Math.round((homePicks / total) * 100),
      awayPct: Math.round((awayPicks / total) * 100),
      total
    }
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
            Fan Predictions
          </p>
          <h1 className="text-4xl font-black mb-2">Community</h1>
          <p className="text-gray-400 text-sm">
            See what fans around the world are predicting
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
                {groupMatches.map((match: any) => {
                  const stats = getPickStats(
                    match.id,
                    match.homeTeam.name,
                    match.awayTeam.name
                  )
                  return (
                    <div
                      key={match.id}
                      className="bg-gray-900/60 border border-gray-800 rounded-xl p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={match.homeTeam.crest}
                            className="w-8 h-8 object-contain"
                          />
                          <span className="font-bold text-sm">
                            {match.homeTeam.shortName}
                          </span>
                        </div>
                        <span className="text-gray-500 text-xs">vs</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">
                            {match.awayTeam.shortName}
                          </span>
                          <img
                            src={match.awayTeam.crest}
                            className="w-8 h-8 object-contain"
                          />
                        </div>
                      </div>

                      {stats ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex w-full h-3 rounded-full overflow-hidden">
                            <div
                              className="bg-green-500 transition-all"
                              style={{ width: `${stats.homePct}%` }}
                            />
                            <div
                              className="bg-blue-500 transition-all"
                              style={{ width: `${stats.awayPct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-green-400 font-bold">
                              {stats.homePct}%
                            </span>
                            <div className="flex items-center gap-1 text-gray-500">
                              <Users className="w-3 h-3" />
                              <span>{stats.total} fans voted</span>
                            </div>
                            <span className="text-blue-400 font-bold">
                              {stats.awayPct}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-600 text-xs text-center">
                          No votes yet — be the first!
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
      </div>
    </main>
  )
}
