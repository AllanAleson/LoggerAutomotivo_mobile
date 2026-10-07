import { router } from 'expo-router'
import { StyleSheet } from 'react-native'

import type { DashboardResponse } from '@/api/types'
import { AppText } from '@/components/app-text'
import { Button } from '@/components/button'
import { Card, CardHeader } from '@/components/card'
import { EventList } from '@/components/event-list'
import { Radio, Search, ShieldAlert, Signal, TriangleAlert } from '@/components/icons'
import { MetricCard, MetricGrid } from '@/components/metric-card'
import { PageIntro, ScreenScroll, UpdatedAt } from '@/components/screen'
import { ErrorState, InlineError, LoadingState } from '@/components/state-view'
import { colors, REFRESH_MS } from '@/constants/theme'
import { useApi } from '@/hooks/use-api'
import { openEventDiagnosis } from '@/lib/routes'

export default function DashboardScreen() {
  const { data, error, loading, refreshing, refresh, updatedAt } = useApi<DashboardResponse>('/api/dashboard', { refreshMs: REFRESH_MS })

  return (
    <ScreenScroll refreshing={refreshing} onRefresh={refresh}>
      <PageIntro eyebrow="Visão operacional" text="Resumo da frota monitorada e ocorrências que exigem atenção." />
      {loading ? <LoadingState /> : !data ? <ErrorState message={error ?? ''} onRetry={refresh} /> : (
        <>
          {error ? <InlineError message={error} /> : null}
          <MetricGrid>
            <MetricCard icon={Radio} label="Loggers online" value={data.summary.online} tone="green" detail="com comunicação recente" />
            <MetricCard icon={Signal} label="Loggers offline" value={data.summary.offline} tone="neutral" detail="fora do limite de heartbeat" />
            <MetricCard icon={ShieldAlert} label="Falhas críticas" value={data.summary.critical} tone="red" detail="nas últimas 24 horas" />
            <MetricCard icon={TriangleAlert} label="Falhas em 24h" value={data.summary.failures24h} tone="amber" detail="erros e eventos críticos" />
          </MetricGrid>
          <Button title="Pesquisar peça" icon={Search} onPress={() => router.navigate('/search')} />
          <Card>
            <CardHeader
              title="Ocorrências recentes"
              subtitle="Eventos relevantes, sem o ruído dos registros informativos."
              right={<Button variant="ghost" title="Ver alertas" onPress={() => router.navigate('/alerts')} />}
            />
            {data.recentEvents.length
              ? <EventList events={data.recentEvents} onPressEvent={openEventDiagnosis} />
              : <AppText style={styles.empty}>Nenhuma ocorrência relevante.</AppText>}
          </Card>
          <UpdatedAt value={updatedAt} />
        </>
      )}
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  empty: { padding: 28, textAlign: 'center', color: colors.muted },
})
