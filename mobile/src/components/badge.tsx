import { StyleSheet, View } from 'react-native'

import type { Level, Status } from '@/api/types'
import { AppText } from '@/components/app-text'
import { Activity, CircleX, Info, ShieldAlert, TriangleAlert, type LucideIcon } from '@/components/icons'
import { fonts } from '@/constants/theme'

const BADGES: Record<Level | Status, { color: string; background: string; border: string; Icon: LucideIcon }> = {
  ONLINE: { color: '#126846', background: '#eaf8f1', border: '#bfe8d5', Icon: Activity },
  INFO: { color: '#126846', background: '#eaf8f1', border: '#bfe8d5', Icon: Info },
  OFFLINE: { color: '#596474', background: '#eff2f5', border: '#d5dbe2', Icon: CircleX },
  WARNING: { color: '#925600', background: '#fff5df', border: '#f0d59f', Icon: TriangleAlert },
  ERROR: { color: '#a42e39', background: '#fcedef', border: '#eec4c8', Icon: CircleX },
  CRITICAL: { color: '#ffffff', background: '#a9212d', border: '#a9212d', Icon: ShieldAlert },
}

export function Badge({ value }: { value: Level | Status }) {
  const badge = BADGES[value] ?? BADGES.OFFLINE
  const { Icon } = badge
  return (
    <View
      accessibilityLabel={value}
      style={[styles.badge, { backgroundColor: badge.background, borderColor: badge.border }]}>
      <Icon size={12} color={badge.color} strokeWidth={2.4} />
      <AppText style={[styles.text, { color: badge.color }]}>{value}</AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 13, letterSpacing: 0.4 },
})
