'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Star, X } from 'lucide-react'
import PitchXI from '../../components/PitchXI'

interface MatchData {
  fixture: {
    id: number
    date: string
    status: { short: string; long: string; elapsed: number | null }
    venue: { name: string | null; city: string | null }
  }
  league: { round: string }
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null }
    away: { id: number; name: string; logo: string; winner: boolean | null }
  }
  goals: { home: number | null; away: number | null }
  score: {
    halftime: { home: number | null; away: number | null }
    fulltime: { home: number | null; away: number | null }
  }
}

interface PredictedPlayer {
  id: number
  name: string
  count: number
  pct: number
}

const POSITION_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker']

export default function MatchPage() {
  const [match, setMatch] = useState<MatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [homeSquad, setHomeSquad] = useState<any[]>([])
  const [awaySquad, setAwaySquad] = useState<any[]>([])
  const [ratings, setRatings] = useState<Record<number, number>>({})
  const [avgRatings, setAvgRatings] = useState<Record<number, number>>({})
  const [homePredicted, setHomePredicted] = useState<PredictedPlayer[]>([])
  const [awayPredicted, setAwayPredicted] = useState<PredictedPlayer[]>([])
  const [homeXITotal, setHomeXITotal] = useState(0)
  const [awayXITotal, setAwayXITotal] = useState(0)
  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home')
  const activeTeamRef = useRef<'home' | 'away'>('home')
  const [homeUserXI, setHomeUserXI] = useState<Record<string, any> | null>(null)
  const [awayUserXI, setAwayUserXI] = useState<Record<string, any> | null>(null)
  const [homeUserFormation, setHomeUserFormation] = useState<
    string | undefined
  >(undefined)
  const [awayUserFormation, setAwayUserFormation] = useState<
    string | undefined
  >(undefined)
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const matchId = params.id

  useEffect(() => {
    activeTeamRef.current = activeTeam
  }, [activeTeam])

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

      if (data) {
        await Promise.all([
          loadSquads(data.teams.home.id, data.teams.away.id),
          loadRatings(matchId as string),
          loadPredictedXIs(data.teams.home.id, data.teams.away.id)
        ])
      }
      setLoading(false)
    }
    init()
  }, [matchId])

  async function loadSquads(homeId: number, awayId: number) {
    const [homeRes, awayRes] = await Promise.all([
      fetch(`/api/teams/${homeId}`),
      fetch(`/api/teams/${awayId}`)
    ])
    const [homeData, awayData] = await Promise.all([
      homeRes.json(),
      awayRes.json()
    ])
    setHomeSquad(homeData?.players || [])
    setAwaySquad(awayData?.players || [])
  }

  async function loadPredictedXIs(homeId: number, awayId: number) {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    // All XIs for this match
    const { data: xis } = await supabase
      .from('predicted_xi')
      .select('team_id, players, formation, user_id')
      .eq('match_id', Number(matchId))
      .in('team_id', [homeId, awayId])

    function aggregate(teamId: number) {
      const teamXIs = xis?.filter((xi) => xi.team_id === teamId) || []
      const counts: Record<number, { name: string; count: number }> = {}
      teamXIs.forEach((xi) => {
        Object.values(xi.players || {}).forEach((p: any) => {
          if (!p?.id) return
          if (!counts[p.id]) counts[p.id] = { name: p.name, count: 0 }
          counts[p.id].count++
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

    const home = aggregate(homeId)
    const away = aggregate(awayId)
    setHomePredicted(home.players)
    setAwayPredicted(away.players)
    setHomeXITotal(home.total)
    setAwayXITotal(away.total)

    // Load current user's saved XI for each team
    if (user) {
      const myHomeXI = xis?.find(
        (xi) => xi.team_id === homeId && xi.user_id === user.id
      )
      const myAwayXI = xis?.find(
        (xi) => xi.team_id === awayId && xi.user_id === user.id
      )
      if (myHomeXI) {
        setHomeUserXI(myHomeXI.players)
        setHomeUserFormation(myHomeXI.formation)
      }
      if (myAwayXI) {
        setAwayUserXI(myAwayXI.players)
        setAwayUserFormation(myAwayXI.formation)
      }
    }
  }

  async function loadRatings(matchId: string) {
    const { data } = await supabase
      .from('player_ratings')
      .select('player_id, rating')
      .eq('match_id', matchId)

    const {
      data: { user }
    } = await supabase.auth.getUser()
    const { data: myRatings } = await supabase
      .from('player_ratings')
      .select('player_id, rating')
      .eq('match_id', matchId)
      .eq('user_id', user?.id)

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
      const u = { ...prev }
      delete u[playerId]
      return u
    })
    setAvgRatings((prev) => {
      const u = { ...prev }
      delete u[playerId]
      return u
    })
  }

  async function saveXI(formation: string, players: any) {
    if (!match || !user) return
    const teamId =
      activeTeamRef.current === 'home'
        ? match.teams.home.id
        : match.teams.away.id
    await supabase.from('predicted_xi').upsert(
      {
        user_id: user.id,
        match_id: Number(matchId),
        team_id: teamId,
        formation,
        players
      },
      { onConflict: 'user_id,match_id,team_id' }
    )
    await loadPredictedXIs(match.teams.home.id, match.teams.away.id)
    alert('XI Saved!')
  }

  function formatStatus(status: string) {
    switch (status) {
      case 'FT':
        return { label: 'FT', color: 'text-gray-400' }
      case '1H':
      case '2H':
        return { label: 'LIVE', color: 'text-green-400 animate-pulse' }
      case 'HT':
        return { label: 'HT', color: 'text-yellow-400' }
      case 'NS':
        return { label: 'Upcoming', color: 'text-blue-400' }
      default:
        return { label: status, color: 'text-gray-400' }
    }
  }

  function formatStage(round: string) {
    return round.replace('Group Stage - ', 'Group ')
  }

  function groupByPosition(squad: any[]) {
    const groups: Record<string, any[]> = {}
    POSITION_ORDER.forEach((pos) => {
      groups[pos] = []
    })
    squad.forEach((p) => {
      if (groups[p.position]) groups[p.position].push(p)
    })
    return groups
  }

  const isLive = match
    ? ['1H', '2H', 'HT', 'ET', 'P'].includes(match.fixture.status.short)
    : false
  const isFinished = match?.fixture.status.short === 'FT'
  const isStarted = isLive || isFinished
  const isUpcoming = match?.fixture.status.short === 'NS'

  const activeSquad = activeTeam === 'home' ? homeSquad : awaySquad
  const activePredicted = activeTeam === 'home' ? homePredicted : awayPredicted
  const activeTotal = activeTeam === 'home' ? homeXITotal : awayXITotal

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

  const status = formatStatus(match.fixture.status.short)

  return (
    <main className="min-h-screen bg-[#06090f] text-white">
      <div className="max-w-4xl mx-auto px-8 py-10">
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
              {formatStage(match.league.round)}
            </span>
            <span className={`text-xs font-bold uppercase ${status.color}`}>
              {status.label}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center gap-3 w-2/5">
              <img
                src={match.teams.home.logo}
                className="w-20 h-20 object-contain"
              />
              <p className="font-bold text-lg text-center">
                {match.teams.home.name}
              </p>
            </div>

            <div className="flex flex-col items-center gap-2 w-1/5">
              {match.goals.home !== null ? (
                <>
                  <p className="text-5xl font-black">
                    {match.goals.home} - {match.goals.away}
                  </p>
                  {match.score.halftime.home !== null && (
                    <p className="text-gray-500 text-xs">
                      HT: {match.score.halftime.home} -{' '}
                      {match.score.halftime.away}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-3xl font-black text-gray-500">vs</p>
                  <p className="text-gray-400 text-sm">
                    {new Date(match.fixture.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {new Date(match.fixture.date).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}{' '}
                    UTC
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-col items-center gap-3 w-2/5">
              <img
                src={match.teams.away.logo}
                className="w-20 h-20 object-contain"
              />
              <p className="font-bold text-lg text-center">
                {match.teams.away.name}
              </p>
            </div>
          </div>
        </div>

        {/* Lineups section */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-3">
            <span className="w-1 h-5 bg-gradient-to-b from-green-500 to-yellow-500 rounded-full" />
            {isUpcoming ? 'Predicted Lineups' : 'Lineups'}
          </h2>
          {isUpcoming && (
            <p className="text-gray-600 text-xs mb-5">
              Official lineups will replace these once announced
            </p>
          )}

          {/* Team toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTeam('home')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                activeTeam === 'home'
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'
              }`}
            >
              <img
                src={match.teams.home.logo}
                className="w-4 h-4 object-contain"
              />
              {match.teams.home.name}
            </button>
            <button
              onClick={() => setActiveTeam('away')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                activeTeam === 'away'
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'
              }`}
            >
              <img
                src={match.teams.away.logo}
                className="w-4 h-4 object-contain"
              />
              {match.teams.away.name}
            </button>
          </div>

          {/* UPCOMING — PitchXI picker + community predictions */}
          {isUpcoming && (
            <div className="flex flex-col gap-10">
              <div>
                <p className="text-sm font-semibold text-gray-300 mb-4">
                  Pick your predicted XI for{' '}
                  {activeTeam === 'home'
                    ? match.teams.home.name
                    : match.teams.away.name}
                </p>
                <PitchXI
                  key={activeTeam}
                  squad={activeSquad}
                  teamId={
                    activeTeam === 'home'
                      ? match.teams.home.id
                      : match.teams.away.id
                  }
                  userId={user?.id}
                  savedFormation={
                    activeTeam === 'home'
                      ? homeUserFormation
                      : awayUserFormation
                  }
                  savedXI={activeTeam === 'home' ? homeUserXI ?? undefined : awayUserXI ?? undefined}
                  onSave={saveXI}
                />
              </div>

            
            </div>
          )}

          {/* LIVE / FINISHED — flat card list with ratings */}
          {isStarted &&
            (() => {
              const squad = activeTeam === 'home' ? homeSquad : awaySquad
              const teamId =
                activeTeam === 'home'
                  ? match.teams.home.id
                  : match.teams.away.id
              const grouped = groupByPosition(squad)

              return (
                <div className="flex flex-col gap-6">
                  {POSITION_ORDER.map((position) => {
                    const players = grouped[position]
                    if (!players || players.length === 0) return null
                    const label =
                      position === 'Attacker'
                        ? 'Forwards'
                        : position === 'Goalkeeper'
                          ? 'Goalkeeper'
                          : position + 's'

                    return (
                      <div key={position}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                          {label}
                        </p>
                        <div className="flex flex-col gap-2">
                          {players.map((player: any) => (
                            <div
                              key={player.id}
                              className="flex items-center gap-3 bg-gray-800/40 rounded-xl px-4 py-3"
                            >
                              <span className="text-gray-600 text-xs font-bold w-5 text-center flex-shrink-0">
                                {player.number ?? '—'}
                              </span>
                              <img
                                src={player.photo}
                                className="w-9 h-9 rounded-full object-cover bg-gray-700 flex-shrink-0"
                                onError={(e) => {
                                  ;(
                                    e.target as HTMLImageElement
                                  ).style.display = 'none'
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {player.name}
                                </p>
                              </div>
                              {avgRatings[player.id] && (
                                <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold flex-shrink-0">
                                  <Star className="w-3 h-3 fill-yellow-400" />
                                  {avgRatings[player.id]}
                                </span>
                              )}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <input
                                  type="number"
                                  min={1}
                                  max={10}
                                  value={ratings[player.id] || ''}
                                  onChange={(e) => {
                                    const val = Number(e.target.value)
                                    if (val >= 1 && val <= 10)
                                      ratePlayer(player, teamId, val)
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
                    )
                  })}
                </div>
              )
            })()}
        </div>
      </div>
    </main>
  )
}
