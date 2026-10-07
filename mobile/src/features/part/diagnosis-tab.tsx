import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import type { DiagnosisResponse, EventItem } from '@/api/types'
import { AppText } from '@/components/app-text'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Card } from '@/components/card'
import { Info, ShieldAlert } from '@/components/icons'
import { ScreenScroll } from '@/components/screen'
import { EmptyState, ErrorState, LoadingState } from '@/components/state-view'
import { colors, fonts, radius, REFRESH_MS } from '@/constants/theme'
import { useApi } from '@/hooks/use-api'
import { formatDateTime, textOr } from '@/lib/format'

function CompareCell({ label, value }: { label: string; value: string | null }) {
  const informed = textOr(value, '') !== ''
  return (
    <View style={styles.compareCell}>
      <AppText variant="label">{label}</AppText>
      {informed
        ? <AppText style={styles.compareValue} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6}>{value}</AppText>
        : <AppText style={styles.compareMissing}>Não informado</AppText>}
    </View>
  )
}

function DiagnosisCard({ event }: { event: EventItem }) {
  const isFailure = event.level !== 'INFO'
  return (
    <Card>
      <View style={styles.head}>
        <View style={[styles.headIcon, !isFailure && styles.headIconInfo]}>
          {isFailure ? <ShieldAlert size={24} color={colors.onDark} /> : <Info size={24} color={colors.onDark} />}
        </View>
        <View style={styles.flex}>
          <AppText style={[styles.headLabel, !isFailure && styles.headLabelInfo]}>{isFailure ? 'FALHA DETECTADA' : 'EVENTO REGISTRADO'}</AppText>
          <AppText style={styles.headTitle} selectable>{event.event}</AppText>
          <AppText variant="caption" color="#b6c1ce">{formatDateTime(event.timestamp)} · Sinal {textOr(event.signal, 'não informado')}</AppText>
        </View>
        <Badge value={event.level} />
      </View>

      <View style={styles.compare}>
        <CompareCell label="Esperado" value={event.expected} />
        <View style={styles.versus}><AppText style={styles.versusText}>×</AppText></View>
        <CompareCell label="Recebido" value={event.received} />
      </View>

      <View style={styles.block}>
        <AppText variant="label">Possível causa</AppText>
        <AppText variant="body" style={styles.blockText}>{textOr(event.possibleCause, 'Os dados disponíveis ainda não permitem sugerir uma causa.')}</AppText>
      </View>

      <View style={styles.block}>
        <AppText variant="label">Evidências</AppText>
        {event.evidence.length ? event.evidence.map((item, index) => (
          <View key={index} style={styles.evidence}>
            <View style={styles.evidenceIndex}><AppText style={styles.evidenceIndexText}>{index + 1}</AppText></View>
            <AppText variant="body" style={styles.flex}>{item}</AppText>
          </View>
        )) : <AppText variant="body" style={styles.blockText}>Nenhuma evidência adicional registrada.</AppText>}
      </View>

      <View style={styles.block}>
        <AppText variant="label">Resultado</AppText>
        <AppText style={[styles.result, event.result === 'FAIL' && styles.resultFail]}>{textOr(event.result, 'REGISTRADO')} · Logger {event.loggerId}</AppText>
      </View>

      <View style={styles.note}>
        <Info size={15} color="#78551f" />
        <AppText variant="caption" color="#78551f" style={styles.flex}>
          Esta análise apresenta possibilidades baseadas nos sinais registrados. Confirme a causa com inspeção técnica.
        </AppText>
      </View>
    </Card>
  )
}

export function DiagnosisTab({ pieceId, eventId, header, onRefreshPart, onShowMostRelevant }: {
  pieceId: string
  eventId: string | null
  header: ReactNode
  onRefreshPart: () => void
  onShowMostRelevant: () => void
}) {
  // Sem eventId: falha mais relevante (CRITICAL > ERROR > WARNING, mais recente).
  const relevant = useApi<DiagnosisResponse>(eventId ? null : `/api/parts/${encodeURIComponent(pieceId)}/diagnosis`, { refreshMs: REFRESH_MS })
  const selected = useApi<EventItem>(eventId ? `/api/events/${encodeURIComponent(eventId)}` : null)
  const source = eventId ? selected : relevant
  const diagnosis = eventId ? selected.data : relevant.data?.diagnosis ?? null
  const refresh = () => { source.refresh(); onRefreshPart() }

  return (
    <ScreenScroll bottomInset refreshing={source.refreshing} onRefresh={refresh}>
      {header}
      {eventId ? (
        <View style={styles.banner}>
          <Info size={16} color={colors.blueText} />
          <AppText variant="caption" color={colors.blueText} style={styles.flex}>Exibindo a ocorrência selecionada.</AppText>
          <Button title="Ver a mais relevante" variant="ghost" onPress={onShowMostRelevant} />
        </View>
      ) : null}
      {source.loading ? <LoadingState />
        : !source.data ? <ErrorState message={source.error ?? ''} onRetry={source.refresh} />
          : !diagnosis ? <EmptyState title="Nenhuma falha registrada" message="Quando o Logger reportar avisos, erros ou eventos críticos, o diagnóstico aparecerá aqui." />
            : <DiagnosisCard event={diagnosis} />}
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { backgroundColor: colors.navy2, flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 18 },
  headIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: '#b42e3a', alignItems: 'center', justifyContent: 'center' },
  headIconInfo: { backgroundColor: colors.blue },
  headLabel: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.3, color: '#ffadb4' },
  headLabelInfo: { color: '#9cc7f7' },
  headTitle: { fontFamily: fonts.bold, fontSize: 19, lineHeight: 24, color: colors.onDark, marginVertical: 3 },
  compare: { flexDirection: 'row', margin: 16, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, overflow: 'hidden' },
  compareCell: { flex: 1, padding: 14, gap: 6 },
  compareValue: { fontFamily: fonts.monoBold, fontSize: 18, lineHeight: 24, color: colors.textStrong },
  compareMissing: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 24, color: colors.subtle },
  versus: { width: 36, backgroundColor: '#f1f3f6', alignItems: 'center', justifyContent: 'center' },
  versusText: { fontSize: 22, color: '#9aa4b1' },
  block: { marginHorizontal: 16, paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.line, gap: 8 },
  blockText: { lineHeight: 21 },
  evidence: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  evidenceIndex: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  evidenceIndexText: { fontFamily: fonts.bold, fontSize: 10, color: '#176dcc' },
  result: { fontFamily: fonts.bold, fontSize: 13, color: colors.green },
  resultFail: { color: colors.red },
  note: {
    flexDirection: 'row',
    gap: 8,
    margin: 16,
    marginTop: 0,
    backgroundColor: '#fff7e7',
    borderWidth: 1,
    borderColor: '#efdbad',
    borderRadius: radius.md,
    padding: 12,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.blueSoft,
    borderRadius: radius.md,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 4,
  },
})
