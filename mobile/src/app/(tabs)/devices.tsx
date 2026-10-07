import { router } from 'expo-router'
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native'

import type { ListResponse, Logger } from '@/api/types'
import { AppText } from '@/components/app-text'
import { Badge } from '@/components/badge'
import { Fact, FactGrid } from '@/components/fact'
import { ChevronRight, Cpu } from '@/components/icons'
import { PageIntro, ScreenScroll, screenStyles, UpdatedAt } from '@/components/screen'
import { EmptyState, ErrorState, InlineError, LoadingState } from '@/components/state-view'
import { colors, radius, REFRESH_MS, shadow } from '@/constants/theme'
import { useApi } from '@/hooks/use-api'
import { formatDateTime, formatVoltage, orDash, timeAgo } from '@/lib/format'
import { partHref } from '@/lib/routes'

function LoggerCard({ logger }: { logger: Logger }) {
  const ago = timeAgo(logger.lastSeen)
  const pieceId = logger.pieceId
  return (
    <Pressable
      accessibilityRole={pieceId ? 'button' : undefined}
      accessibilityLabel={`${logger.loggerId}, ${logger.status}${pieceId ? `, peça ${pieceId}` : ''}`}
      disabled={!pieceId}
      onPress={() => { if (pieceId) router.push(partHref(pieceId)) }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.top}>
        <View style={styles.icon}><Cpu size={20} color={colors.blueText} /></View>
        <View style={styles.title}>
          <AppText variant="mono" style={styles.loggerId}>{logger.loggerId}</AppText>
          <AppText variant="caption">{pieceId ? `Peça ${pieceId}` : 'Sem peça associada'}</AppText>
        </View>
        <Badge value={logger.status} />
        {pieceId ? <ChevronRight size={18} color="#7b8796" /> : null}
      </View>
      <FactGrid>
        <Fact label="Última comunicação" value={`${formatDateTime(logger.lastSeen)}${ago ? `\n${ago}` : ''}`} />
        <Fact label="Firmware" value={orDash(logger.firmwareVersion)} />
        <Fact label="Comunicação" value={orDash(logger.communicationMode)} />
        <Fact label="Tensão reportada" value={formatVoltage(logger.batteryVoltage)} />
        <Fact label="Eventos pendentes" value={String(logger.pendingEvents ?? 0)} />
      </FactGrid>
    </Pressable>
  )
}

export default function DevicesScreen() {
  const { data, error, loading, refreshing, refresh, updatedAt } = useApi<ListResponse<Logger>>('/api/loggers', { refreshMs: REFRESH_MS })
  const intro = <PageIntro eyebrow="Equipamentos de campo" text="Estado resumido dos Loggers e suas peças atualmente associadas." />

  if (loading) return <ScreenScroll>{intro}<LoadingState /></ScreenScroll>
  if (!data) return <ScreenScroll onRefresh={refresh} refreshing={refreshing}>{intro}<ErrorState message={error ?? ''} onRetry={refresh} /></ScreenScroll>

  return (
    <FlatList
      data={data.items}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <LoggerCard logger={item} />}
      style={styles.list}
      contentContainerStyle={screenStyles.listContent}
      ItemSeparatorComponent={Separator}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.blue} colors={[colors.blue]} />}
      ListHeaderComponent={<View style={styles.header}>{intro}{error ? <InlineError message={error} /> : null}</View>}
      ListEmptyComponent={<EmptyState title="Nenhum Logger cadastrado" message="Cadastre o Logger no banco de dados para acompanhá-lo aqui." />}
      ListFooterComponent={<View style={styles.footer}><UpdatedAt value={updatedAt} /></View>}
    />
  )
}

function Separator() {
  return <View style={styles.separator} />
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  header: { gap: 12, marginBottom: 4 },
  footer: { marginTop: 8 },
  separator: { height: 12 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: 16,
    gap: 16,
    ...shadow,
  },
  pressed: { opacity: 0.85 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, gap: 2 },
  loggerId: { fontSize: 15 },
})
