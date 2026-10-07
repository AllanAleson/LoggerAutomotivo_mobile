import { router } from 'expo-router'
import { StyleSheet, View } from 'react-native'

import type { Part } from '@/api/types'
import { AppText } from '@/components/app-text'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Card } from '@/components/card'
import { Fact, FactGrid } from '@/components/fact'
import { ChevronRight, Wrench } from '@/components/icons'
import { colors, radius } from '@/constants/theme'
import { formatDateTime } from '@/lib/format'
import { partHref } from '@/lib/routes'

export function PartResultCard({ part }: { part: Part }) {
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.icon}><Wrench size={22} color={colors.blueText} /></View>
        <View style={styles.title}>
          <AppText variant="label">ID da peça</AppText>
          <AppText variant="monoLarge" style={styles.pieceId} selectable>{part.pieceId}</AppText>
          <AppText variant="caption">{part.model}</AppText>
        </View>
        <Badge value={part.status} />
      </View>
      <View style={styles.facts}>
        <FactGrid>
          <Fact label="Número de série" value={part.serialNumber} />
          <Fact label="Logger associado" value={part.loggerId ?? 'Não associado'} />
          <Fact label="Última comunicação" value={formatDateTime(part.lastSeen)} />
          <Fact label="Última falha" value={part.latestFailure ? formatDateTime(part.latestFailure.timestamp) : 'Nenhuma registrada'} />
        </FactGrid>
      </View>
      <Button
        title="Abrir dispositivo"
        icon={ChevronRight}
        accessibilityLabel={`Abrir dispositivo ${part.pieceId}`}
        onPress={() => router.push(partHref(part.pieceId))}
      />
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 14, borderLeftWidth: 4, borderLeftColor: colors.blue },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, gap: 2 },
  pieceId: { fontSize: 19, lineHeight: 24 },
  facts: { paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line },
})
