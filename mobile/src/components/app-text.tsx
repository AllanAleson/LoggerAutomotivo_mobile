import { StyleSheet, Text, type TextProps } from 'react-native'

import { colors, fonts } from '@/constants/theme'

export type TextVariant =
  | 'title' | 'heading' | 'subheading' | 'body' | 'bodyStrong' | 'caption' | 'captionStrong'
  | 'label' | 'eyebrow' | 'mono' | 'monoLarge'

export function AppText({ variant = 'body', color, style, ...rest }: TextProps & { variant?: TextVariant; color?: string }) {
  return <Text maxFontSizeMultiplier={1.4} style={[styles.base, styles[variant], color ? { color } : null, style]} {...rest} />
}

const styles = StyleSheet.create({
  base: { color: colors.text, fontFamily: fonts.regular },
  title: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4, color: colors.textStrong },
  heading: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 21, color: colors.textStrong },
  subheading: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20, color: colors.text },
  body: { fontSize: 14, lineHeight: 20, color: colors.textBody },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.text },
  caption: { fontSize: 12, lineHeight: 16, color: colors.muted },
  captionStrong: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, color: colors.muted },
  label: { fontFamily: fonts.bold, fontSize: 10.5, lineHeight: 14, letterSpacing: 0.7, textTransform: 'uppercase', color: '#7d8796' },
  eyebrow: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, letterSpacing: 1.4, textTransform: 'uppercase', color: '#2476d4' },
  mono: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 18, color: colors.text },
  monoLarge: { fontFamily: fonts.monoBold, fontSize: 22, lineHeight: 28, color: colors.textStrong },
})
