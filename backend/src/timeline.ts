// Linha do tempo de verificações: eventos agrupados por intervalo e detecção
// de picos de oscilação (intervalos com volume muito acima do normal).
export const LEVELS = ['INFO', 'WARNING', 'ERROR', 'CRITICAL'] as const
export type Level = typeof LEVELS[number]

const NICE_BUCKET_MINUTES = [1, 2, 5, 10, 15, 30, 60, 120, 180, 360, 720, 1440, 2880, 10080]
const WEEK_MINUTES = 10080

// Tamanho "redondo" de intervalo que divide o período em cerca de `target` colunas
// (5% de folga: "últimas 24 h" calculadas alguns ms antes continuam em 1 h).
export function pickBucketMinutes(rangeMs: number, target: number) {
  const raw = rangeMs / Math.max(1, target) / 60_000 / 1.05
  return NICE_BUCKET_MINUTES.find(step => step >= raw) ?? Math.ceil(raw / WEEK_MINUTES) * WEEK_MINUTES
}

// Alinha o início do primeiro intervalo ao relógio local do usuário (ex.: 14:00, 00:00).
export function alignStart(startMs: number, bucketMs: number, utcOffsetMinutes = 0) {
  const offset = utcOffsetMinutes * 60_000
  return Math.floor((startMs + offset) / bucketMs) * bucketMs - offset
}

// Pico = intervalo acima de média + 2 desvios-padrão, com um mínimo absoluto de
// eventos para que um par de registros isolados não seja tratado como oscilação.
export function detectPeaks(values: number[], { sigma = 2, minCount = 3 } = {}) {
  if (!values.length) return { mean: 0, std: 0, threshold: 0, peaks: [] as number[] }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const std = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length)
  const threshold = mean + sigma * std
  const peaks = values.flatMap((value, index) => value > threshold && value >= minCount ? [index] : [])
  return { mean, std, threshold, peaks }
}

export type TimelineRow = {
  idx: number
  level: string
  signal: string | null
  pieceId: string | null
  count: number
}

export interface TimelineBucket {
  start: string
  end: string
  total: number
  levels: Record<Level, number>
  signals: { signal: string; pieceId: string | null; count: number }[]
  peak: boolean
}

export function buildTimeline({ rows, origin, bucketMs, bucketCount }: {
  rows: TimelineRow[]
  origin: number
  bucketMs: number
  bucketCount: number
}) {
  const signalCounts = Array.from({ length: bucketCount }, () => new Map<string, { signal: string; pieceId: string | null; count: number }>())
  const buckets: TimelineBucket[] = Array.from({ length: bucketCount }, (_, index) => ({
    start: new Date(origin + index * bucketMs).toISOString(),
    end: new Date(origin + (index + 1) * bucketMs).toISOString(),
    total: 0,
    levels: { INFO: 0, WARNING: 0, ERROR: 0, CRITICAL: 0 },
    signals: [],
    peak: false,
  }))

  for (const row of rows) {
    const bucket = buckets[row.idx]
    if (!bucket) continue
    bucket.total += row.count
    if ((LEVELS as readonly string[]).includes(row.level)) bucket.levels[row.level as Level] += row.count
    const signal = row.signal ?? 'SEM SINAL'
    const key = `${row.pieceId ?? ''}|${signal}`
    const entry = signalCounts[row.idx].get(key) ?? { signal, pieceId: row.pieceId, count: 0 }
    entry.count += row.count
    signalCounts[row.idx].set(key, entry)
  }

  buckets.forEach((bucket, index) => {
    bucket.signals = [...signalCounts[index].values()]
      .sort((a, b) => b.count - a.count || a.signal.localeCompare(b.signal))
      .slice(0, 3)
  })

  const stats = detectPeaks(buckets.map(bucket => bucket.total))
  for (const index of stats.peaks) buckets[index].peak = true
  const total = buckets.reduce((sum, bucket) => sum + bucket.total, 0)
  const max = buckets.reduce((highest, bucket) => Math.max(highest, bucket.total), 0)
  return {
    buckets,
    peaks: stats.peaks,
    stats: { mean: stats.mean, std: stats.std, threshold: stats.threshold, max, total },
  }
}
