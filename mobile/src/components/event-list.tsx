import { Pressable, StyleSheet, View } from 'react-native'

import type { EventItem } from '@/api/types'
import { AppText } from '@/components/app-text'
import { Badge } from '@/components/badge'
import { ChevronRight } from '@/components/icons'
import { colors } from '@/constants/theme'
import { formatDateTime, textOr } from '@/lib/format'

export function eventSummary(event: EventItem) {
  if (event.possibleCause) return event.possibleCause
  return `Sinal ${textOr(event.signal, 'não informado')}${event.received?.trim() ? ` · recebido ${event.received}` : ''}`
}

export function EventRow({ event, onPress, divider = false }: { event: EventItem; onPress?: () => void; divider?: boolean }) {
  const body = (
    <>
      <View style={styles.main}>
        <View style={styles.top}>
          <Badge value={event.level} />
          <AppText variant="caption">{formatDateTime(event.timestamp)}</AppText>
        </View>
        <AppText variant="bodyStrong">{event.event}</AppText>
        <AppText variant="caption">{event.pieceId ?? 'Peça não associada'} · {event.loggerId}</AppText>
        <AppText variant="body" numberOfLines={3}>{eventSummary(event)}</AppText>
      </View>
      {onPress ? <ChevronRight size={18} color="#7b8796" /> : null}
    </>
  )
  if (!onPress) return <View style={[styles.row, divider && styles.divider]}>{body}</View>
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.level} ${event.event}, ${formatDateTime(event.timestamp)}. Ver diagnóstico`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.pressed]}>
      {body}
    </Pressable>
  )
}

// Lista de eventos dentro de um Card, separados por linhas finas como no dashboard web.
export function EventList({ events, onPressEvent }: { events: EventItem[]; onPressEvent?: (event: EventItem) => void }) {
  return (
    <View>
      {events.map((event, index) => (
        <EventRow
          key={event.id}
          event={event}
          divider={index > 0}
          onPress={onPressEvent && event.pieceId ? () => onPressEvent(event) : undefined}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: colors.lineSoft },
  pressed: { backgroundColor: '#f5f7fa' },
  main: { flex: 1, gap: 4 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 },
})
