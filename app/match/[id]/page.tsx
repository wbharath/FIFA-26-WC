'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Star, X } from 'lucide-react'

interface MatchData {
  id: number
  utcDate: string
  status: string
  stage: string
  group: string | null
  matchday: number | null
  homeTeam: { id: number; name: string; shortName: string; crest: string }
  awayTeam: { id: number; name: string; shortName: string; crest: string }
  score: {
    winner: string | null
    fullTime: { home: number | null; away: number | null }
    halfTime: { home: number | null; away: number | null }
  }
}

export default function MatchPage() {
  const [match, setMatch] = useState<MatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [homeSquad, setHomeSquad] = useState<any[]>([])
  const [awaySquad, setAwaySquad] = useState<any[]>([])
  const [ratings, setRatings] = useState<Record<number, number>>({})
  const [avgRatings, setAvgRatings] = useState<Record<number, number>>({})
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const matchId = params.id

  useEffect(() => {
    async function init() {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)

      const res = await fetch(`/api/match/${matchId}`)
      const data = await res.json()
      setMatch(data)
      await loadSquads(data.homeTeam.id, data.awayTeam.id)
      await loadRatings(matchId as string)
      setLoading(false)
    }
    init()
  }, [matchId])

  function formatStatus(status: string) {
    switch (status) {
      case 'FINISHED':
        return { label: 'FT', color: 'text-gray-400' }
      case 'IN_PLAY':
        return { label: 'LIVE', color: 'text-green-400 animate-pulse' }
      case 'PAUSED':
        return { label: 'HT', color: 'text-yellow-400' }
      case 'TIMED':
        return { label: 'Upcoming', color: 'text-blue-400' }
      default:
        return { label: status, color: 'text-gray-400' }
    }
  }

  function formatStage(stage: string, group: string | null) {
    if (group) return group.replace('GROUP_', 'Group ')
    return stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }

  async function loadSquads(homeId: number, awayId: number) {
    const [homeRes, awayRes] = await Promise.all([
      fetch(`/api/teams/${homeId}`),
      fetch(`/api/teams/${awayId}`)
    ])
    const [homeData, awayData] = await Promise.all([
      homeRes.json(),
      awayRes.json()
    ])
    setHomeSquad(homeData.squad || [])
    setAwaySquad(awayData.squad || [])
  }

  async function loadRatings(matchId: string) {
    const { data } = await supabase
      .from('player_ratings')
      .select('player_id, rating')
      .eq('match_id', matchId)

    // User's own ratings
    const {
      data: { user }
    } = await supabase.auth.getUser()
    const { data: myRatings } = await supabase
      .from('player_ratings')
      .select('player_id, rating')
      .eq('match_id', matchId)
      .eq('user_id', user?.id)

    // Average ratings per player
    const avgMap: Record<number, number> = {}
    const countMap: Record<number, number> = {}
    data?.forEach((r) => {
      avgMap[r.player_id] = (avgMap[r.player_id] || 0) + r.rating
      countMap[r.player_id] = (countMap[r.player_id] || 0) + 1
    })
    Object.keys(avgMap).forEach((id) => {
      avgMap[Number(id)] =
        Math.round((avgMap[Number(id)] / countMap[Number(id)]) * 10) / 10
    })
    setAvgRatings(avgMap)

    // User's own ratings map
    const myMap: Record<number, number> = {}
    myRatings?.forEach((r) => {
      myMap[r.player_id] = r.rating
    })
    setRatings(myMap)
  }

  async function ratePlayer(player: any, teamId: number, rating: number) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('player_ratings').upsert(
      {
        user_id: user.id,
        match_id: Number(matchId),
        player_id: player.id,
        player_name: player.name,
        team_id: teamId,
        rating
      },
      { onConflict: 'user_id,match_id,player_id' }
    )

    setRatings((prev) => ({ ...prev, [player.id]: rating }))

    // Update avg optimistically
    setAvgRatings((prev) => ({ ...prev, [player.id]: rating }))
  }

  async function clearRating(playerId: number) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('player_ratings')
      .delete()
      .eq('user_id', user.id)
      .eq('match_id', Number(matchId))
      .eq('player_id', playerId)

    setRatings((prev) => {
      const updated = { ...prev }
      delete updated[playerId]
      return updated
    })

    setAvgRatings((prev) => {
      const updated = { ...prev }
      delete updated[playerId]
      return updated
    })
  }

  if (loading)
    return (
      <main className="min-h-screen bg-[#06090f] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </main>
    )

  if (!match)
    return (
      <main className="min-h-screen bg-[#06090f] text-white flex items-center justify-center">
        <p className="text-gray-400">Match not found</p>
      </main>
    )

  const status = formatStatus(match.status)
  return (
    <main className="min-h-screen bg-[#06090f] text-white">
      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* Back button */}
        <Link
          href="/fixtures"
          className="text-gray-400 hover:text-white text-sm flex items-center gap-2 mb-8 transition"
        >
          ← Back to Fixtures
        </Link>

        {/* Match header */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <span className="text-gray-500 text-xs uppercase tracking-widest">
              {formatStage(match.stage, match.group)}
              {match.matchday && ` · Matchday ${match.matchday}`}
            </span>
            <span className={`text-xs font-bold uppercase ${status.color}`}>
              {status.label}
            </span>
          </div>

          <div className="flex items-center justify-between">
            {/* Home team */}
            <div className="flex flex-col items-center gap-3 w-2/5">
              <img
                src={match.homeTeam.crest}
                className="w-20 h-20 object-contain"
              />
              <p className="font-bold text-lg text-center">
                {match.homeTeam.name}
              </p>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center gap-2 w-1/5">
              {match.score.fullTime.home !== null ? (
                <>
                  <p className="text-5xl font-black">
                    {match.score.fullTime.home} - {match.score.fullTime.away}
                  </p>
                  {match.score.halfTime.home !== null && (
                    <p className="text-gray-500 text-xs">
                      HT: {match.score.halfTime.home} -{' '}
                      {match.score.halfTime.away}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-3xl font-black text-gray-500">vs</p>
                  <p className="text-gray-400 text-sm">
                    {new Date(match.utcDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {new Date(match.utcDate).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}{' '}
                    UTC
                  </p>
                </>
              )}
            </div>

            {/* Away team */}
            <div className="flex flex-col items-center gap-3 w-2/5">
              <img
                src={match.awayTeam.crest}
                className="w-20 h-20 object-contain"
              />
              <p className="font-bold text-lg text-center">
                {match.awayTeam.name}
              </p>
            </div>
          </div>
        </div>

        {/* Lineups placeholder */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-3">
            <span className="w-1 h-5 bg-gradient-to-b from-green-500 to-yellow-500 rounded-full" />
            Lineups
          </h2>
          <p className="text-gray-500 text-sm">
            Lineups will appear here once announced before the match.
          </p>
        </div>

        {/* Player ratings placeholder */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-3">
            <span className="w-1 h-5 bg-gradient-to-b from-yellow-500 to-amber-600 rounded-full" />
            Player Ratings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Home team */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img
                  src={match.homeTeam.crest}
                  className="w-6 h-6 object-contain"
                />
                <h3 className="font-bold">{match.homeTeam.name}</h3>
              </div>
              <div className="flex flex-col gap-2">
                {homeSquad.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{player.name}</p>
                      <p className="text-xs text-gray-500">{player.position}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {avgRatings[player.id] && (
                        <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                          <Star className="w-3 h-3 fill-yellow-400" />
                          {avgRatings[player.id]}
                        </span>
                      )}
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={ratings[player.id] || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          if (val >= 1 && val <= 10)
                            ratePlayer(player, match.homeTeam.id, val)
                        }}
                        className="w-12 bg-gray-700 border border-gray-600 rounded text-center text-sm text-white focus:border-yellow-500 focus:outline-none"
                        placeholder="1-10"
                      />
                      {ratings[player.id] && (
                        <button
                          onClick={() => clearRating(player.id)}
                          className="text-gray-500 hover:text-red-400 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Away team */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img
                  src={match.awayTeam.crest}
                  className="w-6 h-6 object-contain"
                />
                <h3 className="font-bold">{match.awayTeam.name}</h3>
              </div>
              <div className="flex flex-col gap-2">
                {awaySquad.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{player.name}</p>
                      <p className="text-xs text-gray-500">{player.position}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {avgRatings[player.id] && (
                        <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                          <Star className="w-3 h-3 fill-yellow-400" />
                          {avgRatings[player.id]}
                        </span>
                      )}
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={ratings[player.id] || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          if (val >= 1 && val <= 10)
                            ratePlayer(player, match.homeTeam.id, val)
                        }}
                        className="w-12 bg-gray-700 border border-gray-600 rounded text-center text-sm text-white focus:border-yellow-500 focus:outline-none"
                        placeholder="1-10"
                      />
                      {ratings[player.id] && (
                        <button
                          onClick={() => clearRating(player.id)}
                          className="text-gray-500 hover:text-red-400 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
