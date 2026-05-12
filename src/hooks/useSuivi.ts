import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'
import type {
  SuiviDashboardData,
  SuiviPeriod,
  DelayedShipment,
  ActiveOrder,
  SuiviBoardData,
  SuiviBoardFilters,
} from '@/types/suivi'

export function useSuiviDashboard(period: SuiviPeriod = 'week') {
  return useQuery<SuiviDashboardData>({
    queryKey: ['suivi-dashboard', period],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/suivi/dashboard', { params: { period } })
      return data
    },
    refetchInterval: 2 * 60 * 1000,
    staleTime: 60 * 1000,
  })
}

export function useSuiviDelayed() {
  return useQuery<{ delayed: DelayedShipment[] }>({
    queryKey: ['suivi-delayed'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/suivi/delayed')
      return data
    },
    staleTime: 60 * 1000,
  })
}

export function useSuiviActiveOrders() {
  return useQuery<{ orders: ActiveOrder[] }>({
    queryKey: ['suivi-active-orders'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/suivi/active-orders')
      return data
    },
    staleTime: 60 * 1000,
  })
}

export function useSuiviBoard(filters: SuiviBoardFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
  )
  return useQuery<SuiviBoardData>({
    queryKey: ['suivi-board', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/suivi/board', { params })
      return data
    },
    refetchInterval: 2 * 60 * 1000,
    staleTime: 30 * 1000,
  })
}
