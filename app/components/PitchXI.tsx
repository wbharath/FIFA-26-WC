'use client'

import { useState } from 'react'

interface Player {
  id: number
  name: string
  position: string
  nationality: string
}
interface PitchXIProps {
  squad: Player[]
  teamId: number
  userId: string
  onSave: (formation: string, players: any) => void
}

const FORMATIONS: Record<string, number[]> = {
  '4-3-3': [4, 3, 3],
  '4-4-2': [4, 4, 2],
  '3-5-2': [3, 5, 2],
  '5-3-2': [5, 3, 2],
  '4-2-3-1': [4, 2, 3, 1]
}

const POSITION_COLORS: Record<string, string> = {
  GK: 'bg-yellow-500',
  DEF: 'bg-blue-500',
  MID: 'bg-green-500',
  FWD: 'bg-red-500'
}
export default function PitchXI({
  squad,
  teamId,
  userId,
  onSave
}: PitchXIProps) {
  const [formation, setFormation] = useState('4-3-3')
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [xi, setXi] = useState<Record<string, Player | null>>({})

  function getSlots(formation: string) {
    const lines = FORMATIONS[formation]
    const slots: {
      id: string
      line: number
      index: number
      role: string
    }[] = []

    // Goalkeeper
    slots.push({ id: 'GK-0', line: 0, index: 0, role: 'GK' })

    // Outfield players
    lines.forEach((count, lineIndex) => {
      const role =
        lineIndex === lines.length - 1 ? 'FWD' : lineIndex === 0 ? 'DEF' : 'MID'
      for (let i = 0; i < count; i++) {
        slots.push({
          id: `${role}-${lineIndex}-${i}`,
          line: lineIndex + 1,
          index: i,
          role
        })
      }
    })
    return slots
  }
  const slots = getSlots(formation)
  const lineCount = FORMATIONS[formation].length + 1

  function pickPlayer(player: Player) {
    if (!selectedSlot) return
    setXi((prev) => ({ ...prev, [selectedSlot]: player }))
    setSelectedSlot(null)
  }

  function getPlayerColor(role: string) {
    return POSITION_COLORS[role] || 'bg-gray-500'
  }
  function getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  async function saveXI() {
    onSave(formation, xi)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <label className="text-gray-400 text-sm">Formation:</label>
        <select
          value={formation}
          onChange={e => { setFormation(e.target.value); setXi({}) }}
          className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-1 text-sm"
        >
          {Object.keys(FORMATIONS).map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <button
          onClick={saveXI}
          className="ml-auto bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded-lg text-sm font-semibold transition"
        >
          Save XI
        </button>
      </div>

      <div className="flex gap-6 justify-center items-start">
        {/* Pitch */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: '100%',
            maxWidth: '360px',
            aspectRatio: '320 / 520',
            background: 'linear-gradient(180deg, #1a5c0e 50%, #1f6b11 50%)',
            backgroundSize: '100% 64px',
            boxShadow: '0 0 0 2px rgba(255,255,255,0.07), 0 20px 60px rgba(0,0,0,0.65)',
          }}
        >
          {/* SVG pitch markings */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width="100%"
            height="100%"
            viewBox="0 0 320 520"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer boundary */}
            <rect x="16" y="14" width="288" height="492" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
            {/* Halfway line */}
            <line x1="16" y1="260" x2="304" y2="260" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
            {/* Center circle */}
            <circle cx="160" cy="260" r="50" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
            {/* Center spot */}
            <circle cx="160" cy="260" r="3.5" fill="rgba(255,255,255,0.75)" />

            {/* Top penalty box */}
            <rect x="88" y="14" width="144" height="82" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
            {/* Top 6-yard box */}
            <rect x="122" y="14" width="76" height="28" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
            {/* Top penalty spot */}
            <circle cx="160" cy="74" r="3.5" fill="rgba(255,255,255,0.75)" />
            {/* Top D-arc — circle r=50 centred on penalty spot, arc below box edge y=96 */}
            <path d="M 115 96 A 50 50 0 0 1 205 96" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />

            {/* Bottom penalty box */}
            <rect x="88" y="424" width="144" height="82" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
            {/* Bottom 6-yard box */}
            <rect x="122" y="478" width="76" height="28" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
            {/* Bottom penalty spot */}
            <circle cx="160" cy="446" r="3.5" fill="rgba(255,255,255,0.75)" />
            {/* Bottom D-arc — arc above box edge y=424 */}
            <path d="M 115 424 A 50 50 0 0 1 205 424" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />

            {/* Corner arcs */}
            <path d="M 28 14 A 12 12 0 0 0 16 26"  fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
            <path d="M 292 14 A 12 12 0 0 1 304 26" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
            <path d="M 16 494 A 12 12 0 0 0 28 506"  fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
            <path d="M 304 494 A 12 12 0 0 1 292 506" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
          </svg>

          {/* Players on pitch */}
          <div
            className="relative flex flex-col-reverse justify-around"
            style={{ height: '100%', padding: '28px 20px' }}
          >
            {Array.from({ length: lineCount }).map((_, lineIndex) => {
              const lineSlots = slots.filter(s => s.line === lineIndex)
              return (
                <div key={lineIndex} className="flex justify-around items-center">
                  {lineSlots.map(slot => {
                    const player = xi[slot.id]
                    const isSelected = selectedSlot === slot.id
                    const posHex: Record<string, string> = {
                      GK: '#eab308',
                      DEF: '#3b82f6',
                      MID: '#22c55e',
                      FWD: '#ef4444',
                    }
                    const circleBg = player ? (posHex[slot.role] ?? '#6b7280') : 'rgba(255,255,255,0.18)'
                    return (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(isSelected ? null : slot.id)}
                        className="flex flex-col items-center gap-1 transition-transform"
                        style={{ transform: isSelected ? 'scale(1.1)' : 'scale(1)' }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: circleBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'white',
                            border: isSelected ? '2.5px solid #eab308' : '2px solid rgba(255,255,255,0.45)',
                            boxShadow: isSelected
                              ? '0 0 0 3px rgba(234,179,8,0.45), 0 0 18px rgba(234,179,8,0.65)'
                              : '0 2px 8px rgba(0,0,0,0.45)',
                            animation: isSelected ? 'pitchGlow 1.4s ease-in-out infinite' : 'none',
                          }}
                        >
                          {player ? getInitials(player.name) : '+'}
                        </div>
                        <span
                          style={{
                            color: 'white',
                            fontSize: 11,
                            fontWeight: 500,
                            maxWidth: 60,
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.7)',
                            lineHeight: 1.2,
                          }}
                        >
                          {player ? player.name.split(' ').slice(-1)[0] : slot.role}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>

          <style>{`
            @keyframes pitchGlow {
              0%, 100% { box-shadow: 0 0 0 3px rgba(234,179,8,0.45), 0 0 18px rgba(234,179,8,0.65); }
              50%       { box-shadow: 0 0 0 5px rgba(234,179,8,0.75), 0 0 28px rgba(234,179,8,0.90); }
            }
          `}</style>
        </div>

        {/* Squad list */}
        {selectedSlot && (
          <div className="w-48 bg-gray-900 rounded-xl p-3 overflow-y-auto max-h-96">
            <p className="text-gray-400 text-xs mb-3 font-semibold">Select player for {selectedSlot.split('-')[0]}</p>
            {squad
              .filter(p => {
                const role = selectedSlot.split('-')[0]
                if (role === 'GK') return p.position === 'Goalkeeper'
                if (role === 'DEF') return ['Defence', 'Centre-Back', 'Left-Back', 'Right-Back'].includes(p.position)
                if (role === 'MID') return ['Midfield', 'Central Midfield', 'Defensive Midfield', 'Attacking Midfield', 'Right Midfield', 'Left Midfield'].includes(p.position)
                if (role === 'FWD') return ['Offence', 'Centre-Forward', 'Left Winger', 'Right Winger'].includes(p.position)
                return true
              })
              .map(player => (
                <button
                  key={player.id}
                  onClick={() => pickPlayer(player)}
                  className="w-full text-left px-2 py-2 rounded-lg hover:bg-gray-700 text-sm transition"
                >
                  {player.name}
                </button>
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}
