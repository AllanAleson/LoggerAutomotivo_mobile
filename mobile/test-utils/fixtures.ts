import type { EventItem, Logger, Part } from '@/api/types'

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

const event = (overrides: Partial<EventItem> & Pick<EventItem, 'id' | 'level' | 'event'>): EventItem => ({
  timestamp: minutesAgo(30),
  signal: null,
  expected: null,
  received: null,
  result: 'OK',
  possibleCause: null,
  evidence: [],
  loggerId: 'LOGGER-001',
  pieceId: 'PT-00018429',
  ...overrides,
})

export const timeoutEvent = event({
  id: '11111111-1111-4111-8111-111111111111',
  timestamp: minutesAgo(60),
  level: 'ERROR',
  event: 'RESPONSE_TIMEOUT',
  signal: 'LOCK_RESPONSE',
  expected: 'HIGH',
  received: 'NONE',
  result: 'FAIL',
  possibleCause: 'Possível falha de conexão, saída ou componente.',
  evidence: ['Comando LOCK detectado', 'Logger permaneceu operacional'],
})

export const warningEvent = event({
  id: '22222222-2222-4222-8222-222222222222',
  timestamp: minutesAgo(26 * 60),
  level: 'WARNING',
  event: 'ANALOG_WARNING',
  signal: 'SUPPLY_VOLTAGE',
  expected: '>= 11.8V',
  received: '11.4V',
  result: 'WARNING',
  possibleCause: 'Possível queda momentânea na alimentação elétrica.',
  evidence: ['Tensão abaixo do limite configurado'],
})

export const lockEvent = event({
  id: '33333333-3333-4333-8333-333333333333',
  timestamp: minutesAgo(5),
  level: 'INFO',
  event: 'LOCK',
  signal: 'IN2',
  received: 'ACTIVE',
})

export const part: Part = {
  id: 'part-1',
  pieceId: 'PT-00018429',
  serialNumber: 'SN-2026-18429',
  model: 'Módulo Automotivo Demonstrativo',
  description: 'Peça de demonstração',
  vehicleIdentifier: 'VEICULO-DEMO-01',
  loggerId: 'LOGGER-001',
  status: 'ONLINE',
  lastSeen: minutesAgo(1),
  firmwareVersion: '0.2.0',
  communicationMode: 'CELLULAR',
  batteryVoltage: 12.4,
  pendingEvents: 0,
  latestFailure: timeoutEvent,
}

export const logger: Logger = {
  id: 'logger-1',
  loggerId: 'LOGGER-001',
  pieceId: 'PT-00018429',
  status: 'ONLINE',
  lastSeen: minutesAgo(1),
  firmwareVersion: '0.2.0',
  communicationMode: 'CELLULAR',
  batteryVoltage: 12.4,
  pendingEvents: 0,
}

const allEvents = [lockEvent, timeoutEvent, warningEvent]

// Simula a API do backend a partir da URL requisitada.
export function apiResponse(url: string): { status: number; body: unknown } {
  const [path, query = ''] = url.replace(/^https?:\/\/[^/]+/, '').split('?')
  const params = Object.fromEntries(query.split('&').filter(Boolean).map(pair => pair.split('=').map(decodeURIComponent)))
  if (path === '/api/health') return { status: 200, body: { status: 'ok', database: 'pglite', timestamp: new Date().toISOString(), offlineThresholdMinutes: 10 } }
  if (path === '/api/dashboard') return { status: 200, body: { summary: { online: 1, offline: 0, warning: 0, critical: 0, failures24h: 1 }, recentEvents: [timeoutEvent, warningEvent] } }
  if (path === '/api/alerts') return { status: 200, body: { items: [timeoutEvent, warningEvent], count: 2 } }
  if (path === '/api/loggers') return { status: 200, body: { items: [logger], count: 1 } }
  if (path === '/api/parts') {
    const term = String(params.search ?? '').toUpperCase()
    const match = [part.pieceId, part.serialNumber, part.loggerId].some(value => value?.includes(term))
    return { status: 200, body: match ? { items: [part], count: 1 } : { items: [], count: 0 } }
  }
  if (path === '/api/parts/PT-00018429') return { status: 200, body: part }
  if (path === '/api/parts/PT-00018429/diagnosis') return { status: 200, body: { diagnosis: timeoutEvent } }
  if (path === '/api/parts/PT-00018429/events/export') return { status: 200, body: 'timestamp,event\r\n' }
  if (path === '/api/parts/PT-00018429/events') {
    const items = params.level ? allEvents.filter(item => item.level === params.level) : allEvents
    return { status: 200, body: { items, count: items.length, page: Number(params.page ?? 1), limit: Number(params.limit ?? 50) } }
  }
  const eventMatch = /^\/api\/events\/(.+)$/.exec(path)
  if (eventMatch) {
    const found = allEvents.find(item => item.id === eventMatch[1])
    return found ? { status: 200, body: found } : { status: 404, body: { error: 'Evento não encontrado.' } }
  }
  if (path.startsWith('/api/parts/')) return { status: 404, body: { error: 'Peça não encontrada.' } }
  return { status: 404, body: { error: 'Endpoint não encontrado.' } }
}

export function installFetchMock() {
  const mock = jest.fn(async (input: unknown) => {
    const { status, body } = apiResponse(String(input))
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => typeof body === 'string' ? body : JSON.stringify(body),
    }
  })
  globalThis.fetch = mock as unknown as typeof fetch
  return mock
}
