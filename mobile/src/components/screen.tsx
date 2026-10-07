import type { ReactNode } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AppText } from '@/components/app-text'
import { colors, REFRESH_MS } from '@/constants/theme'
import { formatTime } from '@/lib/format'

interface ScreenScrollProps {
  children: ReactNode
  refreshing?: boolean
  onRefresh?: () => void
  // Telas empilhadas (fora das abas) precisam respeitar a área segura inferior.
  bottomInset?: boolean
}

export function ScreenScroll({ children, refreshing = false, onRefresh, bottomInset = false }: ScreenScrollProps) {
  const insets = useSafeAreaInsets()
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, bottomInset && { paddingBottom: 32 + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh
        ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} colors={[colors.blue]} />
        : undefined}>
      {children}
    </ScrollView>
  )
}

export function PageIntro({ eyebrow, text }: { eyebrow: string; text: string }) {
  return (
    <View style={styles.intro}>
      <AppText variant="eyebrow">{eyebrow}</AppText>
      <AppText variant="body" color={colors.muted}>{text}</AppText>
    </View>
  )
}

export function UpdatedAt({ value, auto = true }: { value: number | null; auto?: boolean }) {
  if (!value) return null
  return (
    <AppText variant="caption" style={styles.updated}>
      Atualizado às {formatTime(value)}{auto ? ` · atualização automática a cada ${REFRESH_MS / 1000} s` : ''}
    </AppText>
  )
}

export const screenStyles = StyleSheet.create({
  // Conteúdo padrão das listas (FlatList) para alinhar com ScreenScroll.
  listContent: { padding: 16, gap: 12, paddingBottom: 32 },
})

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  intro: { gap: 4 },
  updated: { textAlign: 'center', color: colors.subtle },
})
