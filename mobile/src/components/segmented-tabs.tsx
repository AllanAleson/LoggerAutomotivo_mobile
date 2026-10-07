import { Pressable, StyleSheet, View } from 'react-native'

import { AppText } from '@/components/app-text'
import { colors, fonts, radius } from '@/constants/theme'

export function SegmentedTabs<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <View style={styles.container} accessibilityRole="tablist">
      {options.map(option => {
        const selected = option.value === value
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.tab, selected && styles.selected]}>
            <AppText numberOfLines={1} adjustsFontSizeToFit style={[styles.label, selected && styles.selectedLabel]}>
              {option.label}
            </AppText>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#e7ebf0',
    borderRadius: radius.md + 2,
    padding: 3,
    gap: 3,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, paddingHorizontal: 4, borderRadius: radius.md },
  selected: {
    backgroundColor: colors.surface,
    shadowColor: '#141f30',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  selectedLabel: { color: colors.blue, fontFamily: fonts.bold },
})
