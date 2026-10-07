import { Pressable, StyleSheet, View } from 'react-native'

import type { EventItem } from '@/api/types'
import { AppText } from '@/components/app-text'
import { Badge } from '@/components/badge'
import { ChevronRight } from '@/components/icons'
import { colors, fonts, radius, shadow } from '@/constants/theme'
import { formatDateTime, textOr } from '@/lib/format'

// Cartão de ocorrência usado em Alertas e no Histórico da peça.
export function FailureCard({ event, onPress, showPiece = true }: { event: EventItem; onPress?: () => void; showPiece?: boolean }) {
  const failed = event.result === 'FAIL'
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${event.level} ${event.event}, ${formatDateTime(event.timestamp)}${onPress ? '. Ver diagnóstico' : ''}`}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.row}>
        <Badge value={event.level} />
        <AppText variant="caption">{formatDateTime(event.timestamp)}</AppText>
      </View>
      <AppText variant="bodyStrong">{event.event}</AppText>
      <AppText variant="body">{textOr(event.possibleCause, 'Possível causa não informada.')}</AppText>
      <View style={styles.row}>
        <AppText variant="caption" style={styles.flex}>
          {showPiece ? `Peça ${event.pieceId ?? 'não associada'} · ${event.loggerId}` : `Logger ${event.loggerId}`}
        </AppText>
        <AppText style={[styles.result, failed && styles.resultFail]}>{textOr(event.result, 'REGISTRADO')}</AppText>
      </View>
      {onPress ? (
        <View style={styles.link}>
          <AppText style={styles.linkText}>Ver diagnóstico</AppText>
          <ChevronRight size={16} color={colors.blue} />
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: 16,
    gap: 8,
    ...shadow,
  },
  pressed: { opacity: 0.85 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  flex: { flex: 1 },
  result: { fontFamily: fonts.bold, fontSize: 12, color: colors.muted },
  resultFail: { color: colors.red },
  link: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  linkText: { fontFamily: fonts.bold, fontSize: 13, color: colors.blue },
})
