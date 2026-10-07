import { router } from 'expo-router'

export type PartTab = 'overview' | 'log' | 'diagnosis' | 'history'

export const PART_TABS: { value: PartTab; label: string }[] = [
  { value: 'overview', label: 'Visão geral' },
  { value: 'log', label: 'Log' },
  { value: 'diagnosis', label: 'Diagnóstico' },
  { value: 'history', label: 'Histórico' },
]

export function parsePartTab(value: unknown): PartTab {
  return PART_TABS.some(tab => tab.value === value) ? value as PartTab : 'overview'
}

// Link para a tela da peça; eventId abre o diagnóstico de uma ocorrência específica.
export function partHref(pieceId: string, options: { tab?: PartTab; eventId?: string } = {}) {
  const params: Record<string, string> = { pieceId }
  if (options.tab) params.tab = options.tab
  if (options.eventId) params.eventId = options.eventId
  return { pathname: '/parts/[pieceId]', params } as const
}

export function openEventDiagnosis(event: { id: string; pieceId: string | null }) {
  if (event.pieceId) router.push(partHref(event.pieceId, { tab: 'diagnosis', eventId: event.id }))
}
