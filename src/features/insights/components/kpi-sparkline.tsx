"use client"

interface KpiSparklineProps {
  /** Série do mais antigo ao mais recente; null = mês sem dado (buraco na linha). */
  points: (number | null)[]
  height?: number
}

const WIDTH = 120

/**
 * Sparkline minimalista de 12 meses. Usa tokens do tema ativo
 * (--chart-1 para a linha, --border para a linha do zero), então funciona em
 * qualquer preset da galeria, claro ou escuro.
 */
export function KpiSparkline({ points, height = 28 }: KpiSparklineProps) {
  const values = points.filter((p): p is number => p !== null)
  if (values.length < 2) return null

  const min = Math.min(...values, 0)
  const max = Math.max(...values, 0)
  const range = max - min || 1

  const stepX = WIDTH / (points.length - 1)
  const toY = (value: number) =>
    height - 2 - ((value - min) / range) * (height - 4)

  const segments: string[] = []
  let current: string[] = []
  points.forEach((p, i) => {
    if (p === null) {
      if (current.length > 1) segments.push(current.join(" "))
      current = []
      return
    }
    current.push(`${(i * stepX).toFixed(1)},${toY(p).toFixed(1)}`)
  })
  if (current.length > 1) segments.push(current.join(" "))

  const zeroY = toY(0)
  const showZeroLine = min < 0 && max > 0

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      className="h-7 w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {showZeroLine && (
        <line
          x1="0"
          y1={zeroY}
          x2={WIDTH}
          y2={zeroY}
          stroke="var(--border)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      )}
      {segments.map((seg) => (
        <polyline
          key={seg}
          points={seg}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  )
}
