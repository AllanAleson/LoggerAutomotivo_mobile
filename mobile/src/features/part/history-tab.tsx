import type { ReactNode } from 'react'

import type { EventPage } from '@/api/types'
import { AppText } from '@/components/app-text'
import { FailureCard } from '@/components/failure-card'
import { ScreenScroll } from '@/components/screen'
import { EmptyState, ErrorState, InlineError, LoadingState } from '@/components/state-view'
import { useApi } from '@/hooks/use-api'
import { plural } from '@/lib/format'

const HISTORY_SAMPLE = 100

export function HistoryTab({ pieceId, header, onRefreshPart, onOpenDiagnosis }: {
  pieceId: string
  header: ReactNode
  onRefreshPart: () => void
  onOpenDiagnosis: (eventId: string) => void
}) {
  // Mesmo critério do dashboard web: falhas entre os 100 eventos mais recentes.
  const { data, error, loading, refreshing, refresh } = useApi<EventPage>(`/api/parts/${encodeURIComponent(pieceId)}/events?limit=${HISTORY_SAMPLE}`)
  const failures = data?.items.filter(item => item.level !== 'INFO') ?? []

  return (
    <ScreenScroll bottomInset refreshing={refreshing} onRefresh={() => { refresh(); onRefreshPart() }}>
      {header}
      {loading ? <LoadingState />
        : !data ? <ErrorState message={error ?? ''} onRetry={refresh} />
          : !failures.length ? <EmptyState title="Nenhuma falha no histórico" message="Avisos, erros e eventos críticos dos registros mais recentes aparecem aqui." />
            : (
              <>
                {error ? <InlineError message={error} /> : null}
                <AppText variant="label">
                  {plural(failures.length, 'falha', 'falhas')} nos últimos {Math.min(HISTORY_SAMPLE, data.count)} eventos
                </AppText>
                {failures.map(event => (
                  <FailureCard key={event.id} event={event} showPiece={false} onPress={() => onOpenDiagnosis(event.id)} />
                ))}
              </>
            )}
    </ScreenScroll>
  )
}
