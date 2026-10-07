import { router } from 'expo-router'
import { Pressable, StyleSheet, View } from 'react-native'

import type { HealthResponse } from '@/api/types'
import { AppText } from '@/components/app-text'
import { fonts } from '@/constants/theme'
import { useApi } from '@/hooks/use-api'

// Indicador no cabeçalho: mostra se a API responde e leva às configurações.
export function ConnectionIndicator() {
  const { data, error } = useApi<HealthResponse>('/api/health', { refreshMs: 30_000 })
  const state = error ? 'offline' : data ? 'online' : 'pending'
  const label = state === 'offline' ? 'Sem conexão' : state === 'online' ? 'API online' : 'Conectando'
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. Abrir configurações da API`}
      hitSlop={8}
      onPress={() => router.navigate('/settings')}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
      <View style={[styles.dot, styles[state]]} />
      <AppText style={styles.text}>{label}</AppText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 12,
  },
  pressed: { opacity: 0.7 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  online: { backgroundColor: '#28c68a' },
  offline: { backgroundColor: '#ef6b73' },
  pending: { backgroundColor: '#9aa4b1' },
  text: { color: '#dfe7f2', fontFamily: fonts.semibold, fontSize: 12 },
})
