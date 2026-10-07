import { useEffect, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

const isActive = (state: AppStateStatus) => state !== 'background'

// Indica se o app está em primeiro plano; usado para pausar o polling.
export function useAppActive() {
  const [active, setActive] = useState(() => isActive(AppState.currentState))
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setActive(isActive(state)))
    return () => subscription.remove()
  }, [])
  return active
}
