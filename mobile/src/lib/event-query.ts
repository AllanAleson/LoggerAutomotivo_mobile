import type { Level } from '@/api/types'

export type Period = '1h' | '24h' | '7d' | '30d' | 'all' | 'custom'

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: '1h', label: 'Última hora' },
  { value: '24h', label: '24 horas' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'all', label: 'Tudo' },
  { value: 'custom', label: 'Personalizado' },
]

const PERIOD_HOURS: Record<Exclude<Period, 'all' | 'custom'>, number> = { '1h': 1, '24h': 24, '7d': 168, '30d': 720 }

export interface EventFilters {
  period: Period
  level: Level | ''
  event: string
  start: Date | null
  end: Date | null
}

export const DEFAULT_EVENT_FILTERS: EventFilters = { period: '24h', level: '', event: '', start: null, end: null }

// Mesmos filtros da aba Log do dashboard web (level, event, startDate, endDate).
// Os períodos relativos são calculados no momento da consulta.
export function buildEventParams(filters: EventFilters, now = Date.now()) {
  const params: Record<string, string> = {}
  if (filters.level) params.level = filters.level
  const event = filters.event.trim()
  if (event) params.event = event
  if (filters.period === 'custom') {
    if (filters.start) params.startDate = filters.start.toISOString()
    if (filters.end) params.endDate = filters.end.toISOString()
  } else if (filters.period !== 'all') {
    params.startDate = new Date(now - PERIOD_HOURS[filters.period] * 3_600_000).toISOString()
  }
  return params
}

// Montado à mão: o URLSearchParams do React Native não implementa toda a especificação.
export function toQueryString(params: Record<string, string | number | null | undefined>) {
  const parts = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  return parts.length ? `?${parts.join('&')}` : ''
}
