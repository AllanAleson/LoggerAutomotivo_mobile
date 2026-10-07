import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText } from '@/components/app-text'

export function Fact({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <View style={styles.fact}>
      <AppText variant="label">{label}</AppText>
      {typeof value === 'string' || typeof value === 'number'
        ? <AppText variant={mono ? 'mono' : 'bodyStrong'} selectable>{value}</AppText>
        : value}
    </View>
  )
}

// Grade de duas colunas usada nos resumos da peça e na telemetria.
export function FactGrid({ children }: { children: ReactNode }) {
  return <View style={styles.grid}>{children}</View>
}

const styles = StyleSheet.create({
  fact: { width: '50%', paddingRight: 12, gap: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
})
