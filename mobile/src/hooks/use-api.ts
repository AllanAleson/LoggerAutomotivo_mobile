import { useIsFocused } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'

import { errorMessage, isAbortError, requestJson } from '@/api/client'
import { useApiConfig } from '@/api/config'
import { useAppActive } from '@/hooks/use-app-active'

interface ApiState<T> {
  key: string | null
  data: T | null
  error: string | null
  loading: boolean
  refreshing: boolean
  updatedAt: number | null
}

const initialState = <T,>(key: string | null): ApiState<T> =>
  ({ key, data: null, error: null, loading: key !== null, refreshing: false, updatedAt: null })

// Busca um recurso da API e o mantém atualizado enquanto a tela estiver
// visível. O polling pausa com a tela fora de foco ou o app em segundo plano
// e recarrega imediatamente ao voltar, como o dashboard web faz a cada 15 s.
export function useApi<T>(path: string | null, { refreshMs = 0 }: { refreshMs?: number } = {}) {
  const { baseUrl } = useApiConfig()
  const key = path ? `${baseUrl}${path}` : null
  const [state, setState] = useState<ApiState<T>>(() => initialState<T>(key))
  const controllerRef = useRef<AbortController | null>(null)
  const focused = useIsFocused()
  const appActive = useAppActive()
  const live = focused && appActive
  const wasLive = useRef(live)

  // Novo endereço ou novo recurso: descarta os dados anteriores na mesma renderização.
  if (state.key !== key) setState(initialState<T>(key))

  const load = useCallback(async (mode: 'initial' | 'refresh' | 'poll') => {
    if (!path) return
    const requestKey = `${baseUrl}${path}`
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    if (mode === 'refresh') setState(current => ({ ...current, refreshing: true }))
    try {
      const data = await requestJson<T>(baseUrl, path, { signal: controller.signal })
      if (controller.signal.aborted) return
      setState(current => current.key !== requestKey ? current
        : { ...current, data, error: null, loading: false, refreshing: false, updatedAt: Date.now() })
    } catch (error) {
      if (controller.signal.aborted || isAbortError(error)) return
      setState(current => current.key !== requestKey ? current
        : { ...current, error: errorMessage(error), loading: false, refreshing: false })
    }
  }, [baseUrl, path])

  useEffect(() => {
    if (!path) return
    load('initial')
    return () => controllerRef.current?.abort()
  }, [load, path])

  useEffect(() => {
    if (!path || !refreshMs || !live) return
    const timer = setInterval(() => load('poll'), refreshMs)
    return () => clearInterval(timer)
  }, [live, load, path, refreshMs])

  useEffect(() => {
    if (live && !wasLive.current && path) load('poll')
    wasLive.current = live
  }, [live, load, path])

  const refresh = useCallback(() => load('refresh'), [load])
  return { data: state.data, error: state.error, loading: state.loading, refreshing: state.refreshing, updatedAt: state.updatedAt, refresh }
}
