import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { errorMessage, isAbortError, requestJson, requestText } from '@/api/client'
import { useApiConfig } from '@/api/config'
import { LEVELS, type EventItem, type EventPage, type Level, type Timeline, type TimelineBucket } from '@/api/types'
import { AppText } from '@/components/app-text'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Card } from '@/components/card'
import { ChipGroup } from '@/components/chip'
import { DateTimeField } from '@/components/date-time-field'
import { CloudDownload, Search, SlidersHorizontal } from '@/components/icons'
import { OscillationChart } from '@/components/oscillation-chart'
import { screenStyles } from '@/components/screen'
import { EmptyState, ErrorState, InlineError, LoadingState } from '@/components/state-view'
import { colors, fonts, radius, shadow } from '@/constants/theme'
import { useApi } from '@/hooks/use-api'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { buildEventParams, DEFAULT_EVENT_FILTERS, PERIOD_OPTIONS, toQueryString, type EventFilters } from '@/lib/event-query'
import { formatDateTime, orDash, plural } from '@/lib/format'
import { shareCsv } from '@/lib/share-csv'
import { utcOffsetMinutes } from '@/lib/timeline'

const PAGE_SIZE = 25
const LEVEL_OPTIONS: { value: Level | ''; label: string }[] = [{ value: '', label: 'Todas' }, ...LEVELS.map(level => ({ value: level, label: level }))]

type LoadMode = 'initial' | 'refresh' | 'more'

interface LogResult {
  key: string | null
  items: EventItem[]
  count: number
  page: number
  error: string | null
}

const EMPTY_RESULT: LogResult = { key: null, items: [], count: 0, page: 0, error: null }

function mergeUnique(current: EventItem[], next: EventItem[]) {
  const seen = new Set(current.map(item => item.id))
  return [...current, ...next.filter(item => !seen.has(item.id))]
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniFact}>
      <AppText variant="label">{label}</AppText>
      <AppText variant="mono" numberOfLines={2} style={styles.miniFactValue}>{value}</AppText>
    </View>
  )
}

function LogEventCard({ event, onPress }: { event: EventItem; onPress: () => void }) {
  const resultStyle = event.result === 'FAIL' ? styles.resultFail : event.result === 'OK' ? styles.resultOk : styles.resultOther
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.level} ${event.event}, ${formatDateTime(event.timestamp)}. Ver diagnóstico`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.row}>
        <AppText variant="mono" style={styles.time}>{formatDateTime(event.timestamp)}</AppText>
        <Badge value={event.level} />
      </View>
      <View style={styles.row}>
        <AppText variant="bodyStrong" style={styles.flex}>{event.event}</AppText>
        {event.result ? <AppText style={[styles.result, resultStyle]}>{event.result}</AppText> : null}
      </View>
      <View style={styles.miniFacts}>
        <MiniFact label="Sinal" value={orDash(event.signal)} />
        <MiniFact label="Esperado" value={orDash(event.expected)} />
        <MiniFact label="Recebido" value={orDash(event.received)} />
      </View>
      {event.possibleCause ? <AppText variant="caption">{event.possibleCause}</AppText> : null}
    </Pressable>
  )
}

export function LogTab({ pieceId, header, onRefreshPart, onOpenDiagnosis }: {
  pieceId: string
  header: ReactNode
  onRefreshPart: () => void
  onOpenDiagnosis: (eventId: string) => void
}) {
  const { baseUrl } = useApiConfig()
  const insets = useSafeAreaInsets()
  const [filters, setFilters] = useState<EventFilters>(DEFAULT_EVENT_FILTERS)
  const [eventText, setEventText] = useState('')
  const event = useDebouncedValue(eventText, 400)
  const [result, setResult] = useState<LogResult>(EMPTY_RESULT)
  const [busy, setBusy] = useState<Exclude<LoadMode, 'initial'> | null>(null)
  const [moreFailed, setMoreFailed] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  const basePath = `/api/parts/${encodeURIComponent(pieceId)}/events`
  const { period, level, start, end } = filters
  // Instante de referência dos períodos relativos do gráfico; avança a cada atualização.
  const [anchor, setAnchor] = useState(() => Date.now())
  const timelinePath = useMemo(() => `/api/events/timeline${toQueryString({
    ...buildEventParams({ period, level, event, start, end }, anchor),
    pieceId,
    utcOffset: utcOffsetMinutes(),
  })}`, [anchor, end, event, level, period, pieceId, start])
  const timeline = useApi<Timeline>(timelinePath, { keepPrevious: true })
  // Identifica a consulta atual; enquanto o resultado não for desta chave, a lista está carregando.
  const queryKey = JSON.stringify([baseUrl, basePath, period, level, event, start?.getTime() ?? null, end?.getTime() ?? null])

  // O estado só muda nos callbacks da resposta; ações do usuário marcam "busy" antes de chamar.
  const fetchPage = useCallback((nextPage: number, loadMode: LoadMode) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    const params = buildEventParams({ period, level, event, start, end })
    requestJson<EventPage>(baseUrl, `${basePath}${toQueryString({ ...params, limit: PAGE_SIZE, page: nextPage })}`, { signal: controller.signal })
      .then(page => {
        if (controller.signal.aborted) return
        setResult(current => ({
          key: queryKey,
          items: nextPage === 1 || current.key !== queryKey ? page.items : mergeUnique(current.items, page.items),
          count: page.count,
          page: nextPage,
          error: null,
        }))
        setMoreFailed(false)
      }, (loadError: unknown) => {
        if (controller.signal.aborted || isAbortError(loadError)) return
        const message = errorMessage(loadError)
        if (loadMode === 'more') setMoreFailed(true)
        setResult(current => loadMode === 'initial' || current.key !== queryKey
          ? { ...EMPTY_RESULT, key: queryKey, error: message }
          : { ...current, error: message })
      })
      .finally(() => { if (controllerRef.current === controller) setBusy(null) })
  }, [baseUrl, basePath, end, event, level, period, queryKey, start])

  useEffect(() => {
    fetchPage(1, 'initial')
    return () => controllerRef.current?.abort()
  }, [fetchPage])

  const initialLoading = result.key !== queryKey
  const { items, count, page, error } = initialLoading ? EMPTY_RESULT : result
  const hasMore = items.length < count

  const load = (nextPage: number, loadMode: Exclude<LoadMode, 'initial'>) => {
    setBusy(loadMode)
    setMoreFailed(false)
    fetchPage(nextPage, loadMode)
  }
  const loadMore = () => { if (!initialLoading && !busy && hasMore && !moreFailed && !error) load(page + 1, 'more') }
  const refresh = () => { load(1, 'refresh'); setAnchor(Date.now()); onRefreshPart() }
  // Toque no gráfico: o intervalo da coluna vira o período personalizado do log.
  const applyRange = (bucket: TimelineBucket) => updateFilters({ period: 'custom', start: new Date(bucket.start), end: new Date(bucket.end) })

  const exportCsv = async () => {
    setExporting(true)
    setExportError(null)
    try {
      const query = toQueryString(buildEventParams({ period, level, event, start, end }))
      const csv = await requestText(baseUrl, `${basePath}/export${query}`, { timeoutMs: 30_000 })
      await shareCsv(pieceId, csv)
    } catch (shareError) {
      setExportError(errorMessage(shareError))
    } finally {
      setExporting(false)
    }
  }

  const updateFilters = (patch: Partial<EventFilters>) => setFilters(current => ({ ...current, ...patch }))
  const failedInitial = !initialLoading && error !== null && items.length === 0

  const listHeader = (
    <View style={styles.header}>
      {header}
      <Card>
        <View style={styles.filterHead}>
          <SlidersHorizontal size={20} color="#2879d8" />
          <View style={styles.flex}>
            <AppText variant="heading">Consulta de eventos</AppText>
            <AppText variant="caption">Filtre o período e a severidade dos registros.</AppText>
          </View>
        </View>
        <View style={styles.filterBody}>
          <AppText variant="label">Período</AppText>
          <ChipGroup options={PERIOD_OPTIONS} value={period} onChange={value => updateFilters({ period: value })} />
          {period === 'custom' ? (
            <View style={styles.dateRow}>
              <DateTimeField label="Início" value={start} maximumDate={end ?? undefined} onChange={value => updateFilters({ start: value })} />
              <DateTimeField label="Fim" value={end} minimumDate={start ?? undefined} onChange={value => updateFilters({ end: value })} />
            </View>
          ) : null}
          <AppText variant="label">Severidade</AppText>
          <ChipGroup options={LEVEL_OPTIONS} value={level} onChange={value => updateFilters({ level: value })} />
          <AppText variant="label">Evento</AppText>
          <View style={styles.searchField}>
            <Search size={16} color={colors.subtle} />
            <TextInput
              value={eventText}
              onChangeText={setEventText}
              placeholder="Ex.: TIMEOUT"
              placeholderTextColor={colors.subtle}
              accessibilityLabel="Filtrar por nome do evento"
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
              style={styles.searchInput}
            />
          </View>
          <Button title="Exportar CSV" icon={CloudDownload} variant="secondary" loading={exporting} onPress={exportCsv} />
          {exportError ? <AppText variant="caption" color={colors.red}>Não foi possível exportar: {exportError}</AppText> : null}
        </View>
      </Card>
      {timeline.data ? (
        <OscillationChart timeline={timeline.data} title="Gráfico de verificações" loading={timeline.loading} onApplyRange={applyRange} />
      ) : timeline.error ? <InlineError message={`Gráfico indisponível: ${timeline.error}`} /> : null}
      {!initialLoading && !failedInitial ? (
        <View style={styles.summary}>
          <AppText variant="bodyStrong">{plural(count, 'registro', 'registros')}</AppText>
          {count > 0 ? <AppText variant="caption">Exibindo {items.length} de {count}</AppText> : null}
        </View>
      ) : null}
      {error && !failedInitial && !moreFailed ? <InlineError message={error} /> : null}
    </View>
  )

  return (
    <FlatList
      data={initialLoading || failedInitial ? [] : items}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <LogEventCard event={item} onPress={() => onOpenDiagnosis(item.id)} />}
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={initialLoading ? <LoadingState />
        : failedInitial ? <ErrorState message={error ?? ''} onRetry={() => load(1, 'refresh')} />
          : <EmptyState />}
      ListFooterComponent={(
        <View style={styles.footer}>
          {busy === 'more' ? <ActivityIndicator color={colors.blue} />
            : moreFailed ? <Button title="Tentar carregar mais" variant="secondary" onPress={() => load(page + 1, 'more')} />
              : items.length > 0 && !hasMore ? <AppText variant="caption" style={styles.center}>Fim dos registros</AppText>
                : null}
        </View>
      )}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      refreshControl={<RefreshControl refreshing={busy === 'refresh'} onRefresh={refresh} tintColor={colors.blue} colors={[colors.blue]} />}
      style={styles.list}
      contentContainerStyle={[screenStyles.listContent, { paddingBottom: 32 + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  )
}

function Separator() {
  return <View style={styles.separator} />
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  header: { gap: 14, marginBottom: 4 },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  filterHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.line },
  filterBody: { padding: 16, gap: 10 },
  dateRow: { gap: 10 },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#d6dce3',
    borderRadius: radius.md,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  searchInput: { flex: 1, minHeight: 42, fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  summary: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  footer: { paddingVertical: 12, minHeight: 24 },
  separator: { height: 10 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: 14,
    gap: 8,
    ...shadow,
  },
  pressed: { opacity: 0.85 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  time: { fontSize: 12, color: colors.muted },
  result: { fontFamily: fonts.bold, fontSize: 12 },
  resultFail: { color: colors.red },
  resultOk: { color: colors.green },
  resultOther: { color: colors.amber },
  miniFacts: { flexDirection: 'row', gap: 12, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 10 },
  miniFact: { flex: 1, gap: 3 },
  miniFactValue: { fontSize: 12, lineHeight: 16 },
})
