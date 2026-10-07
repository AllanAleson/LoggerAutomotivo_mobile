import { Children, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText } from '@/components/app-text'
import type { LucideIcon } from '@/components/icons'
import { colors, radius, shadow } from '@/constants/theme'

const TONES = {
  green: { accent: colors.green, icon: colors.green, soft: colors.greenSoft },
  neutral: { accent: '#9ba5b1', icon: '#536174', soft: '#f0f3f6' },
  red: { accent: colors.red, icon: colors.red, soft: colors.redSoft },
  amber: { accent: '#d2820d', icon: colors.amber, soft: colors.amberSoft },
} as const

export function MetricCard({ icon: Icon, label, value, detail, tone }: {
  icon: LucideIcon
  label: string
  value: number
  detail: string
  tone: keyof typeof TONES
}) {
  const palette = TONES[tone]
  return (
    <View style={[styles.card, { borderTopColor: palette.accent }]} accessible accessibilityLabel={`${label}: ${value}, ${detail}`}>
      <View style={[styles.icon, { backgroundColor: palette.soft }]}>
        <Icon size={18} color={palette.icon} />
      </View>
      <AppText variant="captionStrong">{label}</AppText>
      <AppText variant="monoLarge" style={styles.value}>{value}</AppText>
      <AppText variant="caption" style={styles.detail}>{detail}</AppText>
    </View>
  )
}

export function MetricGrid({ children }: { children: ReactNode }) {
  const items = Children.toArray(children)
  const rows: ReactNode[][] = []
  for (let index = 0; index < items.length; index += 2) rows.push(items.slice(index, index + 2))
  return (
    <View style={styles.grid}>
      {rows.map((row, index) => <View key={index} style={styles.row}>{row}</View>)}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopWidth: 3,
    borderRadius: radius.lg,
    padding: 14,
    gap: 4,
    ...shadow,
  },
  icon: { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  value: { fontSize: 28, lineHeight: 34 },
  detail: { fontSize: 11, color: colors.subtle },
})
