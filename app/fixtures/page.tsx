'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
export default function Fixtures() {
  const [matches, setMatches] = useState<any[]>([])
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
      setLoading(false)
    }
    init()
  }, [])

  const groupStageMatches = matches.filter((m) => m.stage === 'GROUP_STAGE')

  const teamsByGroup: Record<string, Map<number, any>> = {}
  const fixturesByGroup: Record<string, any[]> = {}

  groupStageMatches.forEach((match) => {
    const group = match.group?.replace('GROUP_', 'Group ') || 'Unknown'
    if (!teamsByGroup[group]) teamsByGroup[group] = new Map()
    if (!fixturesByGroup[group]) fixturesByGroup[group] = []
    if (match.homeTeam.id)
      teamsByGroup[group].set(match.homeTeam.id, match.homeTeam)
    if (match.awayTeam.id)
      teamsByGroup[group].set(match.awayTeam.id, match.awayTeam)
    fixturesByGroup[group].push(match)
  })

  const knockoutMatches = matches.filter((m) => m.stage !== 'GROUP_STAGE')
  const knockoutByStage: Record<string, any[]> = {}
  knockoutMatches.forEach((match) => {
    if (!knockoutByStage[match.stage]) knockoutByStage[match.stage] = []
    knockoutByStage[match.stage].push(match)
  })

  const stageOrder = [
    'LAST_32',
    'LAST_16',
    'QUARTER_FINALS',
    'SEMI_FINALS',
    'THIRD_PLACE',
    'FINAL'
  ]

  function formatStage(stage: string) {
    return stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
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
    <main className="min-h-screen bg-[#06090f] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <p className="text-green-400/60 text-xs font-semibold uppercase tracking-widest mb-2">
            FIFA World Cup 2026
          </p>
          <h1 className="text-4xl font-black">Fixtures</h1>
        </div>

        {/* Group Stage */}
        <div className="flex items-center gap-3 mb-6">
          <span className="w-1 h-7 bg-gradient-to-b from-green-500 to-yellow-500 rounded-full inline-block" />
          <h2 className="text-2xl font-bold text-white">Group Stage</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
          {Object.entries(teamsByGroup)
            .sort()
            .map(([group, teamsMap]) => (
              <div
                key={group}
                className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors duration-200"
              >
                <div className="bg-gradient-to-r from-green-900/40 to-gray-800/60 px-4 py-3 border-b border-gray-800">
                  <h3 className="font-bold text-base text-white">{group}</h3>
                </div>

                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-800/80">
                      <th className="text-left px-4 py-2 font-medium">Team</th>
                      <th className="px-2 py-2 font-medium">P</th>
                      <th className="px-2 py-2 font-medium">W</th>
                      <th className="px-2 py-2 font-medium">D</th>
                      <th className="px-2 py-2 font-medium">L</th>
                      <th className="px-2 py-2 font-medium text-yellow-500/70">
                        Pts
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(teamsMap.values()).map((team: any) => (
                      <tr
                        key={team.id}
                        className="border-b border-gray-800/60 hover:bg-gray-800/40 transition-colors"
                      >
                        <td className="px-4 py-2 flex items-center gap-2">
                          <img
                            src={team.crest}
                            className="w-5 h-5 object-contain flex-shrink-0"
                          />
                          <span className="text-gray-200">
                            {team.shortName}
                          </span>
                        </td>
                        <td className="text-center px-2 py-2 text-gray-500">
                          0
                        </td>
                        <td className="text-center px-2 py-2 text-gray-500">
                          0
                        </td>
                        <td className="text-center px-2 py-2 text-gray-500">
                          0
                        </td>
                        <td className="text-center px-2 py-2 text-gray-500">
                          0
                        </td>
                        <td className="text-center px-2 py-2 font-bold text-yellow-500">
                          0
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="px-4 py-3 border-t border-gray-800">
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-widest">
                    Fixtures
                  </p>
                  {fixturesByGroup[group]?.map((match: any) => (
                    <Link href={`/match/${match.id}`} key={match.id}>
                      <div
                        className="flex items-center justify-between py-1.5 text-sm border-b border-gray-800/40 last:border-0"
                      >
                        <div className="flex items-center gap-1 w-2/5 justify-end">
                          <span className="text-right text-xs text-gray-300">
                            {match.homeTeam.shortName}
                          </span>
                          <img
                            src={match.homeTeam.crest}
                            className="w-4 h-4 object-contain"
                          />
                        </div>
                        <div className="flex flex-col items-center w-1/5">
                          <span
                            className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                              match.score.fullTime.home !== null
                                ? 'text-green-400 bg-green-950/60'
                                : 'text-gray-500'
                            }`}
                          >
                            {match.score.fullTime.home !== null
                              ? `${match.score.fullTime.home}-${match.score.fullTime.away}`
                              : 'vs'}
                          </span>
                          <span className="text-gray-600 text-xs">
                            {new Date(match.utcDate).toLocaleDateString(
                              'en-GB',
                              {
                                day: 'numeric',
                                month: 'short'
                              }
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 w-2/5">
                          <img
                            src={match.awayTeam.crest}
                            className="w-4 h-4 object-contain"
                          />
                          <span className="text-xs text-gray-300">
                            {match.awayTeam.shortName}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
        </div>

        {/* Knockout Stage */}
        <div className="flex items-center gap-3 mb-6">
          <span className="w-1 h-7 bg-gradient-to-b from-yellow-500 to-amber-600 rounded-full inline-block" />
          <h2 className="text-2xl font-bold text-white">Knockout Stage</h2>
        </div>

        {stageOrder
          .filter((s) => knockoutByStage[s])
          .map((stage) => (
            <div key={stage} className="mb-8">
              <h3 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-widest">
                {formatStage(stage)}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {knockoutByStage[stage].map((match: any) => (
                  <Link href={`/match/${match.id}`} key={match.id}>
                    <div
                      
                      className="bg-gray-900/50 hover:bg-gray-800/60 border border-gray-800 hover:border-gray-700 rounded-xl p-4 flex items-center justify-between transition-all duration-200"
                    >
                      <div className="flex items-center gap-2 w-2/5 justify-end">
                        {match.homeTeam.crest && (
                          <img
                            src={match.homeTeam.crest}
                            className="w-6 h-6 object-contain"
                          />
                        )}
                        <span className="text-sm font-semibold text-right">
                          {match.homeTeam.shortName || 'TBD'}
                        </span>
                      </div>
                      <div className="flex flex-col items-center w-1/5">
                        <span className="text-gray-600 text-xs font-bold bg-gray-800 px-2 py-0.5 rounded-full">
                          vs
                        </span>
                        <span className="text-gray-500 text-xs mt-1">
                          {new Date(match.utcDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 w-2/5">
                        <span className="text-sm font-semibold">
                          {match.awayTeam.shortName || 'TBD'}
                        </span>
                        {match.awayTeam.crest && (
                          <img
                            src={match.awayTeam.crest}
                            className="w-6 h-6 object-contain"
                          />
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
      </div>
    </main>
  )
}
