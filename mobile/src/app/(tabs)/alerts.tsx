import { useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'

import type { EventItem, ListResponse } from '@/api/types'
import { ChipGroup } from '@/components/chip'
import { FailureCard } from '@/components/failure-card'
import { PageIntro, ScreenScroll, screenStyles, UpdatedAt } from '@/components/screen'
import { EmptyState, ErrorState, InlineError, LoadingState } from '@/components/state-view'
import { colors, REFRESH_MS } from '@/constants/theme'
import { useApi } from '@/hooks/use-api'
import { openEventDiagnosis } from '@/lib/routes'

type AlertFilter = 'ALL' | 'CRITICAL' | 'ERROR' | 'WARNING'

const FILTER_LABELS: Record<AlertFilter, string> = { ALL: 'Todos', CRITICAL: 'Críticos', ERROR: 'Erros', WARNING: 'Avisos' }

export default function AlertsScreen() {
  const [filter, setFilter] = useState<AlertFilter>('ALL')
  const { data, error, loading, refreshing, refresh, updatedAt } = useApi<ListResponse<EventItem>>('/api/alerts', { refreshMs: REFRESH_MS })
  const intro = <PageIntro eyebrow="Triagem técnica" text="Ocorrências ordenadas por prioridade e data." />

  if (loading) return <ScreenScroll>{intro}<LoadingState /></ScreenScroll>
  if (!data) return <ScreenScroll onRefresh={refresh} refreshing={refreshing}>{intro}<ErrorState message={error ?? ''} onRetry={refresh} /></ScreenScroll>

  const count = (level: AlertFilter) => level === 'ALL' ? data.items.length : data.items.filter(item => item.level === level).length
  const options = (Object.keys(FILTER_LABELS) as AlertFilter[]).map(value => ({ value, label: `${FILTER_LABELS[value]} (${count(value)})` }))
  const visible = filter === 'ALL' ? data.items : data.items.filter(item => item.level === filter)

  return (
    <FlatList
      data={visible}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <FailureCard event={item} onPress={item.pieceId ? () => openEventDiagnosis(item) : undefined} />}
      style={styles.list}
      contentContainerStyle={screenStyles.listContent}
      ItemSeparatorComponent={Separator}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.blue} colors={[colors.blue]} />}
      ListHeaderComponent={(
        <View style={styles.header}>
          {intro}
          <ChipGroup options={options} value={filter} onChange={setFilter} />
          {error ? <InlineError message={error} /> : null}
        </View>
      )}
      ListEmptyComponent={<EmptyState title="Nenhum alerta" message="Não há ocorrências com essa severidade." />}
      ListFooterComponent={<View style={styles.footer}><UpdatedAt value={updatedAt} /></View>}
    />
  )
}

function Separator() {
  return <View style={styles.separator} />
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  header: { gap: 12, marginBottom: 4 },
  footer: { marginTop: 8 },
  separator: { height: 12 },
})
