import { Tabs } from 'expo-router/js-tabs'

import type { DashboardResponse } from '@/api/types'
import { ConnectionIndicator } from '@/components/connection-indicator'
import { Bell, Cpu, LayoutDashboard, Search, Settings } from '@/components/icons'
import { colors, fonts } from '@/constants/theme'
import { useApi } from '@/hooks/use-api'

export default function TabsLayout() {
  // Falhas (ERROR/CRITICAL) das últimas 24 h viram um selo na aba Alertas.
  const { data } = useApi<DashboardResponse>('/api/dashboard', { refreshMs: 30_000 })
  const failures = data?.summary?.failures24h ?? 0

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: colors.onDark,
        headerTitleStyle: { fontFamily: fonts.bold, fontSize: 17 },
        headerShadowVisible: false,
        headerRight: () => <ConnectionIndicator />,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: '#7b8796',
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: 'Pesquisar', headerTitle: 'Pesquisar peça', tabBarIcon: ({ color, size }) => <Search color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="devices"
        options={{ title: 'Dispositivos', tabBarIcon: ({ color, size }) => <Cpu color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alertas',
          tabBarBadge: failures > 0 ? (failures > 99 ? '99+' : failures) : undefined,
          tabBarBadgeStyle: { fontFamily: fonts.bold, fontSize: 10 },
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Ajustes', headerTitle: 'Configurações', tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }}
      />
    </Tabs>
  )
}
