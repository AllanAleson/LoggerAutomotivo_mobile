import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'

import { AppText } from '@/components/app-text'
import type { LucideIcon } from '@/components/icons'
import { colors, fonts, radius } from '@/constants/theme'

type Variant = 'primary' | 'secondary' | 'ghost'

const PALETTE: Record<Variant, { background: string; border: string; text: string }> = {
  primary: { background: colors.blue, border: colors.blue, text: colors.onDark },
  secondary: { background: colors.surface, border: colors.line, text: colors.text },
  ghost: { background: 'transparent', border: 'transparent', text: colors.blue },
}

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: Variant
  icon?: LucideIcon
  disabled?: boolean
  loading?: boolean
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}

export function Button({ title, onPress, variant = 'primary', icon: Icon, disabled, loading, style, accessibilityLabel }: ButtonProps) {
  const palette = PALETTE[variant]
  const inactive = disabled || loading
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.background, borderColor: palette.border },
        variant === 'ghost' && styles.ghost,
        pressed && styles.pressed,
        inactive && styles.disabled,
        style,
      ]}>
      {loading
        ? <ActivityIndicator size="small" color={palette.text} />
        : Icon ? <Icon size={17} color={palette.text} strokeWidth={2.2} /> : null}
      <AppText style={[styles.label, { color: palette.text }]} numberOfLines={1}>{title}</AppText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ghost: { minHeight: 36, paddingHorizontal: 4 },
  label: { fontFamily: fonts.bold, fontSize: 14 },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.45 },
})
