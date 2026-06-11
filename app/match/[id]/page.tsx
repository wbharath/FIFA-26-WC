'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Star, X } from 'lucide-react'
import PitchXI from '../../components/PitchXI'
import LineupPitch from '../../components/LineupPitch'

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

const POSITION_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker']

function mapLineupToSlots(
  startXI: any[],
  formation: string,
  squad: any[]
): Record<string, any> {
  const lines = formation.split('-').map(Number)
  const squadMap: Record<number, any> = {}
  squad.forEach((p: any) => { squadMap[p.id] = p })

  const result: Record<string, any> = {}

  const gkEntry = startXI.find((e) => e.player.pos === 'G')
  if (gkEntry) {
    const p = gkEntry.player
    result['GK-0'] = {
      id: p.id,
      name: p.name,
      number: p.number,
      pos: p.pos,
      photo:
        squadMap[p.id]?.photo ??
        `https://media.api-sports.io/football/players/${p.id}.png`
    }
  }

  const outfield = startXI.filter((e) => e.player.pos !== 'G')
  const byRow: Record<number, any[]> = {}
  outfield.forEach((e) => {
    const row = Number(e.player.grid?.split(':')[0] ?? 2)
    if (!byRow[row]) byRow[row] = []
    byRow[row].push(e)
  })

  const rows = Object.keys(byRow).map(Number).sort((a, b) => a - b)
  rows.forEach((row, lineIndex) => {
    if (lineIndex >= lines.length) return
    const role =
      lineIndex === lines.length - 1 ? 'FWD' : lineIndex === 0 ? 'DEF' : 'MID'
    const playersInRow = byRow[row].sort(
      (a, b) =>
        Number(a.player.grid?.split(':')[1] ?? 1) -
        Number(b.player.grid?.split(':')[1] ?? 1)
    )
    playersInRow.forEach((e, i) => {
      const p = e.player
      result[`${role}-${lineIndex}-${i}`] = {
        id: p.id,
        name: p.name,
        number: p.number,
        pos: p.pos,
        photo:
          squadMap[p.id]?.photo ??
          `https://media.api-sports.io/football/players/${p.id}.png`
      }
    })
  })

  return result
}

function MatchSkeleton() {
  return (
    <main className="min-h-screen bg-wc-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="h-4 w-32 bg-wc-surface rounded animate-pulse mb-8" />
        <div className="bg-wc-surface border border-wc-border overflow-hidden mb-6">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="h-3 w-24 bg-wc-border rounded animate-pulse" />
              <div className="h-3 w-16 bg-wc-border rounded animate-pulse" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center gap-3 w-2/5">
                <div className="w-20 h-20 bg-wc-border rounded animate-pulse" />
                <div className="h-5 w-32 bg-wc-border rounded animate-pulse" />
              </div>
              <div className="w-1/5 flex justify-center">
                <div className="h-16 w-32 bg-wc-border rounded animate-pulse" />
              </div>
              <div className="flex flex-col items-center gap-3 w-2/5">
                <div className="w-20 h-20 bg-wc-border rounded animate-pulse" />
                <div className="h-5 w-32 bg-wc-border rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-wc-surface border border-wc-border p-6">
          <div className="h-6 w-40 bg-wc-border rounded animate-pulse mb-6" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-wc-border/40 animate-pulse mb-px" />
          ))}
        </div>
      </div>
    </main>
  )
}

export default function MatchPage() {
  const [match, setMatch] = useState<MatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [homeSquad, setHomeSquad] = useState<any[]>([])
  const [awaySquad, setAwaySquad] = useState<any[]>([])
  const [ratings, setRatings] = useState<Record<number, number>>({})
  const [avgRatings, setAvgRatings] = useState<Record<number, number>>({})
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
  const [homeCommunityXI, setHomeCommunityXI] = useState<Record<
    string,
    any
  > | null>(null)
  const [awayCommunityXI, setAwayCommunityXI] = useState<Record<
    string,
    any
  > | null>(null)
  const [homeCommunityFormation, setHomeCommunityFormation] = useState<
    string | undefined
  >(undefined)
  const [awayCommunityFormation, setAwayCommunityFormation] = useState<
    string | undefined
  >(undefined)
  const [homeCommunityCount, setHomeCommunityCount] = useState(0)
  const [awayCommunityCount, setAwayCommunityCount] = useState(0)
  const [xiView, setXiView] = useState<'mine' | 'community'>('mine')
  const [homeLineup, setHomeLineup] = useState<any>(null)
  const [awayLineup, setAwayLineup] = useState<any>(null)
  const [lineupsAvailable, setLineupsAvailable] = useState(false)
  const [matchEvents, setMatchEvents] = useState<any[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const matchId = params.id
  const [sentiment, setSentiment] = useState<string | null | undefined>(
    undefined
  )

  useEffect(() => {
    activeTeamRef.current = activeTeam
  }, [activeTeam])

  useEffect(() => {
    async function init() {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const res = await fetch(`/api/match/${matchId}`)
      const data = await res.json()
      setMatch(data)

      if (data) {
        await Promise.all([
          loadSquads(data.teams.home.id, data.teams.away.id),
          loadRatings(matchId as string, user),
          loadPredictedXIs(data.teams.home.id, data.teams.away.id, user),
          loadLineups()
        ])
        const { data: sentimentData } = await supabase
          .from('match_sentiment')
          .select('sentiment_text')
          .eq('fixture_id', Number(matchId))
          .single()
        setSentiment(sentimentData?.sentiment_text ?? null)
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

  async function loadLineups() {
    const [lineupRes, eventsRes] = await Promise.all([
      fetch(`/api/lineups/${matchId}`),
      fetch(`/api/events/${matchId}`)
    ])
    const [lineupData, eventsData] = await Promise.all([
      lineupRes.json(),
      eventsRes.json()
    ])
    if (lineupData?.home?.startXI?.length > 0) {
      setHomeLineup(lineupData.home)
      setAwayLineup(lineupData.away)
      setLineupsAvailable(true)
    }
    setMatchEvents(eventsData || [])
  }

  async function loadPredictedXIs(homeId: number, awayId: number, user: any) {
    const { data: xis } = await supabase
      .from('predicted_xi')
      .select('team_id, players, formation, user_id')
      .eq('match_id', Number(matchId))
      .in('team_id', [homeId, awayId])

    if (!xis) return

    // My XI
    if (user) {
      const myHomeXI = xis.find(
        (xi) => xi.team_id === homeId && xi.user_id === user.id
      )
      const myAwayXI = xis.find(
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

    // Community counts
    const homeXIs = xis.filter((xi) => xi.team_id === homeId)
    const awayXIs = xis.filter((xi) => xi.team_id === awayId)
    setHomeCommunityCount(homeXIs.length)
    setAwayCommunityCount(awayXIs.length)

    // Community XI from pre-computed table
    const { data: communityData } = await supabase
      .from('community_xi')
      .select('players, formation, team_id')
      .eq('fixture_id', Number(matchId))
      .in('team_id', [homeId, awayId])

    if (communityData) {
      const homeCommunity = communityData.find((c) => c.team_id === homeId)
      const awayCommunity = communityData.find((c) => c.team_id === awayId)
      if (homeCommunity) {
        setHomeCommunityXI(homeCommunity.players)
        setHomeCommunityFormation(homeCommunity.formation)
      }
      if (awayCommunity) {
        setAwayCommunityXI(awayCommunity.players)
        setAwayCommunityFormation(awayCommunity.formation)
      }
    }
  }

  async function loadRatings(matchId: string, user: any) {
    const { data } = await supabase
      .from('player_ratings')
      .select('player_id, rating, user_id')
      .eq('match_id', matchId)

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
    data?.filter((r) => r.user_id === user?.id).forEach((r) => {
      myMap[r.player_id] = r.rating
    })
    setRatings(myMap)
  }

  async function ratePlayer(player: any, teamId: number, rating: number, user: any) {
    if (!user) return
    await supabase
      .from('player_ratings')
      .upsert(
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

  async function clearRating(playerId: number, user: any) {
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
    await supabase
      .from('predicted_xi')
      .upsert(
        {
          user_id: user.id,
          match_id: Number(matchId),
          team_id: teamId,
          formation,
          players
        },
        { onConflict: 'user_id,match_id,team_id' }
      )
    if (activeTeamRef.current === 'home') {
      setHomeUserXI(players)
      setHomeUserFormation(formation)
    } else {
      setAwayUserXI(players)
      setAwayUserFormation(formation)
    }
    alert('XI Saved!')
  }

  function resolvePhoto(playerId: number, teamSide: 'home' | 'away'): string {
    const squad = teamSide === 'home' ? homeSquad : awaySquad
    const found = squad.find((p: any) => p.id === playerId)
    return (
      found?.photo ??
      `https://media.api-sports.io/football/players/${playerId}.png`
    )
  }

  function getSubOff(playerId: number, teamId: number) {
    return matchEvents.find(
      (e) =>
        e.type === 'subst' &&
        e.team.id === teamId &&
        e.assist?.id === playerId
    )
  }

  function getSubOn(playerId: number, teamId: number) {
    return matchEvents.find(
      (e) =>
        e.type === 'subst' &&
        e.team.id === teamId &&
        e.player?.id === playerId
    )
  }

  function isSubbedOff(playerId: number, teamId: number): boolean {
    return !!getSubOff(playerId, teamId)
  }

  function getPlayerGoals(playerId: number) {
    return matchEvents.filter(
      (e) =>
        e.type === 'Goal' &&
        e.player?.id === playerId &&
        e.detail !== 'Own Goal'
    )
  }

  function getPlayerOwnGoals(playerId: number) {
    return matchEvents.filter(
      (e) =>
        e.type === 'Goal' &&
        e.player?.id === playerId &&
        e.detail === 'Own Goal'
    )
  }

  function getPlayerAssists(playerId: number) {
    return matchEvents.filter(
      (e) =>
        e.type === 'Goal' &&
        e.assist?.id === playerId &&
        e.detail !== 'Own Goal'
    )
  }

  function statusBadge(short: string) {
    switch (short) {
      case 'FT':
        return (
          <span className="bg-wc-border text-wc-muted text-xs font-bold px-2 py-0.5 rounded uppercase">
            FT
          </span>
        )
      case '1H':
      case '2H':
        return (
          <span className="flex items-center gap-1.5 bg-wc-neon text-wc-black text-xs font-bold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-wc-black rounded-full live-dot" />
            LIVE
          </span>
        )
      case 'HT':
        return (
          <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded uppercase">
            HT
          </span>
        )
      case 'NS':
        return (
          <span className="bg-wc-blue text-white text-xs font-bold px-2 py-0.5 rounded uppercase">
            Upcoming
          </span>
        )
      default:
        return (
          <span className="text-wc-muted text-xs font-bold uppercase">
            {short}
          </span>
        )
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
  const activeLineup = activeTeam === 'home' ? homeLineup : awayLineup
  const communityCount =
    activeTeam === 'home' ? homeCommunityCount : awayCommunityCount
  const communityXI = activeTeam === 'home' ? homeCommunityXI : awayCommunityXI
  const communityFormation =
    activeTeam === 'home' ? homeCommunityFormation : awayCommunityFormation

  if (loading) return <MatchSkeleton />
  if (!match)
    return (
      <main className="min-h-screen bg-wc-black text-white flex items-center justify-center">
        <p className="text-wc-muted">Match not found</p>
      </main>
    )

  const activeTeamId =
    activeTeam === 'home' ? match.teams.home.id : match.teams.away.id

  return (
    <main className="min-h-screen bg-wc-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <Link
          href="/fixtures"
          className="text-wc-muted hover:text-white text-sm flex items-center gap-2 mb-8 transition-colors duration-150"
        >
          ← Back to Fixtures
        </Link>

        {/* Match header */}
        <div className="bg-wc-surface border border-wc-border overflow-hidden mb-6">
          <div className="p-4 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <span className="text-wc-dimmed text-xs uppercase tracking-widest">
                {formatStage(match.league.round)}
              </span>
              {statusBadge(match.fixture.status.short)}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center gap-2 sm:gap-3 w-2/5">
                <img
                  src={match.teams.home.logo}
                  className="w-12 h-12 sm:w-20 sm:h-20 object-contain"
                  loading="lazy"
                />
                <p className="font-bebas text-sm sm:text-xl text-center">
                  {match.teams.home.name}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 w-1/5">
                {match.goals.home !== null ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans font-black text-3xl sm:text-6xl leading-none">
                        {match.goals.home}
                      </span>
                      <span className="text-wc-dimmed text-2xl sm:text-5xl font-light leading-none">
                        –
                      </span>
                      <span className="font-sans font-black text-3xl sm:text-6xl leading-none">
                        {match.goals.away}
                      </span>
                    </div>
                    {match.score.halftime.home !== null && (
                      <p className="text-wc-dimmed text-xs">
                        HT: {match.score.halftime.home} –{' '}
                        {match.score.halftime.away}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-sans font-bold text-3xl text-wc-muted">
                      vs
                    </p>
                    <p className="text-wc-muted text-sm">
                      {new Date(match.fixture.date).toLocaleDateString(
                        'en-GB',
                        { day: 'numeric', month: 'short', year: 'numeric' }
                      )}
                    </p>
                    <p className="text-wc-dimmed text-xs">
                      {new Date(match.fixture.date).toLocaleTimeString(
                        'en-GB',
                        { hour: '2-digit', minute: '2-digit' }
                      )}{' '}
                      UTC
                    </p>
                  </>
                )}
              </div>
              <div className="flex flex-col items-center gap-2 sm:gap-3 w-2/5">
                <img
                  src={match.teams.away.logo}
                  className="w-12 h-12 sm:w-20 sm:h-20 object-contain"
                  loading="lazy"
                />
                <p className="font-bebas text-sm sm:text-xl text-center">
                  {match.teams.away.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fan Buzz */}
        {sentiment !== null && (
          <div className="bg-wc-surface border border-wc-border rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-4 bg-wc-red rounded-full" />
              <p className="text-xs font-semibold uppercase tracking-widest text-wc-muted">
                Fan Buzz
              </p>
            </div>
            {sentiment === undefined ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-3 bg-wc-border rounded w-full" />
                <div className="h-3 bg-wc-border rounded w-4/5" />
              </div>
            ) : (
              <p className="text-sm text-white leading-relaxed">{sentiment}</p>
            )}
          </div>
        )}

        {/* Lineups section */}
        <div className="bg-wc-surface border border-wc-border p-6">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-bebas text-2xl uppercase">
              {isUpcoming && !lineupsAvailable ? 'Predicted Lineups' : 'Lineups'}
            </h2>
            {lineupsAvailable && (
              <span className="bg-wc-green text-wc-black text-xs font-bold px-2 py-0.5 rounded uppercase">
                Official
              </span>
            )}
          </div>
          {isUpcoming && !lineupsAvailable && (
            <p className="text-wc-dimmed text-xs mb-5">
              Official lineups will replace these once announced
            </p>
          )}

          {/* Team toggle */}
          <div className="flex gap-2 mb-4">
            {(['home', 'away'] as const).map((side) => {
              const team = match.teams[side]
              return (
                <button
                  key={side}
                  onClick={() => setActiveTeam(side)}
                  className={`flex flex-1 sm:flex-none items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold uppercase tracking-wide border transition-all duration-150 min-w-0 ${
                    activeTeam === side
                      ? 'bg-wc-red text-white border-wc-red'
                      : 'bg-transparent text-wc-muted border-wc-border hover:border-wc-border-hover hover:text-white'
                  }`}
                >
                  <img
                    src={team.logo}
                    className="w-4 h-4 object-contain shrink-0"
                    loading="lazy"
                  />
                  <span className="truncate">{team.name}</span>
                </button>
              )
            })}
          </div>

          {/* XI View toggle — only for upcoming without official lineups */}
          {isUpcoming && !lineupsAvailable && (
            <div className="flex gap-0 mb-6 border border-wc-border w-fit">
              <button
                onClick={() => setXiView('mine')}
                className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all duration-150 ${
                  xiView === 'mine'
                    ? 'bg-wc-red text-white'
                    : 'text-wc-muted hover:text-white'
                }`}
              >
                My Prediction
              </button>
              <button
                onClick={() => setXiView('community')}
                className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all duration-150 border-l border-wc-border ${
                  xiView === 'community'
                    ? 'bg-wc-red text-white'
                    : 'text-wc-muted hover:text-white'
                }`}
              >
                Community XI
                {communityCount > 0 && (
                  <span className="ml-1.5 text-[10px] opacity-70">
                    {communityCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* UPCOMING — My Prediction */}
          {isUpcoming && !lineupsAvailable && xiView === 'mine' && (
            <div>
              <p className="text-sm font-semibold text-wc-muted mb-4">
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
                  activeTeam === 'home' ? homeUserFormation : awayUserFormation
                }
                savedXI={
                  activeTeam === 'home'
                    ? (homeUserXI ?? undefined)
                    : (awayUserXI ?? undefined)
                }
                onSave={saveXI}
              />
            </div>
          )}

          {/* UPCOMING — Community XI */}
          {isUpcoming && !lineupsAvailable && xiView === 'community' && (
            <div>
              {communityCount === 0 || !communityXI ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-wc-muted text-sm mb-1">
                    No predictions yet
                  </p>
                  <p className="text-wc-dimmed text-xs">
                    Be the first to predict the XI for this match
                  </p>
                  <button
                    onClick={() => setXiView('mine')}
                    className="mt-4 px-4 py-2 bg-wc-red text-white text-xs font-semibold uppercase tracking-wide"
                  >
                    Predict Now
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-wc-muted mb-4">
                    Based on{' '}
                    <span className="text-white font-semibold">
                      {communityCount}
                    </span>{' '}
                    fan prediction{communityCount !== 1 ? 's' : ''}
                  </p>
                  <PitchXI
                    key={`community-${activeTeam}`}
                    squad={activeSquad}
                    teamId={
                      activeTeam === 'home'
                        ? match.teams.home.id
                        : match.teams.away.id
                    }
                    userId={user?.id}
                    savedFormation={communityFormation}
                    savedXI={communityXI ?? undefined}
                    onSave={async () => {}}
                    readOnly
                  />
                </div>
              )}
            </div>
          )}

          {/* OFFICIAL LINEUPS — when released (any match status) */}
          {lineupsAvailable && activeLineup && (() => {
            const slots = mapLineupToSlots(
              activeLineup.startXI,
              activeLineup.formation,
              activeSquad
            )
            const subbedOffIds = activeLineup.startXI
              .map((e: any) => e.player.id)
              .filter((id: number) => isSubbedOff(id, activeTeamId))
            const subbedOnIds = activeLineup.substitutes
              .map((e: any) => e.player.id)
              .filter((id: number) => !!getSubOn(id, activeTeamId))

            // Build goal/assist maps from matchEvents for pitch display
            const goalMap: Record<number, any[]> = {}
            const ownGoalMap: Record<number, any[]> = {}
            const assistMap: Record<number, any[]> = {}
            matchEvents.forEach((e: any) => {
              if (e.type !== 'Goal') return
              const pid = e.player?.id
              if (pid) {
                if (e.detail === 'Own Goal') {
                  if (!ownGoalMap[pid]) ownGoalMap[pid] = []
                  ownGoalMap[pid].push(e)
                } else {
                  if (!goalMap[pid]) goalMap[pid] = []
                  goalMap[pid].push(e)
                }
              }
              const aid = e.assist?.id
              if (aid && e.detail !== 'Own Goal') {
                if (!assistMap[aid]) assistMap[aid] = []
                assistMap[aid].push(e)
              }
            })

            return (
              <div className="flex flex-col gap-6">
                <LineupPitch
                  key={`official-${activeTeam}`}
                  slots={slots}
                  formation={activeLineup.formation}
                  subbedOffIds={subbedOffIds}
                  subbedOnIds={subbedOnIds}
                  ratings={ratings}
                  goals={goalMap}
                  ownGoals={ownGoalMap}
                  assists={assistMap}
                  onPlayerClick={(player) => {
                    const subOff = getSubOff(player.id, activeTeamId)
                    const subOn = getSubOn(player.id, activeTeamId)
                    setSelectedPlayer({
                      ...player,
                      subOff: subOff || null,
                      subOn: subOn || null
                    })
                    setShowPlayerModal(true)
                  }}
                />

                {/* Substitutes bench */}
                <div>
                  <p className="text-[11px] font-semibold text-wc-dimmed uppercase tracking-widest mb-2 pb-2 border-b border-wc-border">
                    Substitutes
                  </p>
                  <div>
                    {activeLineup.substitutes.map((s: any) => {
                      const subOnEvent = getSubOn(s.player.id, activeTeamId)
                      const photo = resolvePhoto(s.player.id, activeTeam)
                      return (
                        <div
                          key={s.player.id}
                          className="flex items-center gap-3 px-3 py-2.5 border-b border-wc-border/50 hover:bg-wc-surface-2 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedPlayer({
                              ...s.player,
                              photo,
                              subOn: subOnEvent || null,
                              subOff: null
                            })
                            setShowPlayerModal(true)
                          }}
                        >
                          <span className="text-wc-dimmed text-xs font-bold w-5 text-center shrink-0">
                            {s.player.number ?? '—'}
                          </span>
                          <img
                            src={photo}
                            className="w-8 h-8 rounded-full object-cover bg-wc-border shrink-0"
                            loading="lazy"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).style.display =
                                'none'
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {s.player.name}
                            </p>
                            <p className="text-wc-muted text-xs">
                              {s.player.pos}
                            </p>
                          </div>
                          {subOnEvent && (
                            <span className="text-wc-green text-xs font-bold shrink-0">
                              ↕ {subOnEvent.time.elapsed}&apos;
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* LIVE / FINISHED — squad list with ratings (no official lineups) */}
          {isStarted && !lineupsAvailable &&
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
                        <p className="text-[11px] font-semibold text-wc-dimmed uppercase tracking-widest mb-2 pb-2 border-b border-wc-border">
                          {label}
                        </p>
                        <div>
                          {players.map((player: any) => (
                            <div
                              key={player.id}
                              className="flex items-center gap-3 px-3 py-2.5 border-b border-wc-border/50 hover:bg-wc-surface-2 transition-colors"
                            >
                              <span className="text-wc-dimmed text-xs font-bold w-5 text-center shrink-0">
                                {player.number ?? '—'}
                              </span>
                              <img
                                src={player.photo}
                                className="w-8 h-8 rounded-full object-cover bg-wc-border shrink-0"
                                loading="lazy"
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
                                <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold shrink-0">
                                  <Star className="w-3 h-3 fill-yellow-400" />
                                  {avgRatings[player.id]}
                                </span>
                              )}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <input
                                  type="number"
                                  min={1}
                                  max={10}
                                  value={ratings[player.id] || ''}
                                  onChange={(e) => {
                                    const val = Number(e.target.value)
                                    if (val >= 1 && val <= 10)
                                      ratePlayer(player, teamId, val, user)
                                  }}
                                  className="w-12 bg-wc-border/30 border border-wc-border text-center text-sm text-white focus:border-wc-red focus:outline-none transition-colors"
                                  placeholder="1-10"
                                />
                                {ratings[player.id] && (
                                  <button
                                    onClick={() => clearRating(player.id, user)}
                                    className="text-wc-muted hover:text-wc-red transition-colors"
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

      {/* Player modal */}
      {showPlayerModal && selectedPlayer && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPlayerModal(false)}
        >
          <div
            className="bg-wc-surface border border-wc-border rounded-xl p-6 w-full max-w-sm relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPlayerModal(false)}
              className="absolute top-4 right-4 text-wc-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              {/* Player info */}
              <div className="flex items-center gap-4">
                <img
                  src={selectedPlayer.photo}
                  className="w-16 h-16 rounded-full object-cover bg-wc-border shrink-0"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      `https://media.api-sports.io/football/players/${selectedPlayer.id}.png`
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bebas text-2xl leading-tight">
                    {selectedPlayer.name}
                  </p>
                  <p className="text-wc-muted text-sm">
                    #{selectedPlayer.number} · {selectedPlayer.pos}
                  </p>
                  {getPlayerGoals(selectedPlayer.id).map((g: any, i: number) => (
                    <p key={`g${i}`} className="text-white text-xs mt-1">
                      ⚽ {g.time.elapsed}&apos;
                      {g.detail === 'Penalty' && (
                        <span className="text-wc-muted"> (P)</span>
                      )}
                    </p>
                  ))}
                  {getPlayerOwnGoals(selectedPlayer.id).map(
                    (g: any, i: number) => (
                      <p key={`og${i}`} className="text-wc-red text-xs mt-1">
                        ⚽ OG {g.time.elapsed}&apos;
                      </p>
                    )
                  )}
                  {getPlayerAssists(selectedPlayer.id).map(
                    (a: any, i: number) => (
                      <p key={`a${i}`} className="text-wc-muted text-xs mt-1">
                        A {a.time.elapsed}&apos;
                      </p>
                    )
                  )}
                </div>
              </div>

              {/* Substitution row with replacement player photo */}
              {selectedPlayer.subOff && (
                <div className="flex items-center gap-3 mt-3 p-3 rounded-lg bg-black/25 border border-wc-border/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-wc-red text-[10px] font-bold uppercase tracking-widest">
                      Substituted Off
                    </p>
                    <p className="text-white text-sm mt-0.5">
                      {selectedPlayer.subOff.player.name}{' '}
                      <span className="text-wc-muted">
                        {selectedPlayer.subOff.time.elapsed}&apos;
                      </span>
                    </p>
                  </div>
                  <img
                    src={resolvePhoto(
                      selectedPlayer.subOff.player.id,
                      activeTeam
                    )}
                    className="w-12 h-12 rounded-full object-cover bg-wc-border shrink-0"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src =
                        `https://media.api-sports.io/football/players/${selectedPlayer.subOff.player.id}.png`
                    }}
                  />
                </div>
              )}
              {selectedPlayer.subOn && (
                <div className="flex items-center gap-3 mt-3 p-3 rounded-lg bg-black/25 border border-wc-border/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-wc-green text-[10px] font-bold uppercase tracking-widest">
                      Came On
                    </p>
                    <p className="text-white text-sm mt-0.5">
                      for {selectedPlayer.subOn.assist?.name}{' '}
                      <span className="text-wc-muted">
                        {selectedPlayer.subOn.time.elapsed}&apos;
                      </span>
                    </p>
                  </div>
                  {selectedPlayer.subOn.assist?.id && (
                    <img
                      src={resolvePhoto(
                        selectedPlayer.subOn.assist.id,
                        activeTeam
                      )}
                      className="w-12 h-12 rounded-full object-cover bg-wc-border shrink-0"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src =
                          `https://media.api-sports.io/football/players/${selectedPlayer.subOn.assist.id}.png`
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-wc-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-wc-muted mb-3">
                Your Rating
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={ratings[selectedPlayer.id] || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    if (val >= 1 && val <= 10) {
                      ratePlayer(selectedPlayer, activeTeamId, val, user)
                    }
                  }}
                  className="w-16 bg-wc-border/30 border border-wc-border text-center text-lg text-white focus:border-wc-red focus:outline-none transition-colors"
                  placeholder="1-10"
                />
                {ratings[selectedPlayer.id] && (
                  <span className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
                    <Star className="w-4 h-4 fill-yellow-400" />
                    {ratings[selectedPlayer.id]}
                  </span>
                )}
                {avgRatings[selectedPlayer.id] && (
                  <span className="text-wc-muted text-xs">
                    Community: {avgRatings[selectedPlayer.id]}
                  </span>
                )}
                {ratings[selectedPlayer.id] && (
                  <button
                    onClick={() => clearRating(selectedPlayer.id, user)}
                    className="text-wc-muted hover:text-wc-red transition-colors ml-auto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
