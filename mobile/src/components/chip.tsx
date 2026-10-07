import { Pressable, ScrollView, StyleSheet } from 'react-native'

import { AppText } from '@/components/app-text'
import { colors, fonts, radius } from '@/constants/theme'

export function Chip({ label, selected = false, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}>
      <AppText style={[styles.label, selected && styles.selectedLabel]}>{label}</AppText>
    </Pressable>
  )
}

// Linha horizontal de opções exclusivas (período, severidade...).
export function ChipGroup<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.group}>
      {options.map(option => (
        <Chip key={option.value} label={option.label} selected={option.value === value} onPress={() => onChange(option.value)} />
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  group: { gap: 8, paddingRight: 4 },
  chip: {
    borderWidth: 1,
    borderColor: '#d6dce3',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  selected: { backgroundColor: colors.blue, borderColor: colors.blue },
  pressed: { opacity: 0.75 },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: '#283444' },
  selectedLabel: { color: colors.onDark },
})
