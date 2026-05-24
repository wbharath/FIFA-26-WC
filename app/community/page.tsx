'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Users, ChevronDown, ChevronUp } from 'lucide-react'
import { useMatchStore } from '@/lib/stores/matchStore'

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

function CommunitySkeleton() {
  return (
    <main className="min-h-screen bg-wc-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="h-3 w-28 bg-wc-surface rounded animate-pulse mb-2" />
          <div className="h-9 w-44 bg-wc-surface rounded animate-pulse mb-2" />
          <div className="h-3 w-64 bg-wc-surface rounded animate-pulse" />
        </div>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="mb-6">
            <div className="h-8 bg-wc-surface animate-pulse" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="flex items-center h-13 px-4 border-b border-wc-border gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-5 h-5 bg-wc-surface rounded animate-pulse shrink-0" />
                  <div className="h-3 w-24 bg-wc-surface rounded animate-pulse" />
                </div>
                <div className="w-20 h-4 bg-wc-surface rounded animate-pulse shrink-0" />
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

export default function Community() {
  const { fixtures: matches, loaded, load } = useMatchStore()
  const [fanPicks, setFanPicks] = useState<Record<number, Record<string, number>>>({})
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null)
  const [matchXIs, setMatchXIs] = useState<Record<number, MatchXI>>({})
  const [loadingXI, setLoadingXI] = useState<number | null>(null)
  const [loading, setLoading] = useState(!loaded)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      await load()

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
          if (!counts[player.id]) counts[player.id] = { name: player.name, count: 0 }
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
            pct: total > 0 ? Math.round((count / total) * 100) : 0,
          }))
          .sort((a, b) => b.pct - a.pct),
        total,
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
        awayTotal: away.total,
      },
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
      total,
    }
  }

  if (loading) return <CommunitySkeleton />

  return (
    <main className="min-h-screen bg-wc-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-wc-dimmed text-xs font-semibold uppercase tracking-widest mb-2">
            Fan Predictions
          </p>
          <h1 className="font-bebas text-5xl uppercase mb-2">Community</h1>
          <p className="text-wc-muted text-sm">See what fans around the world are predicting</p>
        </div>

        <h2 className="font-bebas text-2xl uppercase mb-4 text-wc-muted tracking-wide">
          Group Stage
        </h2>

        {Object.entries(fixturesByGroup)
          .sort()
          .map(([group, groupMatches]) => (
            <div key={group} className="mb-6">
              <div className="px-4 py-2 bg-wc-surface border-b border-wc-border">
                <span className="text-[11px] font-semibold text-wc-dimmed uppercase tracking-widest">
                  {group}
                </span>
              </div>

              <div>
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
                    <div key={matchId} className="border-b border-wc-border">
                      {/* Match row */}
                      <button
                        onClick={() => toggleMatch(match)}
                        className="w-full flex items-center h-13 px-4 hover:bg-wc-surface-2 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <img
                            src={match.teams.home.logo}
                            className="w-5 h-5 object-contain shrink-0"
                            loading="lazy"
                          />
                          <span className="text-sm text-white truncate">
                            {match.teams.home.name}
                          </span>
                        </div>

                        <div className="flex flex-col items-center w-24 shrink-0">
                          {match.goals.home !== null ? (
                            <span className="font-bold text-sm">
                              {match.goals.home} â€“ {match.goals.away}
                            </span>
                          ) : (
                            <span className="text-xs text-wc-muted">
                              {new Date(match.fixture.date).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <span className="text-sm text-white truncate">
                            {match.teams.away.name}
                          </span>
                          <img
                            src={match.teams.away.logo}
                            className="w-5 h-5 object-contain shrink-0"
                            loading="lazy"
                          />
                        </div>

                        <div className="ml-3 text-wc-dimmed shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </button>

                      {/* Fan pick bar â€” inline below row */}
                      {stats && !isExpanded && (
                        <div className="px-4 pb-2.5 bg-wc-black">
                          <div className="flex w-full h-1.5 bg-wc-border overflow-hidden mb-1.5">
                            <div
                              className="bg-wc-red h-full"
                              style={{ width: `${stats.homePct}%` }}
                            />
                            <div
                              className="bg-wc-blue h-full"
                              style={{ width: `${stats.awayPct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-wc-red">{stats.homePct}%</span>
                            <div className="flex items-center gap-1 text-wc-dimmed">
                              <Users className="w-3 h-3" />
                              <span>{stats.total} votes</span>
                            </div>
                            <span className="font-bold text-wc-blue">{stats.awayPct}%</span>
                          </div>
                        </div>
                      )}

                      {!stats && !isExpanded && (
                        <div className="px-4 pb-2 bg-wc-black">
                          <p className="text-wc-dimmed/50 text-xs text-center">No votes yet</p>
                        </div>
                      )}

                      {/* Expanded XI */}
                      {isExpanded && (
                        <div className="border-t border-wc-border px-4 py-4 bg-wc-surface">
                          {/* Fan pick bar inside expanded */}
                          {stats && (
                            <div className="mb-4">
                              <div className="flex w-full h-1.5 bg-wc-border overflow-hidden mb-1.5">
                                <div
                                  className="bg-wc-red h-full"
                                  style={{ width: `${stats.homePct}%` }}
                                />
                                <div
                                  className="bg-wc-blue h-full"
                                  style={{ width: `${stats.awayPct}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="font-bold text-wc-red">{stats.homePct}%</span>
                                <div className="flex items-center gap-1 text-wc-dimmed">
                                  <Users className="w-3 h-3" />
                                  <span>{stats.total} votes</span>
                                </div>
                                <span className="font-bold text-wc-blue">{stats.awayPct}%</span>
                              </div>
                            </div>
                          )}

                          <p className="text-[11px] font-semibold text-wc-dimmed uppercase tracking-widest mb-3">
                            Fan Predicted Lineups
                          </p>

                          {isLoadingXI ? (
                            <div className="flex flex-col gap-1">
                              {[...Array(4)].map((_, k) => (
                                <div
                                  key={k}
                                  className="h-8 bg-wc-border/30 animate-pulse"
                                />
                              ))}
                            </div>
                          ) : xi ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                              {/* Home XI */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <img
                                    src={match.teams.home.logo}
                                    className="w-4 h-4 object-contain"
                                    loading="lazy"
                                  />
                                  <span className="font-bebas text-sm">
                                    {match.teams.home.name}
                                  </span>
                                  <span className="text-wc-dimmed text-xs">
                                    ({xi.homeTotal})
                                  </span>
                                </div>
                                {xi.home.length === 0 ? (
                                  <p className="text-wc-dimmed text-xs">No predicted XIs yet</p>
                                ) : (
                                  <div>
                                    {xi.home.map((player) => (
                                      <div
                                        key={player.id}
                                        className="flex items-center gap-2 py-1.5 border-b border-wc-border/30"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm text-white truncate">
                                            {player.name}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <div className="w-16 h-1 bg-wc-border overflow-hidden">
                                            <div
                                              className="h-full bg-wc-red"
                                              style={{ width: `${player.pct}%` }}
                                            />
                                          </div>
                                          <span className="text-xs text-wc-muted w-8 text-right">
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
                                <div className="flex items-center gap-2 mb-2">
                                  <img
                                    src={match.teams.away.logo}
                                    className="w-4 h-4 object-contain"
                                    loading="lazy"
                                  />
                                  <span className="font-bebas text-sm">
                                    {match.teams.away.name}
                                  </span>
                                  <span className="text-wc-dimmed text-xs">
                                    ({xi.awayTotal})
                                  </span>
                                </div>
                                {xi.away.length === 0 ? (
                                  <p className="text-wc-dimmed text-xs">No predicted XIs yet</p>
                                ) : (
                                  <div>
                                    {xi.away.map((player) => (
                                      <div
                                        key={player.id}
                                        className="flex items-center gap-2 py-1.5 border-b border-wc-border/30"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm text-white truncate">
                                            {player.name}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <div className="w-16 h-1 bg-wc-border overflow-hidden">
                                            <div
                                              className="h-full bg-wc-blue"
                                              style={{ width: `${player.pct}%` }}
                                            />
                                          </div>
                                          <span className="text-xs text-wc-muted w-8 text-right">
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
                            <p className="text-wc-dimmed text-xs text-center py-2">
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

