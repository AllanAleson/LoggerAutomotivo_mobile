import type { ReactNode } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import type { EventPage, Part } from '@/api/types'
import { AppText } from '@/components/app-text'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Card, CardHeader } from '@/components/card'
import { EventList } from '@/components/event-list'
import { Fact, FactGrid } from '@/components/fact'
import { CircleGauge, TriangleAlert } from '@/components/icons'
import { ScreenScroll } from '@/components/screen'
import { colors, radius, REFRESH_MS } from '@/constants/theme'
import { useApi } from '@/hooks/use-api'
import { formatDateTime, formatVoltage, orDash } from '@/lib/format'

export function OverviewTab({ part, header, onRefreshPart, onOpenDiagnosis }: {
  part: Part
  header: ReactNode
  onRefreshPart: () => void
  onOpenDiagnosis: (eventId: string) => void
}) {
  const events = useApi<EventPage>(`/api/parts/${encodeURIComponent(part.pieceId)}/events?limit=6`, { refreshMs: REFRESH_MS })
  const latest = part.latestFailure
  const refresh = () => { events.refresh(); onRefreshPart() }

  return (
    <ScreenScroll bottomInset refreshing={events.refreshing} onRefresh={refresh}>
      {header}

      <Card>
        <CardHeader title="Estado operacional" subtitle="Telemetria mais recente do Logger." right={<CircleGauge size={20} color="#788493" />} />
        <View style={styles.body}>
          <FactGrid>
            <Fact label="Logger" value={part.loggerId ?? '—'} mono />
            <Fact label="Firmware" value={orDash(part.firmwareVersion)} />
            <Fact label="Tensão reportada" value={formatVoltage(part.batteryVoltage)} />
            <Fact label="Eventos pendentes" value={String(part.pendingEvents ?? 0)} />
            <Fact label="Comunicação" value={orDash(part.communicationMode)} />
            <Fact label="Última falha" value={latest ? formatDateTime(latest.timestamp) : 'Nenhuma'} />
          </FactGrid>
        </View>
      </Card>

      <Card>
        <CardHeader title="Última falha" subtitle="Ocorrência relevante mais recente." right={<TriangleAlert size={20} color="#788493" />} />
        {latest ? (
          <View style={styles.body}>
            <Badge value={latest.level} />
            <AppText variant="heading">{latest.event}</AppText>
            {latest.possibleCause ? <AppText variant="body">{latest.possibleCause}</AppText> : null}
            <View style={styles.compare}>
              <Fact label="Esperado" value={orDash(latest.expected)} mono />
              <Fact label="Recebido" value={orDash(latest.received)} mono />
            </View>
            <Button title="Ver diagnóstico" variant="secondary" onPress={() => onOpenDiagnosis(latest.id)} />
          </View>
        ) : <AppText style={styles.empty}>Nenhuma falha registrada.</AppText>}
      </Card>

      <Card>
        <CardHeader title="Últimos sinais e ocorrências" subtitle="Amostra dos eventos mais recentes." />
        {events.loading ? <ActivityIndicator color={colors.blue} style={styles.loading} />
          : !events.data ? <AppText style={[styles.empty, styles.error]}>{events.error}</AppText>
            : events.data.items.length
              ? <EventList events={events.data.items} onPressEvent={event => onOpenDiagnosis(event.id)} />
              : <AppText style={styles.empty}>Nenhum evento registrado.</AppText>}
      </Card>
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 10 },
  compare: { flexDirection: 'row', backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 12 },
  empty: { padding: 28, textAlign: 'center', color: colors.muted },
  error: { color: colors.red },
  loading: { padding: 28 },
})
