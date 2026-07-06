export type ForecastingModel = "MOVING_AVERAGE" | "STRAIGHT_LINE" | "EXPONENTIAL_SMOOTHING"

/**
 * Média Móvel (Moving Average):
 * Calcula a média dos últimos `windowSize` meses.
 * Aplica a média iterativamente para os próximos meses projetados.
 */
export function calculateMovingAverage(
  history: number[],
  futureMonths: number,
  windowSize: number = 3,
): number[] {
  if (!history || history.length === 0) return Array(futureMonths).fill(0)

  const projected: number[] = []
  const extendedData = [...history]

  for (let i = 0; i < futureMonths; i++) {
    const window = extendedData.slice(-windowSize)
    const sum = window.reduce((a, b) => a + b, 0)
    const avg = window.length > 0 ? sum / window.length : 0

    projected.push(avg)
    extendedData.push(avg)
  }

  return projected
}

/**
 * Linha Reta (Straight Line / Linear Regression):
 * Aplica regressão linear simples (y = mx + b) sobre o histórico
 * para encontrar a tendência e projetá-la nos próximos meses.
 */
export function calculateStraightLine(
  history: number[],
  futureMonths: number,
  clampToZero: boolean = true
): number[] {
  if (!history || history.length === 0) return Array(futureMonths).fill(0)
  if (history.length === 1) return Array(futureMonths).fill(history[0])

  const n = history.length
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0

  for (let i = 0; i < n; i++) {
    const x = i + 1
    const y = history[i]
    sumX += x
    sumY += y
    sumXY += x * y
    sumXX += x * x
  }

  const denominator = n * sumXX - sumX * sumX
  const m = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator
  const b = (sumY - m * sumX) / n

  const projected: number[] = []
  for (let i = 0; i < futureMonths; i++) {
    const xFuture = n + i + 1
    const yFuture = m * xFuture + b
    projected.push(clampToZero ? Math.max(0, yFuture) : yFuture)
  }

  return projected
}

/**
 * Suavização Exponencial (Exponential Smoothing):
 * Dá um peso maior aos dados mais recentes.
 * O forecast projeta a última tendência suavizada.
 */
export function calculateExponentialSmoothing(
  history: number[],
  futureMonths: number,
  alpha: number = 0.5,
  clampToZero: boolean = true
): number[] {
  if (!history || history.length === 0) return Array(futureMonths).fill(0)
  if (history.length === 1) return Array(futureMonths).fill(history[0])

  let smoothed = history[0]

  for (let i = 1; i < history.length; i++) {
    smoothed = alpha * history[i] + (1 - alpha) * smoothed
  }

  return Array(futureMonths).fill(clampToZero ? Math.max(0, smoothed) : smoothed)
}

export function projectSeries(
  history: number[],
  futureMonths: number,
  model: ForecastingModel,
  clampToZero: boolean = true
): number[] {
  // Se não houver histórico de movimentação (0, 0, 0...), projeta 0 para todos os meses
  const sumHistory = history.reduce((acc, curr) => acc + curr, 0)
  if (sumHistory === 0) {
    return Array(futureMonths).fill(0)
  }

  switch (model) {
    case "MOVING_AVERAGE":
      return calculateMovingAverage(history, futureMonths)
    case "STRAIGHT_LINE":
      return calculateStraightLine(history, futureMonths, clampToZero)
    case "EXPONENTIAL_SMOOTHING":
      return calculateExponentialSmoothing(history, futureMonths, 0.5, clampToZero)
    default:
      return calculateMovingAverage(history, futureMonths)
  }
}
