'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

type ViewMode = 'date' | 'round' | 'group' | 'team'

export default function Fixtures() {
  const [matches, setMatches] = useState<any[]>([])
  const [standingsByGroup, setStandingsByGroup] = useState<
    Record<string, any[]>
  >({})
  const [view, setView] = useState<ViewMode>('date')
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [teamSearch, setTeamSearch] = useState<string>('')
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
      setStandingsByGroup(data.standingsByGroup || {})
      setLoading(false)
    }
    init()
  }, [])

  // All unique teams
  const allTeams = Array.from(
    new Map(
      matches.flatMap((m) => [
        [m.teams.home.id, m.teams.home],
        [m.teams.away.id, m.teams.away]
      ])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name))

  const filteredTeams = allTeams.filter((t) =>
    t.name.toLowerCase().includes(teamSearch.toLowerCase())
  )

  function formatDateHeader(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const sorted = [...matches].sort(
    (a, b) =>
      new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
  )

  // By date
  const byDate: Record<string, any[]> = {}
  sorted.forEach((match) => {
    const key = new Date(match.fixture.date).toLocaleDateString('en-CA')
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(match)
  })

  // By round → group
  const byRoundGroup: Record<string, Record<string, any[]>> = {}
  matches
    .filter((m) => m.group)
    .forEach((match) => {
      const round = match.league.round
      const group = match.group
      if (!byRoundGroup[round]) byRoundGroup[round] = {}
      if (!byRoundGroup[round][group]) byRoundGroup[round][group] = []
      byRoundGroup[round][group].push(match)
    })

  // By team
  const teamMatches = selectedTeam
    ? sorted.filter(
        (m) =>
          m.teams.home.id === Number(selectedTeam) ||
          m.teams.away.id === Number(selectedTeam)
      )
    : []

  const roundLabels: Record<string, string> = {
    'Group Stage - 1': 'Round 1',
    'Group Stage - 2': 'Round 2',
    'Group Stage - 3': 'Round 3'
  }

  const MatchRow = ({ match }: { match: any }) => {
    const isLive = ['1H', '2H', 'HT', 'ET', 'P'].includes(
      match.fixture.status.short
    )
    const isFinished = match.fixture.status.short === 'FT'

    return (
      <Link href={`/match/${match.fixture.id}`}>
        <div className="flex items-center justify-center gap-3 py-3 px-6 hover:bg-white/5 transition-colors border-b border-gray-800/40 last:border-0 cursor-pointer">
          {/* Home */}
          <div className="flex items-center justify-end gap-2 flex-1">
            <span
              className={`text-sm text-right ${match.teams.home.winner ? 'font-bold text-white' : 'text-gray-300'}`}
            >
              {match.teams.home.name}
            </span>
            <img
              src={match.teams.home.logo}
              className="w-6 h-6 object-contain rounded-full flex-shrink-0"
            />
          </div>

          {/* Center */}
          <div className="w-24 flex flex-col items-center flex-shrink-0">
            {isLive ? (
              <span className="text-xs font-bold text-green-400 animate-pulse">
                {match.fixture.status.elapsed}'
              </span>
            ) : isFinished ? (
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-sm font-bold ${match.teams.home.winner ? 'text-white' : 'text-gray-400'}`}
                >
                  {match.goals.home}
                </span>
                <span className="text-gray-600 text-xs">-</span>
                <span
                  className={`text-sm font-bold ${match.teams.away.winner ? 'text-white' : 'text-gray-400'}`}
                >
                  {match.goals.away}
                </span>
              </div>
            ) : (
              <span className="text-xs font-semibold text-gray-400">
                {formatTime(match.fixture.date)}
              </span>
            )}
            {isFinished && (
              <span className="text-gray-600 text-[10px] mt-0.5">FT</span>
            )}
          </div>

          {/* Away */}
          <div className="flex items-center justify-start gap-2 flex-1">
            <img
              src={match.teams.away.logo}
              className="w-6 h-6 object-contain rounded-full flex-shrink-0"
            />
            <span
              className={`text-sm ${match.teams.away.winner ? 'font-bold text-white' : 'text-gray-300'}`}
            >
              {match.teams.away.name}
            </span>
          </div>
        </div>
      </Link>
    )
  }

  if (loading)
    return (
      <main className="min-h-screen bg-[#06090f] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading fixtures...</p>
        </div>
      </main>
    )

  return (
    <main className="min-h-screen bg-[#06090f] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-green-400/60 text-xs font-semibold uppercase tracking-widest mb-1">
            FIFA World Cup 2026
          </p>
          <h1 className="text-3xl font-black">Fixtures</h1>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {(['date', 'round', 'group', 'team'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                view === v
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-gray-400 border-gray-700 hover:text-white hover:border-gray-500'
              }`}
            >
              By {v}
            </button>
          ))}
        </div>

        {/* BY DATE */}
        {view === 'date' && (
          <div>
            {Object.entries(byDate).map(([dateKey, dayMatches]) => (
              <div key={dateKey} className="mb-1">
                <div className="bg-gray-900 px-4 py-2.5 rounded-t-lg">
                  <h2 className="text-sm font-semibold text-white">
                    {formatDateHeader(dateKey)}
                  </h2>
                </div>
                <div className="bg-gray-900/30 rounded-b-lg mb-3 overflow-hidden">
                  {dayMatches.map((m) => (
                    <MatchRow key={m.fixture.id} match={m} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BY ROUND */}
        {view === 'round' && (
          <div>
            {Object.entries(byRoundGroup)
              .sort()
              .map(([round, groups]) => (
                <div key={round} className="mb-8">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest pb-2 mb-3 border-b border-gray-800">
                    {roundLabels[round] || round}
                  </h2>
                  {Object.entries(groups)
                    .sort()
                    .map(([group, groupMatches]) => (
                      <div key={group} className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-400 py-1.5 px-1">
                          {group}
                        </h3>
                        <div className="bg-gray-900/30 rounded-lg overflow-hidden">
                          {[...groupMatches]
                            .sort(
                              (a, b) =>
                                new Date(a.fixture.date).getTime() -
                                new Date(b.fixture.date).getTime()
                            )
                            .map((m) => (
                              <MatchRow key={m.fixture.id} match={m} />
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              ))}
          </div>
        )}

        {/* BY GROUP */}
        {view === 'group' && (
          <div>
            {Object.entries(standingsByGroup)
              .sort()
              .map(([group, standings]) => (
                <div key={group} className="mb-8">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest pb-2 mb-3 border-b border-gray-800">
                    {group}
                  </h2>

                  {/* Standings table */}
                  <table className="w-full text-xs mb-4">
                    <thead>
                      <tr className="text-gray-600 border-b border-gray-800/60">
                        <th className="text-left py-1.5 px-1 font-medium">
                          Team
                        </th>
                        <th className="text-center py-1.5 px-2 font-medium">
                          P
                        </th>
                        <th className="text-center py-1.5 px-2 font-medium">
                          W
                        </th>
                        <th className="text-center py-1.5 px-2 font-medium">
                          D
                        </th>
                        <th className="text-center py-1.5 px-2 font-medium">
                          L
                        </th>
                        <th className="text-center py-1.5 px-2 font-medium">
                          GD
                        </th>
                        <th className="text-center py-1.5 px-2 font-medium text-yellow-500/70">
                          Pts
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((entry: any, i: number) => (
                        <tr
                          key={entry.team.id}
                          className={`border-b border-gray-800/30 ${i < 2 ? 'text-white' : 'text-gray-400'}`}
                        >
                          <td className="py-2 px-1 flex items-center gap-2">
                            <span className="text-gray-600 w-3">
                              {entry.rank}
                            </span>
                            <img
                              src={entry.team.logo}
                              className="w-4 h-4 object-contain"
                            />
                            <span>{entry.team.name}</span>
                          </td>
                          <td className="text-center py-2 px-2">
                            {entry.all.played}
                          </td>
                          <td className="text-center py-2 px-2">
                            {entry.all.win}
                          </td>
                          <td className="text-center py-2 px-2">
                            {entry.all.draw}
                          </td>
                          <td className="text-center py-2 px-2">
                            {entry.all.lose}
                          </td>
                          <td className="text-center py-2 px-2">
                            {entry.goalsDiff}
                          </td>
                          <td className="text-center py-2 px-2 font-bold text-yellow-500">
                            {entry.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Fixtures for this group */}
                  <div className="bg-gray-900/30 rounded-lg overflow-hidden">
                    {[...matches.filter((m) => m.group === group)]
                      .sort(
                        (a, b) =>
                          new Date(a.fixture.date).getTime() -
                          new Date(b.fixture.date).getTime()
                      )
                      .map((m) => (
                        <MatchRow key={m.fixture.id} match={m} />
                      ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* BY TEAM */}
        {view === 'team' && (
          <div>
            {/* Search input */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search team..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
              />
            </div>

            {/* Team list when searching */}
            {teamSearch && !selectedTeam && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden mb-4">
                {filteredTeams.slice(0, 8).map((team) => (
                  <button
                    key={team.id}
                    onClick={() => {
                      setSelectedTeam(String(team.id))
                      setTeamSearch(team.name)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 transition-colors border-b border-gray-800/50 last:border-0 text-left"
                  >
                    <img src={team.logo} className="w-5 h-5 object-contain" />
                    <span className="text-sm text-gray-200">{team.name}</span>
                  </button>
                ))}
                {filteredTeams.length === 0 && (
                  <p className="text-gray-500 text-sm px-4 py-3">
                    No teams found
                  </p>
                )}
              </div>
            )}

            {/* Selected team fixtures */}
            {selectedTeam && teamMatches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <img
                      src={
                        allTeams.find((t) => t.id === Number(selectedTeam))
                          ?.logo
                      }
                      className="w-8 h-8 object-contain"
                    />
                    <span className="font-bold">{teamSearch}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTeam('')
                      setTeamSearch('')
                    }}
                    className="text-xs text-gray-500 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="bg-gray-900/30 rounded-lg overflow-hidden">
                  {teamMatches.map((m) => (
                    <MatchRow key={m.fixture.id} match={m} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!selectedTeam && !teamSearch && (
              <p className="text-gray-500 text-sm text-center py-8">
                Search for a team to see their fixtures
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
