export default function KickbaseLogo({ size = 32 }: { size?: number }) {
  const r = 34 // radius for patch centers from circle center
  const patches = [
    { angle: -90 }, // top
    { angle: -18 }, // top right
    { angle: 54 }, // bottom right
    { angle: 126 }, // bottom left
    { angle: 198 } // top left
  ]

  function pentagon(cx: number, cy: number, r: number, rotation: number) {
    const points = []
    for (let i = 0; i < 5; i++) {
      const angle = ((rotation + i * 72) * Math.PI) / 180
      points.push(`${(cx + r * Math.cos(angle)).toFixed(4)},${(cy + r * Math.sin(angle)).toFixed(4)}`)
    }
    return points.join(' ')
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="#0A0A0A"
        stroke="#E8002D"
        strokeWidth="2.5"
      />

      {patches.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180
        const cx = 50 + r * Math.cos(rad)
        const cy = 50 + r * Math.sin(rad)
        return (
          <polygon
            key={i}
            points={pentagon(cx, cy, 8, p.angle + 90)}
            fill="#E8002D"
          />
        )
      })}

      <text
        x="50"
        y="68"
        fontFamily="Arial Black, sans-serif"
        fontSize="50"
        fontWeight="900"
        fill="white"
        textAnchor="middle"
      >
        K
      </text>
    </svg>
  )
}
