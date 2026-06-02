'use client'

import { memo, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useMatchStore } from '@/lib/stores/matchStore'

type ViewMode = 'date' | 'round' | 'group' | 'team'

const MatchRow = memo(function MatchRow({ match }: { match: any }) {
  const isLive = ['1H', '2H', 'HT', 'ET', 'P'].includes(match.fixture.status.short)
  const isFinished = match.fixture.status.short === 'FT'

  return (
    <Link href={`/match/${match.fixture.id}`}>
      <div className="flex items-center h-13 px-4 border-b border-wc-border hover:bg-wc-surface-2 transition-colors cursor-pointer">
        {/* Home */}
        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
          <span
            className={`text-sm text-right truncate ${
              match.teams.home.winner ? 'text-white font-semibold' : 'text-wc-muted'
            }`}
          >
            {match.teams.home.name}
          </span>
          <img
            src={match.teams.home.logo}
            className="w-5 h-5 object-contain shrink-0"
            loading="lazy"
          />
        </div>

        {/* Center */}
        <div className="w-24 flex flex-col items-center shrink-0 gap-0.5">
          {isLive ? (
            <>
              <span className="flex items-center gap-1.5 bg-wc-neon text-wc-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-wc-black rounded-full live-dot" />
                LIVE
              </span>
              {match.fixture.status.elapsed && (
                <span className="text-wc-neon text-[10px] font-semibold">
                  {match.fixture.status.elapsed}&apos;
                </span>
              )}
            </>
          ) : isFinished ? (
            <>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-bold text-sm ${
                    match.teams.home.winner ? 'text-white' : 'text-wc-muted'
                  }`}
                >
                  {match.goals.home}
                </span>
                <span className="text-wc-border text-xs">â€“</span>
                <span
                  className={`font-bold text-sm ${
                    match.teams.away.winner ? 'text-white' : 'text-wc-muted'
                  }`}
                >
                  {match.goals.away}
                </span>
              </div>
              <span className="bg-wc-border text-wc-muted text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                FT
              </span>
            </>
          ) : (
            <span className="text-xs font-semibold text-wc-muted">
              {new Date(match.fixture.date).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          )}
        </div>

        {/* Away */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <img
            src={match.teams.away.logo}
            className="w-5 h-5 object-contain shrink-0"
            loading="lazy"
          />
          <span
            className={`text-sm truncate ${
              match.teams.away.winner ? 'text-white font-semibold' : 'text-wc-muted'
            }`}
          >
            {match.teams.away.name}
          </span>
        </div>
      </div>
    </Link>
  )
})

function FixturesSkeleton() {
  return (
    <main className="min-h-screen bg-wc-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="h-3 w-32 bg-wc-surface rounded animate-pulse mb-2" />
          <div className="h-9 w-44 bg-wc-surface rounded animate-pulse" />
        </div>
        <div className="flex gap-2 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 w-20 bg-wc-surface rounded animate-pulse" />
          ))}
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="mb-4">
            <div className="h-9 bg-wc-surface animate-pulse" />
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex items-center h-13 px-4 border-b border-wc-border gap-4">
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <div className="h-3 w-24 bg-wc-surface rounded animate-pulse" />
                  <div className="w-5 h-5 bg-wc-surface rounded animate-pulse shrink-0" />
                </div>
                <div className="w-24 h-4 bg-wc-surface rounded animate-pulse shrink-0" />
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-5 h-5 bg-wc-surface rounded animate-pulse shrink-0" />
                  <div className="h-3 w-24 bg-wc-surface rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  )
}

export default function Fixtures() {
  const { fixtures: matches, standingsByGroup, loaded, load } = useMatchStore()
  const [view, setView] = useState<ViewMode>('date')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [teamSearch, setTeamSearch] = useState('')
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
      setLoading(false)
    }
    init()
  }, [])

  const allTeams = useMemo(
    () =>
      Array.from(
        new Map(
          matches.flatMap((m) => [
            [m.teams.home.id, m.teams.home],
            [m.teams.away.id, m.teams.away],
          ])
        ).values()
      ).sort((a, b) => a.name.localeCompare(b.name)),
    [matches]
  )

  const filteredTeams = allTeams.filter((t) =>
    t.name.toLowerCase().includes(teamSearch.toLowerCase())
  )

  function formatDateHeader(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  const sorted = useMemo(
    () =>
      [...matches].sort(
        (a, b) =>
          new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
      ),
    [matches]
  )

  const byDate = useMemo(() => {
    const result: Record<string, any[]> = {}
    sorted.forEach((match) => {
      const key = new Date(match.fixture.date).toLocaleDateString('en-CA')
      if (!result[key]) result[key] = []
      result[key].push(match)
    })
    return result
  }, [sorted])

  const byRoundGroup = useMemo(() => {
    const result: Record<string, Record<string, any[]>> = {}
    matches
      .filter((m) => m.group)
      .forEach((match) => {
        const round = match.league.round
        const group = match.group
        if (!result[round]) result[round] = {}
        if (!result[round][group]) result[round][group] = []
        result[round][group].push(match)
      })
    return result
  }, [matches])

  const teamMatches = useMemo(
    () =>
      selectedTeam
        ? sorted.filter(
            (m) =>
              m.teams.home.id === Number(selectedTeam) ||
              m.teams.away.id === Number(selectedTeam)
          )
        : [],
    [selectedTeam, sorted]
  )

  const roundLabels: Record<string, string> = {
    'Group Stage - 1': 'Round 1',
    'Group Stage - 2': 'Round 2',
    'Group Stage - 3': 'Round 3',
  }

  if (loading) return <FixturesSkeleton />

  return (
    <main className="min-h-screen bg-wc-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <p className="text-wc-dimmed text-xs font-semibold uppercase tracking-widest mb-1">
            FIFA World Cup 2026
          </p>
          <h1 className="font-bebas text-5xl uppercase">Fixtures</h1>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {(['date', 'round', 'group', 'team'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded text-sm font-semibold uppercase tracking-wide transition-all duration-150 border ${
                view === v
                  ? 'bg-wc-red text-white border-wc-red'
                  : 'bg-transparent text-wc-muted border-wc-border hover:text-white hover:border-wc-border-hover'
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
              <div key={dateKey} className="mb-4">
                <div className="bg-wc-surface px-4 py-2.5 border-b border-wc-border">
                  <h2 className="text-[13px] font-semibold text-white">
                    {formatDateHeader(dateKey)}
                  </h2>
                </div>
                <div>
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
                  <h2 className="font-bebas text-2xl uppercase text-white pb-2 mb-3 border-b border-wc-border">
                    {roundLabels[round] || round}
                  </h2>
                  {Object.entries(groups)
                    .sort()
                    .map(([group, groupMatches]) => (
                      <div key={group} className="mb-4">
                        <div className="px-4 py-2 bg-wc-surface border-b border-wc-border">
                          <span className="text-[11px] font-semibold text-wc-dimmed uppercase tracking-widest">
                            {group}
                          </span>
                        </div>
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
                  <h2 className="font-bebas text-2xl uppercase text-white pb-2 mb-3 border-b border-wc-border">
                    {group}
                  </h2>

                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-xs min-w-[380px]">
                    <thead>
                      <tr className="text-wc-muted border-b border-wc-border">
                        <th className="text-left py-1.5 px-1 font-medium">Team</th>
                        <th className="text-center py-1.5 px-2 font-medium">P</th>
                        <th className="text-center py-1.5 px-2 font-medium">W</th>
                        <th className="text-center py-1.5 px-2 font-medium">D</th>
                        <th className="text-center py-1.5 px-2 font-medium">L</th>
                        <th className="text-center py-1.5 px-2 font-medium">GD</th>
                        <th className="text-center py-1.5 px-2 font-medium text-wc-red">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((entry: any, i: number) => (
                        <tr
                          key={entry.team.id}
                          className={`border-b border-wc-border/30 ${i < 2 ? 'text-white' : 'text-wc-muted'}`}
                        >
                          <td className="py-2 px-1 flex items-center gap-2">
                            <span className="text-wc-border w-3">{entry.rank}</span>
                            <img
                              src={entry.team.logo}
                              className="w-4 h-4 object-contain"
                              loading="lazy"
                            />
                            <span>{entry.team.name}</span>
                          </td>
                          <td className="text-center py-2 px-2">{entry.all.played}</td>
                          <td className="text-center py-2 px-2">{entry.all.win}</td>
                          <td className="text-center py-2 px-2">{entry.all.draw}</td>
                          <td className="text-center py-2 px-2">{entry.all.lose}</td>
                          <td className="text-center py-2 px-2">{entry.goalsDiff}</td>
                          <td className="text-center py-2 px-2 font-bold text-wc-red">
                            {entry.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  </div>

                  <div>
                    {[...matches.filter((m) => m.group === group)]
                      .sort(
                        (a, b) =>
                          new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
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
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search team..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="w-full bg-wc-surface border border-wc-border px-4 py-2.5 text-sm text-white placeholder-wc-muted focus:outline-none focus:border-wc-red transition-colors"
              />
            </div>

            {teamSearch && !selectedTeam && (
              <div className="bg-wc-surface border border-wc-border overflow-hidden mb-4">
                {filteredTeams.slice(0, 8).map((team) => (
                  <button
                    key={team.id}
                    onClick={() => {
                      setSelectedTeam(String(team.id))
                      setTeamSearch(team.name)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-wc-surface-2 transition-colors border-b border-wc-border last:border-0 text-left"
                  >
                    <img src={team.logo} className="w-5 h-5 object-contain" loading="lazy" />
                    <span className="text-sm text-white">{team.name}</span>
                  </button>
                ))}
                {filteredTeams.length === 0 && (
                  <p className="text-wc-muted text-sm px-4 py-3">No teams found</p>
                )}
              </div>
            )}

            {selectedTeam && teamMatches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <img
                      src={allTeams.find((t) => t.id === Number(selectedTeam))?.logo}
                      className="w-8 h-8 object-contain"
                      loading="lazy"
                    />
                    <span className="font-bebas text-xl">{teamSearch}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTeam('')
                      setTeamSearch('')
                    }}
                    className="text-xs text-wc-muted hover:text-white transition-colors border border-wc-border px-3 py-1"
                  >
                    Clear
                  </button>
                </div>
                <div>
                  {teamMatches.map((m) => (
                    <MatchRow key={m.fixture.id} match={m} />
                  ))}
                </div>
              </div>
            )}

            {!selectedTeam && !teamSearch && (
              <p className="text-wc-muted text-sm text-center py-8">
                Search for a team to see their fixtures
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

