'use client'

interface LineupPitchProps {
  slots: Record<string, any>
  formation: string
  subbedOffIds: number[]
  subbedOnIds: number[]
  onPlayerClick: (player: any) => void
  ratings?: Record<number, number>
}

const posHex: Record<string, string> = {
  GK: '#eab308',
  DEF: '#3b82f6',
  MID: '#22c55e',
  FWD: '#ef4444'
}

function getSlots(formation: string) {
  const lines = formation.split('-').map(Number)
  const slots: { id: string; line: number; index: number; role: string }[] = []
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

export default function LineupPitch({
  slots: slotData,
  formation,
  subbedOffIds,
  subbedOnIds,
  onPlayerClick,
  ratings = {}
}: LineupPitchProps) {
  const slots = getSlots(formation)
  const lineCount = formation.split('-').map(Number).length + 1

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-wc-muted text-xs uppercase tracking-widest">
          Formation
        </span>
        <span className="text-white text-xs font-semibold">{formation}</span>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden mx-auto"
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
            x="16" y="14" width="288" height="492"
            fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2"
          />
          <line
            x1="16" y1="260" x2="304" y2="260"
            stroke="rgba(255,255,255,0.55)" strokeWidth="2"
          />
          <circle
            cx="160" cy="260" r="50"
            fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2"
          />
          <circle cx="160" cy="260" r="3.5" fill="rgba(255,255,255,0.75)" />
          <rect
            x="88" y="14" width="144" height="82"
            fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2"
          />
          <rect
            x="122" y="14" width="76" height="28"
            fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2"
          />
          <circle cx="160" cy="74" r="3.5" fill="rgba(255,255,255,0.75)" />
          <path
            d="M 115 96 A 50 50 0 0 1 205 96"
            fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2"
          />
          <rect
            x="88" y="424" width="144" height="82"
            fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2"
          />
          <rect
            x="122" y="478" width="76" height="28"
            fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2"
          />
          <circle cx="160" cy="446" r="3.5" fill="rgba(255,255,255,0.75)" />
          <path
            d="M 115 424 A 50 50 0 0 1 205 424"
            fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2"
          />
          <path d="M 28 14 A 12 12 0 0 0 16 26" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
          <path d="M 292 14 A 12 12 0 0 1 304 26" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
          <path d="M 16 494 A 12 12 0 0 0 28 506" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
          <path d="M 304 494 A 12 12 0 0 1 292 506" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
        </svg>

        <div
          className="relative flex flex-col-reverse justify-around"
          style={{ height: '100%', padding: '28px 20px' }}
        >
          {Array.from({ length: lineCount }).map((_, lineIndex) => {
            const lineSlots = slots.filter((s) => s.line === lineIndex)
            return (
              <div key={lineIndex} className="flex justify-around items-center">
                {lineSlots.map((slot) => {
                  const player = slotData[slot.id]
                  const subbedOff = player && subbedOffIds.includes(player.id)
                  const subbedOn = player && subbedOnIds.includes(player.id)
                  const ringColor = posHex[slot.role] ?? '#6b7280'

                  return (
                    <button
                      key={slot.id}
                      onClick={() => player && onPlayerClick(player)}
                      className="flex flex-col items-center gap-1 transition-transform hover:scale-105"
                      style={{
                        opacity: subbedOff ? 0.4 : 1,
                        cursor: player ? 'pointer' : 'default'
                      }}
                    >
                      <div style={{ position: 'relative', width: 44, height: 52 }}>
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            background: player ? ringColor : 'rgba(255,255,255,0.18)',
                            border: '2px solid rgba(255,255,255,0.45)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {player ? (
                            <img
                              src={player.photo}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                const el = e.target as HTMLImageElement
                                el.style.display = 'none'
                                const parent = el.parentElement
                                if (parent) {
                                  parent.style.fontSize = '13px'
                                  parent.style.fontWeight = '700'
                                  parent.style.color = 'white'
                                  parent.innerHTML = String(player.number ?? '?')
                                }
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>
                              ?
                            </span>
                          )}
                        </div>

                        {/* Sub badge takes priority; otherwise rating badge (0 until user rates) */}
                        {player && (subbedOff || subbedOn) ? (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: -2,
                              right: -2,
                              background: subbedOff ? '#E8002D' : '#00A550',
                              borderRadius: '50%',
                              width: 18,
                              height: 18,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              fontWeight: 700,
                              color: 'white',
                              border: '1.5px solid rgba(0,0,0,0.4)',
                              zIndex: 1
                            }}
                          >
                            ↕
                          </div>
                        ) : player ? (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: -2,
                              right: -2,
                              background: ratings[player.id]
                                ? '#eab308'
                                : 'rgba(60,60,60,0.9)',
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
                            {ratings[player.id] ?? 0}
                          </div>
                        ) : null}
                      </div>

                      <span
                        style={{
                          color: subbedOff ? '#A0A0A0' : 'white',
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
                        {player ? player.name.split(' ').slice(-1)[0] : slot.role}
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
