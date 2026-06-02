'use client'

import { useState, useEffect } from 'react'

interface Player {
  id: number
  name: string
  position: string
  number: number | null
  photo: string
  age: number
}

interface PitchXIProps {
  squad: Player[]
  teamId: number
  userId: string
  savedFormation?: string
  savedXI?: Record<string, Player | null>
  onSave: (formation: string, players: any) => void
  readOnly?: boolean
}

const FORMATIONS: Record<string, number[]> = {
  '4-3-3': [4, 3, 3],
  '4-4-2': [4, 4, 2],
  '3-5-2': [3, 5, 2],
  '5-3-2': [5, 3, 2],
  '4-2-3-1': [4, 2, 3, 1]
}

export default function PitchXI({
  squad,
  teamId,
  userId,
  savedFormation,
  savedXI,
  onSave,
  readOnly = false
}: PitchXIProps) {
  const [formation, setFormation] = useState(savedFormation || '4-3-3')
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [xi, setXi] = useState<Record<string, Player | null>>(savedXI || {})

  useEffect(() => {
    if (savedFormation) setFormation(savedFormation)
    if (savedXI) setXi(savedXI)
  }, [savedFormation, savedXI])

  function getSlots(formation: string) {
    const lines = FORMATIONS[formation]
    const slots: { id: string; line: number; index: number; role: string }[] =
      []
    slots.push({ id: 'GK-0', line: 0, index: 0, role: 'GK' })
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
    if (!selectedSlot || readOnly) return
    setXi((prev) => ({ ...prev, [selectedSlot]: player }))
    setSelectedSlot(null)
  }

  function filterByRole(role: string) {
    if (role === 'GK') return squad.filter((p) => p.position === 'Goalkeeper')
    if (role === 'DEF') return squad.filter((p) => p.position === 'Defender')
    if (role === 'MID') return squad.filter((p) => p.position === 'Midfielder')
    if (role === 'FWD') return squad.filter((p) => p.position === 'Attacker')
    return squad
  }

  const posHex: Record<string, string> = {
    GK: '#eab308',
    DEF: '#3b82f6',
    MID: '#22c55e',
    FWD: '#ef4444'
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Formation selector + Save — hidden in readOnly */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <label className="text-gray-400 text-sm">Formation:</label>
          <select
            value={formation}
            onChange={(e) => {
              setFormation(e.target.value)
              setXi({})
            }}
            className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-1 text-sm"
          >
            {Object.keys(FORMATIONS).map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <button
            onClick={() => onSave(formation, xi)}
            className="ml-auto bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded-lg text-sm font-semibold transition"
          >
            Save XI
          </button>
        </div>
      )}

      {/* Formation label in readOnly */}
      {readOnly && (
        <div className="flex items-center gap-2">
          <span className="text-wc-muted text-xs uppercase tracking-widest">
            Formation
          </span>
          <span className="text-white text-xs font-semibold">{formation}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-stretch sm:items-start">
        {/* Pitch */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: '100%',
            maxWidth: '360px',
            aspectRatio: '320 / 520',
            background: 'linear-gradient(180deg, #1a5c0e 50%, #1f6b11 50%)',
            backgroundSize: '100% 64px',
            boxShadow:
              '0 0 0 2px rgba(255,255,255,0.07), 0 20px 60px rgba(0,0,0,0.65)'
          }}
        >
          <svg
            className="absolute inset-0 pointer-events-none"
            width="100%"
            height="100%"
            viewBox="0 0 320 520"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="16"
              y="14"
              width="288"
              height="492"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2"
            />
            <line
              x1="16"
              y1="260"
              x2="304"
              y2="260"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2"
            />
            <circle
              cx="160"
              cy="260"
              r="50"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2"
            />
            <circle cx="160" cy="260" r="3.5" fill="rgba(255,255,255,0.75)" />
            <rect
              x="88"
              y="14"
              width="144"
              height="82"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2"
            />
            <rect
              x="122"
              y="14"
              width="76"
              height="28"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2"
            />
            <circle cx="160" cy="74" r="3.5" fill="rgba(255,255,255,0.75)" />
            <path
              d="M 115 96 A 50 50 0 0 1 205 96"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2"
            />
            <rect
              x="88"
              y="424"
              width="144"
              height="82"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2"
            />
            <rect
              x="122"
              y="478"
              width="76"
              height="28"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2"
            />
            <circle cx="160" cy="446" r="3.5" fill="rgba(255,255,255,0.75)" />
            <path
              d="M 115 424 A 50 50 0 0 1 205 424"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2"
            />
            <path
              d="M 28 14 A 12 12 0 0 0 16 26"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2"
            />
            <path
              d="M 292 14 A 12 12 0 0 1 304 26"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2"
            />
            <path
              d="M 16 494 A 12 12 0 0 0 28 506"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2"
            />
            <path
              d="M 304 494 A 12 12 0 0 1 292 506"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2"
            />
          </svg>

          <div
            className="relative flex flex-col-reverse justify-around"
            style={{ height: '100%', padding: '28px 20px' }}
          >
            {Array.from({ length: lineCount }).map((_, lineIndex) => {
              const lineSlots = slots.filter((s) => s.line === lineIndex)
              return (
                <div
                  key={lineIndex}
                  className="flex justify-around items-center"
                >
                  {lineSlots.map((slot) => {
                    const player = xi[slot.id]
                    const isSelected = selectedSlot === slot.id
                    const borderColor = isSelected
                      ? '#eab308'
                      : 'rgba(255,255,255,0.45)'
                    const ringColor = posHex[slot.role] ?? '#6b7280'

                    return (
                      <button
                        key={slot.id}
                        onClick={() => {
                          if (readOnly) return
                          setSelectedSlot(isSelected ? null : slot.id)
                        }}
                        disabled={readOnly}
                        className="flex flex-col items-center gap-1 transition-transform"
                        style={{
                          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                          cursor: readOnly ? 'default' : 'pointer'
                        }}
                      >
                        <div
                          style={{
                            position: 'relative',
                            width: 44,
                            height: 52
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              borderRadius: '50%',
                              background: player
                                ? ringColor
                                : 'rgba(255,255,255,0.18)',
                              border: isSelected
                                ? '2.5px solid #eab308'
                                : `2px solid ${borderColor}`,
                              boxShadow: isSelected
                                ? '0 0 0 3px rgba(234,179,8,0.45), 0 0 18px rgba(234,179,8,0.65)'
                                : '0 2px 8px rgba(0,0,0,0.45)',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {player ? (
                              <img
                                src={player.photo}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                                onError={(e) => {
                                  const el = e.target as HTMLImageElement
                                  el.style.display = 'none'
                                  const parent = el.parentElement
                                  if (parent) {
                                    parent.style.fontSize = '13px'
                                    parent.style.fontWeight = '700'
                                    parent.style.color = 'white'
                                    parent.innerHTML = String(
                                      player.number ?? '?'
                                    )
                                  }
                                }}
                              />
                            ) : (
                              <span
                                style={{
                                  fontSize: 18,
                                  color: 'rgba(255,255,255,0.5)'
                                }}
                              >
                                {readOnly ? '?' : '+'}
                              </span>
                            )}
                          </div>
                          {player && player.number && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: -2,
                                right: -2,
                                background: ringColor,
                                borderRadius: '50%',
                                width: 18,
                                height: 18,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 10,
                                fontWeight: 700,
                                color: 'white',
                                border: '1.5px solid rgba(0,0,0,0.4)'
                              }}
                            >
                              {player.number}
                            </div>
                          )}
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
                            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                            lineHeight: 1.2
                          }}
                        >
                          {player
                            ? player.name.split(' ').slice(-1)[0]
                            : slot.role}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* Squad picker — hidden in readOnly */}
        {!readOnly && selectedSlot && (
          <div className="w-full sm:w-48 bg-gray-900 rounded-xl p-3 overflow-y-auto max-h-64 sm:max-h-96">
            <p className="text-gray-400 text-xs mb-3 font-semibold">
              Select {selectedSlot.split('-')[0]}
            </p>
            {filterByRole(selectedSlot.split('-')[0]).map((player) => (
              <button
                key={player.id}
                onClick={() => pickPlayer(player)}
                className="w-full text-left px-2 py-2 rounded-lg hover:bg-gray-700 text-sm transition flex items-center gap-2"
              >
                <img
                  src={player.photo}
                  className="w-6 h-6 rounded-full object-cover bg-gray-700 flex-shrink-0"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                <span>
                  {player.name}
                  {player.number ? ` #${player.number}` : ''}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
