import type { Level, TimelineBucket } from '@/api/types'

// Pilha de baixo para cima. INFO em cinza (verificação normal, contexto) e as
// falhas nas cores de status, validadas para daltonismo (protan/deutan) no fundo branco.
export const SEVERITY_SERIES: { level: Level; label: string; color: string }[] = [
  { level: 'INFO', label: 'Verificação OK', color: '#b4bcc6' },
  { level: 'WARNING', label: 'Aviso', color: '#e9a420' },
  { level: 'ERROR', label: 'Erro', color: '#e0573f' },
  { level: 'CRITICAL', label: 'Crítico', color: '#a9212d' },
]

const pad = (value: number) => String(value).padStart(2, '0')

// Teto "redondo" do eixo Y com metade inteira (0 · metade · máximo).
export function niceMax(value: number) {
  if (value <= 1) return 2
  const step = 10 ** Math.floor(Math.log10(value))
  const rounded = Math.ceil(value / step) * step
  return rounded % 2 === 0 ? rounded : rounded + step
}

export function bucketLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  if (minutes < 1440) return `${minutes / 60} h`
  const days = minutes / 1440
  return `${days} ${days === 1 ? 'dia' : 'dias'}`
}

export function failures(bucket: TimelineBucket) {
  return bucket.levels.WARNING + bucket.levels.ERROR + bucket.levels.CRITICAL
}

function day(date: Date) { return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}` }
function hour(date: Date) { return `${pad(date.getHours())}:${pad(date.getMinutes())}` }

// Rótulo do eixo X conforme o tamanho do intervalo e a extensão do período.
export function tickLabel(iso: string, bucketMinutes: number, multiDay: boolean) {
  const date = new Date(iso)
  if (bucketMinutes >= 1440) return day(date)
  return multiDay ? `${day(date)} ${pad(date.getHours())}h` : hour(date)
}

export function rangeLabel(bucket: TimelineBucket) {
  const start = new Date(bucket.start)
  const end = new Date(bucket.end)
  const sameDay = day(start) === day(new Date(end.getTime() - 1))
  if (sameDay) return `${day(start)} ${hour(start)}–${hour(end)}`
  return `${day(start)} ${hour(start)} – ${day(end)} ${hour(end)}`
}

export function largestPeak(buckets: TimelineBucket[], peaks: number[]) {
  return peaks.reduce<number | null>((best, index) => best === null || buckets[index].total > buckets[best].total ? index : best, null)
}

// Diferença do fuso local para UTC em minutos (ex.: Brasília = -180).
export const utcOffsetMinutes = () => -new Date().getTimezoneOffset()
