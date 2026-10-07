import { StyleSheet, View } from 'react-native'

import type { Part } from '@/api/types'
import { AppText } from '@/components/app-text'
import { Badge } from '@/components/badge'
import { Card } from '@/components/card'
import { Fact, FactGrid } from '@/components/fact'
import { SegmentedTabs } from '@/components/segmented-tabs'
import { InlineError } from '@/components/state-view'
import { colors } from '@/constants/theme'
import { formatDateTime, timeAgo } from '@/lib/format'
import { PART_TABS, type PartTab } from '@/lib/routes'

export function PartHeader({ part, tab, onSelectTab, error }: {
  part: Part
  tab: PartTab
  onSelectTab: (tab: PartTab) => void
  error: string | null
}) {
  const ago = timeAgo(part.lastSeen)
  return (
    <View style={styles.container}>
      {error ? <InlineError message={error} /> : null}
      <Card style={styles.card}>
        <View style={styles.title}>
          <View style={styles.flex}>
            <AppText variant="eyebrow">Detalhes da peça</AppText>
            <AppText variant="monoLarge" selectable>{part.pieceId}</AppText>
            <AppText variant="caption">{part.model}</AppText>
          </View>
          <Badge value={part.status} />
        </View>
        <View style={styles.facts}>
          <FactGrid>
            <Fact label="Número de série" value={part.serialNumber} />
            <Fact label="Logger associado" value={part.loggerId ?? 'Não associado'} />
            <Fact label="Veículo" value={part.vehicleIdentifier ?? '—'} />
            <Fact label="Última comunicação" value={`${formatDateTime(part.lastSeen)}${ago ? `\n${ago}` : ''}`} />
          </FactGrid>
        </View>
      </Card>
      <SegmentedTabs options={PART_TABS} value={tab} onChange={onSelectTab} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  card: { padding: 16, gap: 14 },
  title: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  flex: { flex: 1, gap: 2 },
  facts: { paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.line },
})
