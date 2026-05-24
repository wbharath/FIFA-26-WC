'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ChevronDown, Search } from 'lucide-react'

interface Player {
  id: number
  name: string
  position: string
  number: number | null
  photo: string
}

interface TeamData {
  team: { id: number; name: string; logo: string }
  players: Player[]
}

interface PlacedPlayer {
  player: Player
  teamSide: 'home' | 'away'
  x: number
  y: number
}

interface PlayerPanelProps {
  side: 'home' | 'away'
  teams: any[]
  homeTeamId: number | null
  awayTeamId: number | null
  homeData: TeamData | null
  awayData: TeamData | null
  selectedPlayers: { home: Set<number>; away: Set<number> }
  setHomeTeamId: (id: number) => void
  setAwayTeamId: (id: number) => void
  loadTeam: (id: number, side: 'home' | 'away') => void
  togglePlayer: (player: Player, side: 'home' | 'away') => void
}

const HOME_COLOR = '#E8002D'
const AWAY_COLOR = '#0033A0'
const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker']

function TeamSelect({
  side,
  teams,
  value,
  color,
  onChange,
}: {
  side: 'home' | 'away'
  teams: any[]
  value: number | null
  color: string
  onChange: (id: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = teams.find((t) => t.team.id === value) ?? null
  const filtered = search
    ? teams.filter((t) =>
        t.team.name.toLowerCase().includes(search.toLowerCase())
      )
    : teams

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10)
  }, [open])

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-wc-surface border text-left transition-all duration-150 hover:bg-wc-surface-2 rounded-sm"
        style={{ borderColor: selected ? color : '#2A2A2A' }}
      >
        {selected ? (
          <>
            <img
              src={selected.team.logo}
              className="w-5 h-5 object-contain shrink-0"
              loading="lazy"
            />
            <span className="text-xs font-semibold text-white flex-1 truncate">
              {selected.team.name}
            </span>
          </>
        ) : (
          <span className="text-xs text-wc-dimmed flex-1">
            {side === 'home' ? '← Home Team' : 'Away Team →'}
          </span>
        )}
        <ChevronDown
          size={13}
          className="text-wc-muted shrink-0 transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-wc-surface border border-wc-border shadow-2xl rounded-sm overflow-hidden">
          {/* Search row */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-wc-border">
            <Search size={12} className="text-wc-dimmed shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams..."
              className="flex-1 bg-transparent text-white text-xs outline-none placeholder:text-wc-dimmed"
            />
          </div>

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
            {filtered.length === 0 ? (
              <p className="text-[11px] text-wc-dimmed text-center py-4">
                No teams found
              </p>
            ) : (
              filtered.map((t: any) => {
                const active = value === t.team.id
                return (
                  <button
                    key={t.team.id}
                    onClick={() => {
                      onChange(t.team.id)
                      setOpen(false)
                      setSearch('')
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-100 hover:bg-wc-surface-2"
                    style={{
                      background: active ? `${color}18` : undefined,
                      borderLeft: active
                        ? `2px solid ${color}`
                        : '2px solid transparent',
                    }}
                  >
                    <img
                      src={t.team.logo}
                      className="w-5 h-5 object-contain shrink-0"
                      loading="lazy"
                    />
                    <span
                      className="text-xs truncate"
                      style={{ color: active ? 'white' : '#A0A0A0' }}
                    >
                      {t.team.name}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function getDefaultX(
  side: 'home' | 'away',
  position: string,
  index: number,
  total: number
): number {
  if (position === 'Goalkeeper') return side === 'home' ? 0.05 : 0.95
  const base = side === 'home' ? 0.15 : 0.55
  const spread = 0.3
  return base + (total > 1 ? (index / (total - 1)) * spread : spread / 2)
}

function getDefaultY(position: string, index: number, total: number): number {
  switch (position) {
    case 'Goalkeeper':
      return 0.5
    case 'Defender':
      return total > 1 ? 0.1 + (index / (total - 1)) * 0.8 : 0.5
    case 'Midfielder':
      return total > 1 ? 0.15 + (index / (total - 1)) * 0.7 : 0.5
    case 'Attacker':
      return total > 1 ? 0.2 + (index / (total - 1)) * 0.6 : 0.5
    default:
      return 0.5
  }
}

function PlayerPanel({
  side,
  teams,
  homeTeamId,
  awayTeamId,
  homeData,
  awayData,
  selectedPlayers,
  setHomeTeamId,
  setAwayTeamId,
  loadTeam,
  togglePlayer,
}: PlayerPanelProps) {
  const data = side === 'home' ? homeData : awayData
  const teamId = side === 'home' ? homeTeamId : awayTeamId
  const color = side === 'home' ? HOME_COLOR : AWAY_COLOR

  return (
    <div className="w-full md:w-48 flex flex-col gap-3 shrink-0">
      <TeamSelect
        side={side}
        teams={teams}
        value={teamId}
        color={color}
        onChange={(id) => {
          if (side === 'home') setHomeTeamId(id)
          else setAwayTeamId(id)
          loadTeam(id, side)
        }}
      />

      {data && (
        <div
          className="flex flex-col gap-3 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 230px)' }}
        >
          {POSITIONS.map((pos) => {
            const players = data.players.filter((p) => p.position === pos)
            if (players.length === 0) return null
            return (
              <div key={pos}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-wc-muted mb-1.5 pb-1 border-b border-wc-border">
                  {pos === 'Attacker'
                    ? 'Forwards'
                    : pos + (pos === 'Goalkeeper' ? '' : 's')}
                </p>
                <div className="flex flex-col gap-1">
                  {players.map((player, idx) => {
                    const isSelected = selectedPlayers[side].has(player.id)
                    return (
                      <button
                        key={`${player.id}-${pos}-${idx}`}
                        onClick={() => togglePlayer(player, side)}
                        className="flex items-center gap-2 px-2 py-1.5 text-left transition-colors hover:bg-wc-surface-2 w-full"
                        style={{
                          background: isSelected ? `${color}22` : undefined,
                          borderLeft: isSelected
                            ? `2px solid ${color}`
                            : '2px solid transparent',
                        }}
                      >
                        <img
                          src={player.photo}
                          className="w-6 h-6 rounded-full object-cover bg-wc-border shrink-0"
                          loading="lazy"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display =
                              'none'
                          }}
                        />
                        <span className="text-xs text-wc-muted truncate flex-1">
                          {player.name.split(' ').slice(-1)[0]}
                        </span>
                        {player.number && (
                          <span className="text-[10px] text-wc-dimmed shrink-0">
                            #{player.number}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function TacticsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [homeTeamId, setHomeTeamId] = useState<number | null>(null)
  const [awayTeamId, setAwayTeamId] = useState<number | null>(null)
  const [homeData, setHomeData] = useState<TeamData | null>(null)
  const [awayData, setAwayData] = useState<TeamData | null>(null)
  const [selectedPlayers, setSelectedPlayers] = useState<{
    home: Set<number>
    away: Set<number>
  }>({ home: new Set(), away: new Set() })
  const [placedPlayers, setPlacedPlayers] = useState<PlacedPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileTab, setMobileTab] = useState<'home' | 'pitch' | 'away'>('pitch')
  const pitchRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<{
    playerId: number
    side: 'home' | 'away'
    offsetX: number
    offsetY: number
  } | null>(null)
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
      const res = await fetch('/api/teams')
      const data = await res.json()
      setTeams(
        [...data].sort((a: any, b: any) =>
          a.team.name.localeCompare(b.team.name)
        )
      )
      setLoading(false)
    }
    init()
  }, [])

  async function loadTeam(teamId: number, side: 'home' | 'away') {
    const res = await fetch(`/api/teams/${teamId}`)
    const data: TeamData = await res.json()

    const seen = new Set<number>()
    data.players = data.players.filter((p) => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })

    if (side === 'home') setHomeData(data)
    else setAwayData(data)
    setSelectedPlayers((prev) => ({ ...prev, [side]: new Set() }))
    setPlacedPlayers((prev) => prev.filter((p) => p.teamSide !== side))
  }

  function togglePlayer(player: Player, side: 'home' | 'away') {
    setSelectedPlayers((prev) => {
      const next = new Set(prev[side])
      if (next.has(player.id)) {
        next.delete(player.id)
        setPlacedPlayers((pp) =>
          pp.filter((p) => !(p.player.id === player.id && p.teamSide === side))
        )
      } else {
        next.add(player.id)
        const sideData = side === 'home' ? homeData : awayData
        const samePosPlayers =
          sideData?.players.filter(
            (p) => p.position === player.position && next.has(p.id)
          ) || []
        const idx = samePosPlayers.indexOf(player)
        const x = getDefaultX(side, player.position, idx, samePosPlayers.length)
        const y = getDefaultY(player.position, idx, samePosPlayers.length)
        setPlacedPlayers((pp) => [...pp, { player, teamSide: side, x, y }])
      }
      return { ...prev, [side]: next }
    })
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, playerId: number, side: 'home' | 'away') => {
      e.preventDefault()
      const pitch = pitchRef.current
      if (!pitch) return
      const rect = pitch.getBoundingClientRect()
      const placed = placedPlayers.find(
        (p) => p.player.id === playerId && p.teamSide === side
      )
      if (!placed) return
      draggingRef.current = {
        playerId,
        side,
        offsetX: e.clientX - rect.left - placed.x * rect.width,
        offsetY: e.clientY - rect.top - placed.y * rect.height,
      }
    },
    [placedPlayers]
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, playerId: number, side: 'home' | 'away') => {
      const pitch = pitchRef.current
      if (!pitch) return
      const rect = pitch.getBoundingClientRect()
      const touch = e.touches[0]
      const placed = placedPlayers.find(
        (p) => p.player.id === playerId && p.teamSide === side
      )
      if (!placed) return
      draggingRef.current = {
        playerId,
        side,
        offsetX: touch.clientX - rect.left - placed.x * rect.width,
        offsetY: touch.clientY - rect.top - placed.y * rect.height,
      }
    },
    [placedPlayers]
  )

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingRef.current || !pitchRef.current) return
    const rect = pitchRef.current.getBoundingClientRect()
    const x = Math.max(
      0.02,
      Math.min(
        0.98,
        (e.clientX - rect.left - draggingRef.current.offsetX) / rect.width
      )
    )
    const y = Math.max(
      0.02,
      Math.min(
        0.98,
        (e.clientY - rect.top - draggingRef.current.offsetY) / rect.height
      )
    )
    const { playerId, side } = draggingRef.current
    setPlacedPlayers((prev) =>
      prev.map((p) =>
        p.player.id === playerId && p.teamSide === side ? { ...p, x, y } : p
      )
    )
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!draggingRef.current || !pitchRef.current) return
    e.preventDefault()
    const rect = pitchRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const x = Math.max(
      0.02,
      Math.min(
        0.98,
        (touch.clientX - rect.left - draggingRef.current.offsetX) / rect.width
      )
    )
    const y = Math.max(
      0.02,
      Math.min(
        0.98,
        (touch.clientY - rect.top - draggingRef.current.offsetY) / rect.height
      )
    )
    const { playerId, side } = draggingRef.current
    setPlacedPlayers((prev) =>
      prev.map((p) =>
        p.player.id === playerId && p.teamSide === side ? { ...p, x, y } : p
      )
    )
  }, [])

  const handleMouseUp = useCallback(() => {
    draggingRef.current = null
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp, handleTouchMove])

  if (loading)
    return (
      <main className="min-h-screen bg-wc-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-wc-red border-t-transparent rounded-full animate-spin" />
      </main>
    )

  return (
    <main className="min-h-screen bg-wc-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <p className="text-wc-muted text-xs font-semibold uppercase tracking-widest mb-1">
            FIFA World Cup 2026
          </p>
          <h1 className="font-bebas text-4xl uppercase">Tactical Board</h1>
        </div>

        {/* Mobile tab bar */}
        <div className="flex md:hidden mb-4 border border-wc-border rounded-sm overflow-hidden">
          {(['home', 'pitch', 'away'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                mobileTab === tab
                  ? 'bg-wc-red text-white'
                  : 'text-wc-muted hover:text-white hover:bg-wc-surface'
              }`}
            >
              {tab === 'home' ? 'Home' : tab === 'pitch' ? 'Pitch' : 'Away'}
            </button>
          ))}
        </div>

        <div className="flex gap-4 items-start">
          <div className={`shrink-0 ${mobileTab !== 'home' ? 'hidden md:block' : ''}`}>
            <PlayerPanel
              side="home"
              teams={teams}
              homeTeamId={homeTeamId}
              awayTeamId={awayTeamId}
              homeData={homeData}
              awayData={awayData}
              selectedPlayers={selectedPlayers}
              setHomeTeamId={setHomeTeamId}
              setAwayTeamId={setAwayTeamId}
              loadTeam={loadTeam}
              togglePlayer={togglePlayer}
            />
          </div>

          <div
            ref={pitchRef}
            className={`relative select-none flex-1 ${mobileTab !== 'pitch' ? 'hidden md:block' : ''}`}
            style={{
              aspectRatio: '105 / 68',
              background:
                'linear-gradient(90deg, #1a5c0e 0%, #1f6b11 8.33%, #1a5c0e 8.33%, #1f6b11 16.66%, #1a5c0e 16.66%, #1f6b11 25%, #1a5c0e 25%, #1f6b11 33.33%, #1a5c0e 33.33%, #1f6b11 41.66%, #1a5c0e 41.66%, #1f6b11 50%, #1a5c0e 50%, #1f6b11 58.33%, #1a5c0e 58.33%, #1f6b11 66.66%, #1a5c0e 66.66%, #1f6b11 75%, #1a5c0e 75%, #1f6b11 83.33%, #1a5c0e 83.33%, #1f6b11 91.66%, #1a5c0e 91.66%, #1f6b11 100%)',
              boxShadow: '0 0 0 2px rgba(255,255,255,0.1)',
            }}
          >
            <svg
              className="absolute inset-0 pointer-events-none"
              width="100%"
              height="100%"
              viewBox="0 0 105 68"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="0" y="0" width="105" height="68" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
              <line x1="52.5" y1="0" x2="52.5" y2="68" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
              <circle cx="52.5" cy="34" r="9.15" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
              <circle cx="52.5" cy="34" r="0.5" fill="rgba(255,255,255,0.6)" />
              <rect x="0" y="13.84" width="16.5" height="40.32" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
              <rect x="0" y="24.84" width="5.5" height="18.32" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
              <circle cx="11" cy="34" r="0.5" fill="rgba(255,255,255,0.6)" />
              <path d="M 16.5 24.84 A 9.15 9.15 0 0 0 16.5 43.16" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
              <rect x="-1" y="29.84" width="1" height="8.32" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
              <rect x="88.5" y="13.84" width="16.5" height="40.32" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
              <rect x="99.5" y="24.84" width="5.5" height="18.32" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
              <circle cx="94" cy="34" r="0.5" fill="rgba(255,255,255,0.6)" />
              <path d="M 88.5 24.84 A 9.15 9.15 0 0 1 88.5 43.16" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
              <rect x="105" y="29.84" width="1" height="8.32" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
              <path d="M 0 1 A 1 1 0 0 1 1 0" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
              <path d="M 104 0 A 1 1 0 0 1 105 1" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
              <path d="M 0 67 A 1 1 0 0 0 1 68" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
              <path d="M 105 67 A 1 1 0 0 1 104 68" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
            </svg>

            {placedPlayers.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white/30 text-xs">Select players from the panels</p>
              </div>
            )}

            {placedPlayers.map(({ player, teamSide, x, y }, index) => {
              const color = teamSide === 'home' ? HOME_COLOR : AWAY_COLOR
              return (
                <div
                  key={`${teamSide}-${player.id}-${index}`}
                  className="absolute cursor-grab active:cursor-grabbing"
                  style={{
                    left: `${x * 100}%`,
                    top: `${y * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                    touchAction: 'none',
                  }}
                  onMouseDown={(e) => handleMouseDown(e, player.id, teamSide)}
                  onTouchStart={(e) => handleTouchStart(e, player.id, teamSide)}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: `2.5px solid ${color}`,
                        overflow: 'hidden',
                        background: color,
                        boxShadow: '0 0 0 1.5px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.6)',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={player.photo}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        draggable={false}
                        onError={(e) => {
                          const el = e.target as HTMLImageElement
                          el.style.display = 'none'
                          if (el.parentElement) {
                            el.parentElement.innerHTML = `<span style="color:white;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;width:100%;height:100%">${player.number ?? '?'}</span>`
                          }
                        }}
                      />
                    </div>
                    <div
                      style={{
                        background: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        fontSize: 8,
                        fontWeight: 700,
                        padding: '1px 3px',
                        borderRadius: 2,
                        maxWidth: 44,
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.4,
                      }}
                    >
                      {player.name.split(' ').slice(-1)[0]}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className={`shrink-0 ${mobileTab !== 'away' ? 'hidden md:block' : ''}`}>
            <PlayerPanel
              side="away"
              teams={teams}
              homeTeamId={homeTeamId}
              awayTeamId={awayTeamId}
              homeData={homeData}
              awayData={awayData}
              selectedPlayers={selectedPlayers}
              setHomeTeamId={setHomeTeamId}
              setAwayTeamId={setAwayTeamId}
              loadTeam={loadTeam}
              togglePlayer={togglePlayer}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
