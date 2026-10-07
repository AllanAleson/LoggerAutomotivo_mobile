import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Platform } from 'react-native'

import { normalizeApiUrl, resolveDefaultApiUrl } from '@/lib/api-url'

const STORAGE_KEY = 'logger-auto:api-url'

interface ApiConfigValue {
  baseUrl: string
  defaultUrl: string
  isCustom: boolean
  saveBaseUrl: (input: string) => Promise<string>
  resetBaseUrl: () => Promise<void>
}

const ApiConfigContext = createContext<ApiConfigValue | null>(null)

function computeDefaultUrl() {
  return resolveDefaultApiUrl({
    envUrl: process.env.EXPO_PUBLIC_API_URL,
    hostUri: Constants.expoConfig?.hostUri,
    platform: Platform.OS,
    isDevice: Device.isDevice,
    webHostname: Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.hostname : null,
  })
}

// Mantém o endereço da API escolhido pelo técnico entre execuções do app.
// Só renderiza as telas depois de ler o valor salvo, evitando uma primeira
// requisição para o endereço errado.
export function ApiConfigProvider({ children, onReady }: { children: ReactNode; onReady?: () => void }) {
  const [defaultUrl] = useState(computeDefaultUrl)
  const [customUrl, setCustomUrl] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    AsyncStorage.getItem(STORAGE_KEY)
      .then(saved => { if (active) setCustomUrl(saved ? normalizeApiUrl(saved) : null) })
      .catch(() => undefined)
      .finally(() => { if (active) setReady(true) })
    return () => { active = false }
  }, [])

  useEffect(() => { if (ready) onReady?.() }, [ready, onReady])

  const value = useMemo<ApiConfigValue>(() => ({
    baseUrl: customUrl ?? defaultUrl,
    defaultUrl,
    isCustom: customUrl !== null,
    async saveBaseUrl(input) {
      const normalized = normalizeApiUrl(input)
      if (!normalized) throw new Error('Informe uma URL válida, por exemplo http://192.168.0.10:3333')
      if (normalized === defaultUrl) {
        await AsyncStorage.removeItem(STORAGE_KEY)
        setCustomUrl(null)
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, normalized)
        setCustomUrl(normalized)
      }
      return normalized
    },
    async resetBaseUrl() {
      await AsyncStorage.removeItem(STORAGE_KEY)
      setCustomUrl(null)
    },
  }), [customUrl, defaultUrl])

  if (!ready) return null
  return <ApiConfigContext.Provider value={value}>{children}</ApiConfigContext.Provider>
}

export function useApiConfig() {
  const value = useContext(ApiConfigContext)
  if (!value) throw new Error('useApiConfig precisa estar dentro de ApiConfigProvider.')
  return value
}
