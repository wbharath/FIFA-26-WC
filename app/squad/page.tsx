'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import PitchXI from '../components/PitchXI'

interface Player {
  id: number
  name: string
  position: string
  number: number | null
  photo: string
  age: number
}

interface Team {
  team: {
    id: number
    name: string
    logo: string
    country: string
  }
}

export default function Squad() {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [squad, setSquad] = useState<Player[]>([])
  const [teamInfo, setTeamInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [squadLoading, setSquadLoading] = useState(false)
  const [userId, setUserId] = useState<string>('')
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
      setUserId(user.id)

      const res = await fetch('/api/teams')
      const data = await res.json()
      setTeams(data || [])

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('favourite_team_id')
        .eq('id', user.id)
        .single()

      if (profile?.favourite_team_id) {
        setSelectedTeamId(profile.favourite_team_id)
        await loadSquad(profile.favourite_team_id)
      }
      setLoading(false)
    }
    init()
  }, [])

  async function loadSquad(teamId: number) {
    setSquadLoading(true)
    const res = await fetch(`/api/teams/${teamId}`)
    const data = await res.json()
    setTeamInfo(data)
    setSquad(data?.players || [])
    setSquadLoading(false)
  }

  async function handleTeamChange(teamId: number) {
    setSelectedTeamId(teamId)
    await loadSquad(teamId)
  }

  const positionGroups: Record<string, Player[]> = {
    Goalkeepers: squad.filter((p) => p.position === 'Goalkeeper'),
    Defenders: squad.filter((p) => p.position === 'Defender'),
    Midfielders: squad.filter((p) => p.position === 'Midfielder'),
    Forwards: squad.filter((p) => p.position === 'Attacker')
  }

  async function saveXI(formation: string, players: any) {
    await supabase
      .from('predicted_xi')
      .upsert(
        { user_id: userId, team_id: selectedTeamId, formation, players },
        { onConflict: 'user_id,team_id' }
      )
    alert('XI Saved!')
  }

  if (loading)
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    )

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Squad Explorer</h1>

        <select
          value={selectedTeamId || ''}
          onChange={(e) => handleTeamChange(Number(e.target.value))}
          className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 mb-8 w-full md:w-auto"
        >
          <option value="">Select a team</option>
          {[...teams]
            .sort((a, b) => a.team.name.localeCompare(b.team.name))
            .map((t) => (
              <option key={t.team.id} value={t.team.id}>
                {t.team.name}
              </option>
            ))}
        </select>

        {teamInfo && (
          <div className="flex items-center gap-4 mb-8">
            <img
              src={teamInfo.team.logo}
              className="w-16 h-16 object-contain"
            />
            <div>
              <h2 className="text-2xl font-bold">{teamInfo.team.name}</h2>
              <p className="text-gray-400">{teamInfo.team.country}</p>
            </div>
          </div>
        )}

        {squadLoading ? (
          <p className="text-gray-400">Loading squad...</p>
        ) : (
          <div className="flex flex-col gap-8">
            {Object.entries(positionGroups).map(
              ([position, players]) =>
                players.length > 0 && (
                  <div key={position}>
                    <h3 className="text-lg font-bold text-green-400 mb-3">
                      {position}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {players.map((player) => (
                        <div
                          key={player.id}
                          className="bg-gray-900 rounded-xl p-4 flex items-center gap-3"
                        >
                          <img
                            src={player.photo}
                            alt={player.name}
                            className="w-10 h-10 rounded-full object-cover bg-gray-700 flex-shrink-0"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).style.display =
                                'none'
                            }}
                          />
                          <div>
                            <p className="font-semibold">{player.name}</p>
                            <p className="text-gray-400 text-xs">
                              {player.position}
                              {player.number ? ` · #${player.number}` : ''}
                            </p>
                            <p className="text-gray-500 text-xs">
                              Age {player.age}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
            )}
          </div>
        )}

        {squad.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4 text-green-400">
              Your Predicted XI
            </h3>
            <PitchXI
              squad={squad}
              teamId={selectedTeamId!}
              userId={userId}
              onSave={saveXI}
            />
          </div>
        )}
      </div>
    </main>
  )
}
