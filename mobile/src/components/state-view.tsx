import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { AppText } from '@/components/app-text'
import { Button } from '@/components/button'
import { CircleX, Database, RefreshCw, TriangleAlert } from '@/components/icons'
import { colors, radius } from '@/constants/theme'

export function LoadingState({ label = 'Carregando dados...' }: { label?: string }) {
  return (
    <View style={styles.state} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.blue} />
      <AppText variant="bodyStrong">{label}</AppText>
    </View>
  )
}

export function ErrorState({ title = 'Não foi possível carregar', message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <View style={[styles.state, styles.error]} accessibilityRole="alert">
      <CircleX size={26} color={colors.red} />
      <AppText variant="bodyStrong" color={colors.red}>{title}</AppText>
      <AppText variant="caption" style={styles.center}>{message}</AppText>
      {onRetry ? <Button title="Tentar novamente" icon={RefreshCw} variant="secondary" onPress={onRetry} style={styles.retry} /> : null}
    </View>
  )
}

export function EmptyState({ title = 'Nenhum registro encontrado', message = 'Ajuste os filtros ou faça uma nova pesquisa.' }: { title?: string; message?: string }) {
  return (
    <View style={styles.state}>
      <Database size={26} color={colors.subtle} />
      <AppText variant="bodyStrong">{title}</AppText>
      <AppText variant="caption" style={styles.center}>{message}</AppText>
    </View>
  )
}

// Aviso discreto quando uma atualização automática falha mas ainda há dados na tela.
export function InlineError({ message }: { message: string }) {
  return (
    <View style={styles.inline} accessibilityRole="alert">
      <TriangleAlert size={16} color={colors.amber} />
      <AppText variant="caption" color="#78551f" style={styles.inlineText}>
        Falha ao atualizar: {message} Exibindo os últimos dados recebidos.
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  state: {
    minHeight: 220,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd2da',
    borderRadius: radius.lg,
    backgroundColor: '#fafbfc',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  error: { borderColor: '#eec4c8', backgroundColor: '#fffafa' },
  center: { textAlign: 'center' },
  retry: { marginTop: 8 },
  inline: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: '#fff7e7',
    borderWidth: 1,
    borderColor: '#efdbad',
    borderRadius: radius.md,
    padding: 12,
  },
  inlineText: { flex: 1 },
})
