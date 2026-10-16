// Contrato da API REST do backend (Logger/LoggerAutomotivo/backend/src/app.ts).
export type Level = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
export type Status = 'ONLINE' | 'OFFLINE' | 'WARNING'

export const LEVELS: Level[] = ['INFO', 'WARNING', 'ERROR', 'CRITICAL']

export interface EventItem {
  id: string
  timestamp: string
  level: Level
  event: string
  signal: string | null
  expected: string | null
  received: string | null
  result: string | null
  possibleCause: string | null
  evidence: string[]
  synchronized?: boolean
  createdAt?: string
  loggerId: string
  pieceId: string | null
}

export interface Part {
  id: string
  pieceId: string
  serialNumber: string
  model: string
  description: string | null
  vehicleIdentifier: string | null
  loggerId: string | null
  status: Status
  lastSeen: string | null
  firmwareVersion: string | null
  communicationMode: string | null
  batteryVoltage: number | null
  pendingEvents: number | null
  latestFailure: EventItem | null
}

export interface Logger {
  id: string
  loggerId: string
  pieceId: string | null
  status: Status
  lastSeen: string | null
  firmwareVersion: string | null
  communicationMode: string | null
  batteryVoltage: number | null
  pendingEvents: number | null
}

export interface DashboardSummary {
  online: number
  offline: number
  warning: number
  critical: number
  failures24h: number
}

export interface DashboardResponse {
  summary: DashboardSummary
  recentEvents: EventItem[]
}

export interface ListResponse<T> {
  items: T[]
  count: number
}

export interface EventPage extends ListResponse<EventItem> {
  page: number
  limit: number
}

export interface DiagnosisResponse {
  diagnosis: EventItem | null
}

export interface HealthResponse {
  status: string
  database: string
  timestamp: string
  offlineThresholdMinutes?: number
}

export interface TimelineBucket {
  start: string
  end: string
  total: number
  levels: Record<Level, number>
  signals: { signal: string; pieceId: string | null; count: number }[]
  peak: boolean
}

// GET /api/events/timeline: eventos por intervalo com os picos de oscilação marcados.
export interface Timeline {
  start: string
  end: string
  bucketMinutes: number
  buckets: TimelineBucket[]
  peaks: number[]
  stats: { mean: number; std: number; threshold: number; max: number; total: number }
}
