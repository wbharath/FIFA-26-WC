'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Users, ChevronDown, ChevronUp } from 'lucide-react'

interface PredictedPlayer {
  id: number
  name: string
  count: number
  pct: number
}

interface MatchXI {
  home: PredictedPlayer[]
  away: PredictedPlayer[]
  homeTotal: number
  awayTotal: number
}

export default function Community() {
  const [matches, setMatches] = useState<any[]>([])
  const [fanPicks, setFanPicks] = useState<
    Record<number, Record<string, number>>
  >({})
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null)
  const [matchXIs, setMatchXIs] = useState<Record<number, MatchXI>>({})
  const [loadingXI, setLoadingXI] = useState<number | null>(null)
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
      setMatches(data.fixtures || [])

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

  async function toggleMatch(match: any) {
    const matchId = match.fixture.id
    if (expandedMatch === matchId) {
      setExpandedMatch(null)
      return
    }
    setExpandedMatch(matchId)

    // Already loaded
    if (matchXIs[matchId]) return

    setLoadingXI(matchId)
    const homeId = match.teams.home.id
    const awayId = match.teams.away.id

    const { data: xis } = await supabase
      .from('predicted_xi')
      .select('team_id, players')
      .in('team_id', [homeId, awayId])

    function aggregatePlayers(teamId: number) {
      const teamXIs = xis?.filter((xi) => xi.team_id === teamId) || []
      const counts: Record<number, { name: string; count: number }> = {}

      teamXIs.forEach((xi) => {
        Object.values(xi.players || {}).forEach((player: any) => {
          if (!player?.id) return
          if (!counts[player.id])
            counts[player.id] = { name: player.name, count: 0 }
          counts[player.id].count++
        })
      })

      const total = teamXIs.length
      return {
        players: Object.entries(counts)
          .map(([id, { name, count }]) => ({
            id: Number(id),
            name,
            count,
            pct: total > 0 ? Math.round((count / total) * 100) : 0
          }))
          .sort((a, b) => b.pct - a.pct),
        total
      }
    }

    const home = aggregatePlayers(homeId)
    const away = aggregatePlayers(awayId)

    setMatchXIs((prev) => ({
      ...prev,
      [matchId]: {
        home: home.players,
        away: away.players,
        homeTotal: home.total,
        awayTotal: away.total
      }
    }))
    setLoadingXI(null)
  }

  const fixturesByGroup: Record<string, any[]> = {}
  matches
    .filter((m) => m.group)
    .forEach((match) => {
      if (!fixturesByGroup[match.group]) fixturesByGroup[match.group] = []
      fixturesByGroup[match.group].push(match)
    })

  function getPickStats(matchId: number, homeName: string, awayName: string) {
    const picks = fanPicks[matchId] || {}
    const homePicks = picks[homeName] || 0
    const awayPicks = picks[awayName] || 0
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
    <main className="min-h-screen bg-[#06090f] text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
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

        {Object.entries(fixturesByGroup)
          .sort()
          .map(([group, groupMatches]) => (
            <div key={group} className="mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 pb-2 border-b border-gray-800">
                {group}
              </h3>
              <div className="flex flex-col gap-2">
                {groupMatches.map((match: any) => {
                  const matchId = match.fixture.id
                  const isExpanded = expandedMatch === matchId
                  const stats = getPickStats(
                    matchId,
                    match.teams.home.name,
                    match.teams.away.name
                  )
                  const xi = matchXIs[matchId]
                  const isLoadingXI = loadingXI === matchId

                  return (
                    <div
                      key={matchId}
                      className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden"
                    >
                      {/* Match header - always visible */}
                      <button
                        onClick={() => toggleMatch(match)}
                        className="w-full flex items-center px-5 py-4 hover:bg-gray-800/40 transition-colors"
                      >
                        {/* Home */}
                        <div className="flex items-center gap-2 flex-1">
                          <img
                            src={match.teams.home.logo}
                            className="w-7 h-7 object-contain"
                          />
                          <span className="font-semibold text-sm">
                            {match.teams.home.name}
                          </span>
                        </div>

                        {/* Score / time */}
                        <div className="flex flex-col items-center w-20 flex-shrink-0">
                          {match.goals.home !== null ? (
                            <span className="text-sm font-bold">
                              {match.goals.home} - {match.goals.away}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">
                              {new Date(match.fixture.date).toLocaleDateString(
                                'en-GB',
                                { day: 'numeric', month: 'short' }
                              )}
                            </span>
                          )}
                        </div>

                        {/* Away */}
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className="font-semibold text-sm">
                            {match.teams.away.name}
                          </span>
                          <img
                            src={match.teams.away.logo}
                            className="w-7 h-7 object-contain"
                          />
                        </div>

                        {/* Chevron */}
                        <div className="ml-4 text-gray-500">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </button>

                      {/* Fan pick bar - always visible */}
                      {stats && (
                        <div className="px-5 pb-3">
                          <div className="flex w-full h-1.5 rounded-full overflow-hidden mb-1.5">
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
                            <div className="flex items-center gap-1 text-gray-600">
                              <Users className="w-3 h-3" />
                              <span>{stats.total} votes</span>
                            </div>
                            <span className="text-blue-400 font-bold">
                              {stats.awayPct}%
                            </span>
                          </div>
                        </div>
                      )}

                      {!stats && !isExpanded && (
                        <div className="px-5 pb-3">
                          <p className="text-gray-700 text-xs text-center">
                            No votes yet
                          </p>
                        </div>
                      )}

                      {/* Expanded XI section */}
                      {isExpanded && (
                        <div className="border-t border-gray-800 px-5 py-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                            Fan Predicted Lineups
                          </p>

                          {isLoadingXI ? (
                            <div className="flex justify-center py-4">
                              <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : xi ? (
                            <div className="grid grid-cols-2 gap-6">
                              {/* Home XI */}
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <img
                                    src={match.teams.home.logo}
                                    className="w-5 h-5 object-contain"
                                  />
                                  <span className="text-sm font-bold">
                                    {match.teams.home.name}
                                  </span>
                                  <span className="text-gray-600 text-xs">
                                    ({xi.homeTotal} XI
                                    {xi.homeTotal !== 1 ? 's' : ''})
                                  </span>
                                </div>
                                {xi.home.length === 0 ? (
                                  <p className="text-gray-600 text-xs">
                                    No predicted XIs yet
                                  </p>
                                ) : (
                                  <div className="flex flex-col gap-2">
                                    {xi.home.map((player) => (
                                      <div
                                        key={player.id}
                                        className="flex items-center gap-2"
                                      >
                                        <div className="flex-1">
                                          <p className="text-sm text-gray-200">
                                            {player.name}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-green-500 rounded-full"
                                              style={{
                                                width: `${player.pct}%`
                                              }}
                                            />
                                          </div>
                                          <span className="text-xs text-gray-400 w-8 text-right">
                                            {player.pct}%
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Away XI */}
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <img
                                    src={match.teams.away.logo}
                                    className="w-5 h-5 object-contain"
                                  />
                                  <span className="text-sm font-bold">
                                    {match.teams.away.name}
                                  </span>
                                  <span className="text-gray-600 text-xs">
                                    ({xi.awayTotal} XI
                                    {xi.awayTotal !== 1 ? 's' : ''})
                                  </span>
                                </div>
                                {xi.away.length === 0 ? (
                                  <p className="text-gray-600 text-xs">
                                    No predicted XIs yet
                                  </p>
                                ) : (
                                  <div className="flex flex-col gap-2">
                                    {xi.away.map((player) => (
                                      <div
                                        key={player.id}
                                        className="flex items-center gap-2"
                                      >
                                        <div className="flex-1">
                                          <p className="text-sm text-gray-200">
                                            {player.name}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-blue-500 rounded-full"
                                              style={{
                                                width: `${player.pct}%`
                                              }}
                                            />
                                          </div>
                                          <span className="text-xs text-gray-400 w-8 text-right">
                                            {player.pct}%
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-600 text-xs text-center py-2">
                              No predicted XIs saved for this match yet
                            </p>
                          )}
                        </div>
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
