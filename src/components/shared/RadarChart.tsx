interface RadarAxis {
  label: string
  value: number
}

interface RadarChartProps {
  axes: RadarAxis[]
  size?: number
}

export function RadarChart({ axes, size = 200 }: RadarChartProps) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.32
  const n = axes.length
  const gridLevels = [25, 50, 75, 100]

  const angle = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / n

  const toPoint = (i: number, value: number) => {
    const a = angle(i)
    const d = (value / 100) * r
    return { x: cx + d * Math.cos(a), y: cy + d * Math.sin(a) }
  }

  const gridPolygon = (level: number) =>
    Array.from({ length: n }, (_, i) => {
      const p = toPoint(i, level)
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
    }).join(" ")

  const dataPoints = axes.map((ax, i) => toPoint(i, ax.value))
  const dataPath =
    dataPoints
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ") + " Z"

  const labelRadius = r + 24

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: "visible" }}
      width={size}
      height={size}
    >
      {/* Grid polygons */}
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={gridPolygon(level)}
          fill="none"
          stroke="var(--radar-grid)"
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {axes.map((_, i) => {
        const p = toPoint(i, 100)
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x.toFixed(1)}
            y2={p.y.toFixed(1)}
            stroke="var(--radar-axis)"
            strokeWidth={1}
          />
        )
      })}

      {/* Data polygon */}
      <path
        d={dataPath}
        fill="var(--radar-fill)"
        fillOpacity={0.18}
        stroke="var(--radar-stroke)"
        strokeWidth={1.8}
        strokeOpacity={0.9}
      />

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={2.8} fill="var(--radar-stroke)" fillOpacity={0.95} />
      ))}

      {/* Grid scale labels (right axis only) */}
      {[25, 50, 75].map((level) => {
        const p = toPoint(0, level)
        return (
          <text
            key={level}
            x={(p.x + 3).toFixed(1)}
            y={p.y.toFixed(1)}
            textAnchor="start"
            dominantBaseline="middle"
            fontSize={6.5}
            fill="var(--radar-scale)"
          >
            {level}
          </text>
        )
      })}

      {/* Axis labels */}
      {axes.map((ax, i) => {
        const a = angle(i)
        const lx = cx + labelRadius * Math.cos(a)
        const ly = cy + labelRadius * Math.sin(a)
        return (
          <text
            key={i}
            x={lx.toFixed(1)}
            y={ly.toFixed(1)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fontWeight={700}
            fill="var(--radar-label)"
          >
            {ax.label}
          </text>
        )
      })}
    </svg>
  )
}
