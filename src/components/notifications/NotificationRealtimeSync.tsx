import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Rafraîchit le compteur et les listes de notifications quand l’onglet redevient visible
 * et à intervalle régulier (approximation « temps réel » sans WebSocket).
 */
export function NotificationRealtimeSync() {
  const qc = useQueryClient()

  useEffect(() => {
    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      void qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick()
    }

    document.addEventListener('visibilitychange', onVisibility)
    const intervalId = window.setInterval(tick, 12_000)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearInterval(intervalId)
    }
  }, [qc])

  return null
}
