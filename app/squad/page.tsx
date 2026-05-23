'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState, memo } from 'react'
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

const PlayerCard = memo(function PlayerCard({ player }: { player: Player }) {
  return (
    <div className="bg-wc-surface border border-wc-border p-3 flex items-center gap-3 hover:bg-wc-surface-2 transition-colors">
      <img
        src={player.photo}
        alt={player.name}
        className="w-10 h-10 rounded-full object-cover bg-wc-border shrink-0"
        loading="lazy"
        onError={(e) => {
          ;(e.target as HTMLImageElement).style.display = 'none'
        }}
      />
      <div className="min-w-0">
        <p className="font-bebas text-base leading-tight truncate">{player.name}</p>
        <p className="text-wc-muted text-xs">
          {player.position}
          {player.number ? ` · #${player.number}` : ''}
        </p>
        <p className="text-wc-dimmed text-xs">Age {player.age}</p>
      </div>
    </div>
  )
})

function SquadSkeleton() {
  return (
    <main className="min-h-screen bg-wc-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="h-9 w-48 bg-wc-surface rounded animate-pulse mb-6" />
        <div className="h-10 w-64 bg-wc-surface rounded animate-pulse mb-8" />
        <div className="flex flex-col gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-8 bg-wc-surface animate-pulse mb-0" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-[68px] bg-wc-surface animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
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
        data: { user },
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
    Forwards: squad.filter((p) => p.position === 'Attacker'),
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

  if (loading) return <SquadSkeleton />

  return (
    <main className="min-h-screen bg-wc-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="font-bebas text-5xl uppercase mb-6">Squad Explorer</h1>

        <select
          value={selectedTeamId || ''}
          onChange={(e) => handleTeamChange(Number(e.target.value))}
          className="bg-wc-surface text-white border border-wc-border px-4 py-2.5 mb-8 w-full md:w-auto focus:outline-none focus:border-wc-red transition-colors appearance-none"
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
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-wc-border">
            <img
              src={teamInfo.team.logo}
              className="w-14 h-14 object-contain"
              loading="lazy"
            />
            <div>
              <h2 className="font-bebas text-3xl uppercase">{teamInfo.team.name}</h2>
              <p className="text-wc-muted text-sm">{teamInfo.team.country}</p>
            </div>
          </div>
        )}

        {squadLoading ? (
          <div className="flex flex-col gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="h-8 bg-wc-surface animate-pulse mb-0" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-[68px] bg-wc-surface animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(positionGroups).map(
              ([position, players]) =>
                players.length > 0 && (
                  <div key={position}>
                    <div className="px-0 py-2 border-b border-wc-border mb-0">
                      <span className="text-[11px] font-semibold text-wc-dimmed uppercase tracking-widest">
                        {position}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-wc-border">
                      {players.map((player) => (
                        <PlayerCard key={player.id} player={player} />
                      ))}
                    </div>
                  </div>
                )
            )}
          </div>
        )}

        {squad.length > 0 && (
          <div className="mt-10">
            <h3 className="font-bebas text-3xl uppercase text-wc-red mb-4">
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
