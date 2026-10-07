import { router, Stack, useLocalSearchParams } from 'expo-router'

import type { Part } from '@/api/types'
import { ScreenScroll } from '@/components/screen'
import { ErrorState, LoadingState } from '@/components/state-view'
import { REFRESH_MS } from '@/constants/theme'
import { DiagnosisTab } from '@/features/part/diagnosis-tab'
import { HistoryTab } from '@/features/part/history-tab'
import { LogTab } from '@/features/part/log-tab'
import { OverviewTab } from '@/features/part/overview-tab'
import { PartHeader } from '@/features/part/part-header'
import { useApi } from '@/hooks/use-api'
import { parsePartTab, type PartTab } from '@/lib/routes'

export default function PartScreen() {
  const params = useLocalSearchParams<{ pieceId: string; tab?: string; eventId?: string }>()
  const pieceId = String(params.pieceId ?? '')
  const tab = parsePartTab(params.tab)
  const eventId = typeof params.eventId === 'string' && params.eventId ? params.eventId : null
  const part = useApi<Part>(`/api/parts/${encodeURIComponent(pieceId)}`, { refreshMs: REFRESH_MS })

  // A aba fica na URL (?tab=...&eventId=...), como no dashboard web; links de
  // alertas e do histórico abrem o diagnóstico de uma ocorrência específica.
  const selectTab = (next: PartTab) => router.setParams({ tab: next, eventId: undefined })
  const openDiagnosis = (id: string) => router.setParams({ tab: 'diagnosis', eventId: id })

  const title = <Stack.Screen options={{ title: pieceId || 'Peça' }} />

  if (part.loading) return <>{title}<ScreenScroll bottomInset><LoadingState /></ScreenScroll></>
  if (!part.data) {
    return (
      <>
        {title}
        <ScreenScroll bottomInset refreshing={part.refreshing} onRefresh={part.refresh}>
          <ErrorState message={part.error ?? ''} onRetry={part.refresh} />
        </ScreenScroll>
      </>
    )
  }

  const header = <PartHeader part={part.data} tab={tab} onSelectTab={selectTab} error={part.error} />
  const common = { header, onRefreshPart: part.refresh }

  return (
    <>
      {title}
      {tab === 'log' ? <LogTab pieceId={pieceId} onOpenDiagnosis={openDiagnosis} {...common} />
        : tab === 'diagnosis' ? <DiagnosisTab pieceId={pieceId} eventId={eventId} onShowMostRelevant={() => router.setParams({ eventId: undefined })} {...common} />
          : tab === 'history' ? <HistoryTab pieceId={pieceId} onOpenDiagnosis={openDiagnosis} {...common} />
            : <OverviewTab part={part.data} onOpenDiagnosis={openDiagnosis} {...common} />}
    </>
  )
}
