import { hostFromHostUri, normalizeApiUrl, resolveDefaultApiUrl } from '@/lib/api-url'
import { csvFileName, withBom } from '@/lib/csv'
import { buildEventParams, DEFAULT_EVENT_FILTERS, toQueryString } from '@/lib/event-query'
import { formatDateTime, formatVoltage, orDash, plural, textOr, timeAgo } from '@/lib/format'
import { parsePartTab, partHref } from '@/lib/routes'

describe('normalizeApiUrl', () => {
  it('aceita IP com porta e completa o esquema', () => {
    expect(normalizeApiUrl(' 192.168.0.10:3333 ')).toBe('http://192.168.0.10:3333')
    expect(normalizeApiUrl('HTTP://Servidor.local:3333/')).toBe('http://Servidor.local:3333')
    expect(normalizeApiUrl('https://api.exemplo.com/logger/')).toBe('https://api.exemplo.com/logger')
  })

  it('rejeita valores que não são URLs HTTP utilizáveis', () => {
    expect(normalizeApiUrl('')).toBeNull()
    expect(normalizeApiUrl('ftp://192.168.0.10')).toBeNull()
    expect(normalizeApiUrl('http://host:99999')).toBeNull()
    expect(normalizeApiUrl('http://host com espaço')).toBeNull()
  })
})

describe('resolveDefaultApiUrl', () => {
  it('prioriza EXPO_PUBLIC_API_URL', () => {
    expect(resolveDefaultApiUrl({ envUrl: '10.0.0.5:3333', hostUri: '192.168.0.2:8081', platform: 'android' })).toBe('http://10.0.0.5:3333')
  })

  it('usa o IP do computador que serve o bundle do Expo', () => {
    expect(resolveDefaultApiUrl({ hostUri: '192.168.0.2:8081', platform: 'android', isDevice: true })).toBe('http://192.168.0.2:3333')
    expect(resolveDefaultApiUrl({ hostUri: '192.168.0.2:8081', platform: 'ios', isDevice: true })).toBe('http://192.168.0.2:3333')
  })

  it('usa 10.0.2.2 no emulador Android quando o bundle vem do localhost', () => {
    expect(resolveDefaultApiUrl({ hostUri: '127.0.0.1:8081', platform: 'android', isDevice: false })).toBe('http://10.0.2.2:3333')
    expect(resolveDefaultApiUrl({ hostUri: null, platform: 'android', isDevice: false })).toBe('http://10.0.2.2:3333')
  })

  it('ignora túneis do Expo, que não expõem a porta da API', () => {
    expect(resolveDefaultApiUrl({ hostUri: 'abc-anonymous-8081.exp.direct', platform: 'ios', isDevice: true })).toBe('http://localhost:3333')
  })

  it('no navegador usa o mesmo host da página', () => {
    expect(resolveDefaultApiUrl({ platform: 'web', webHostname: 'localhost' })).toBe('http://localhost:3333')
  })

  it('extrai o host de hostUri, inclusive IPv6', () => {
    expect(hostFromHostUri('exp://192.168.1.4:8081/--/x')).toBe('192.168.1.4')
    expect(hostFromHostUri('[::1]:8081')).toBe('[::1]')
    expect(hostFromHostUri(undefined)).toBeNull()
  })
})

describe('buildEventParams', () => {
  const now = Date.parse('2026-10-07T12:00:00.000Z')

  it('converte períodos relativos em startDate no momento da consulta', () => {
    expect(buildEventParams({ ...DEFAULT_EVENT_FILTERS, period: '1h' }, now)).toEqual({ startDate: '2026-10-07T11:00:00.000Z' })
    expect(buildEventParams({ ...DEFAULT_EVENT_FILTERS, period: '7d' }, now)).toEqual({ startDate: '2026-09-30T12:00:00.000Z' })
    expect(buildEventParams({ ...DEFAULT_EVENT_FILTERS, period: 'all' }, now)).toEqual({})
  })

  it('inclui severidade, evento e intervalo personalizado', () => {
    const start = new Date('2026-10-01T10:00:00.000Z')
    const end = new Date('2026-10-02T10:00:00.000Z')
    expect(buildEventParams({ period: 'custom', level: 'ERROR', event: ' timeout ', start, end }, now)).toEqual({
      level: 'ERROR',
      event: 'timeout',
      startDate: '2026-10-01T10:00:00.000Z',
      endDate: '2026-10-02T10:00:00.000Z',
    })
  })

  it('monta a query string sem valores vazios', () => {
    expect(toQueryString({ search: 'PT 01&x', page: 2, level: '', limit: undefined })).toBe('?search=PT%2001%26x&page=2')
    expect(toQueryString({})).toBe('')
  })
})

describe('formatação', () => {
  it('formata data e hora no padrão brasileiro', () => {
    const local = new Date(2026, 8, 9, 8, 5, 3)
    expect(formatDateTime(local.toISOString())).toBe('09/09/2026 08:05:03')
    expect(formatDateTime(null)).toBe('Sem comunicação')
    expect(formatDateTime('data inválida', '—')).toBe('—')
  })

  it('descreve há quanto tempo houve comunicação', () => {
    const now = Date.parse('2026-10-07T12:00:00Z')
    expect(timeAgo('2026-10-07T11:59:50Z', now)).toBe('agora')
    expect(timeAgo('2026-10-07T11:58:00Z', now)).toBe('há 2 min')
    expect(timeAgo('2026-10-07T09:00:00Z', now)).toBe('há 3 h')
    expect(timeAgo('2026-10-06T12:00:00Z', now)).toBe('há 1 dia')
  })

  it('formata tensão e plural', () => {
    expect(formatVoltage(12.4)).toBe('12,4 V')
    expect(formatVoltage(null)).toBe('—')
    expect(plural(1, 'registro', 'registros')).toBe('1 registro')
    expect(plural(3, 'registro', 'registros')).toBe('3 registros')
  })
})

describe('CSV e rotas', () => {
  it('gera nome de arquivo seguro e preserva o BOM do Excel', () => {
    expect(csvFileName('PT-00018429')).toBe('PT-00018429-eventos.csv')
    expect(csvFileName('PT/01 x')).toBe('PT_01_x-eventos.csv')
    expect(withBom('a,b')).toBe('﻿a,b')
    expect(withBom('﻿a,b')).toBe('﻿a,b')
  })

  it('monta links da peça e valida a aba', () => {
    expect(partHref('PT-1', { tab: 'diagnosis', eventId: 'e1' })).toEqual({ pathname: '/parts/[pieceId]', params: { pieceId: 'PT-1', tab: 'diagnosis', eventId: 'e1' } })
    expect(parsePartTab('log')).toBe('log')
    expect(parsePartTab('qualquer')).toBe('overview')
  })
})

describe('campos vazios enviados pelo firmware', () => {
  it('trata string vazia como valor ausente', () => {
    expect(textOr('', 'Não informado')).toBe('Não informado')
    expect(textOr('   ', 'Não informado')).toBe('Não informado')
    expect(textOr(null, 'Não informado')).toBe('Não informado')
    expect(textOr('HIGH', 'Não informado')).toBe('HIGH')
    expect(orDash('')).toBe('—')
    expect(orDash(0)).toBe('0')
  })
})
