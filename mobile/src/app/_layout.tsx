import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular'
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium'
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold'
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold'
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium'
import { JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono/600SemiBold'
import { useFonts } from 'expo-font'
import { DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useCallback } from 'react'

import { ApiConfigProvider } from '@/api/config'
import { colors, fonts } from '@/constants/theme'

export { ErrorBoundary } from 'expo-router'

SplashScreen.preventAutoHideAsync().catch(() => undefined)

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.blue,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.line,
    notification: colors.red,
  },
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  })
  const hideSplash = useCallback(() => { SplashScreen.hideAsync().catch(() => undefined) }, [])

  // Sem as fontes a interface ainda funciona com as do sistema; só aguarda o carregamento.
  if (!fontsLoaded && !fontError) return null

  return (
    <ThemeProvider value={navigationTheme}>
      <ApiConfigProvider onReady={hideSplash}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.navy },
            headerTintColor: colors.onDark,
            headerTitleStyle: { fontFamily: fonts.bold },
            headerBackTitle: 'Voltar',
            contentStyle: { backgroundColor: colors.background },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="parts/[pieceId]" options={{ title: 'Peça' }} />
          <Stack.Screen name="+not-found" options={{ title: 'Página não encontrada' }} />
        </Stack>
      </ApiConfigProvider>
    </ThemeProvider>
  )
}
