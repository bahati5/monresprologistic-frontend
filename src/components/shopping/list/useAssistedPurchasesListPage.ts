import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import type { KanbanStatus } from '@/components/shopping/KanbanBoard'
import { toast } from 'sonner'
import type { AuthUser } from '@/types'
import { getAssistedPurchasesListColumns } from '@/components/shopping/list/AssistedPurchasesListColumns'
import type { AssistedPurchasesListFiltersProps } from '@/components/shopping/list/AssistedPurchasesListFilters'

function isStaffFromUser(user: AuthUser | null) {
  return Boolean(user?.roles?.some((r) => ['super_admin', 'agency_admin', 'operator'].includes(r)))
}

export function useAssistedPurchasesListPage(user: AuthUser | null) {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban')

  const [activeTab, setActiveTabState] = useState<'active' | 'history'>(() => {
    const t = searchParams.get('tab')
    return t === 'history' ? 'history' : 'active'
  })

  const isStaff = isStaffFromUser(user)

  useEffect(() => {
    if (!isStaff && viewMode === 'kanban') {
      setViewMode('list')
    }
  }, [isStaff, viewMode])

  const patchQuery = useCallback(
    (patches: Record<string, string>) => {
      const next = new URLSearchParams(searchParams)
      for (const [k, raw] of Object.entries(patches)) {
        if (raw === '' || raw == null) next.delete(k)
        else next.set(k, raw)
      }
      if (!('page' in patches)) next.set('page', '1')
      setSearchParams(next)
    },
    [searchParams, setSearchParams],
  )

  const resetFilters = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    ;[
      'status',
      'date_from',
      'date_to',
      'client_search',
      'user_id',
      'merchant_id',
      'search',
      'page',
    ].forEach((k) => next.delete(k))
    setSearchParams(next)
  }, [searchParams, setSearchParams])

  const setActiveTab = useCallback(
    (next: 'active' | 'history') => {
      setActiveTabState(next)
      const sp = new URLSearchParams(searchParams)
      sp.set('tab', next)
      sp.set('page', '1')
      setSearchParams(sp)
    },
    [searchParams, setSearchParams],
  )

  const merchantIdParam = searchParams.get('merchant_id') || ''
  const merchantIdApi =
    merchantIdParam !== '' && Number.isFinite(Number(merchantIdParam)) ? merchantIdParam : undefined

  const extraApiParams = useMemo(
    () => ({
      status: searchParams.get('status') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      client_search: isStaff ? searchParams.get('client_search') || undefined : undefined,
      merchant_id: merchantIdApi,
      tab: activeTab,
    }),
    [searchParams, isStaff, merchantIdApi, activeTab],
  )

  const { data: merchantsRes } = useQuery({
    queryKey: ['merchants', 'active-list'],
    queryFn: () =>
      api.get<{ merchants: { id: number; name: string }[] }>('/api/merchants').then((r) => r.data),
    staleTime: 60_000,
  })
  const merchantsList = merchantsRes?.merchants ?? []

  const { data: kanbanRes, isLoading: isKanbanLoading } = useQuery({
    queryKey: ['assisted-purchases-kanban', extraApiParams, searchParams.toString()],
    queryFn: () =>
      api
        .get('/api/assisted-purchases', {
          params: {
            ...extraApiParams,
            per_page: 100,
            page: 1,
            search: searchParams.get('search') || undefined,
          },
        })
        .then((r) => r.data),
    enabled: viewMode === 'kanban',
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: KanbanStatus }) =>
      api.post(`/api/assisted-purchases/${id}/update-status`, { status }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assisted-purchases-kanban'] })
      queryClient.invalidateQueries({ queryKey: ['generic-list', '/api/assisted-purchases'] })
      toast.success('Statut mis a jour')
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message || 'Impossible de changer le statut'),
  })

  const statusValue = searchParams.get('status') || 'all'
  const merchantKnown =
    merchantIdParam === '' || merchantsList.some((m) => String(m.id) === merchantIdParam)
  const siteFilterValue = merchantKnown ? merchantIdParam || 'all' : merchantIdParam
  const clientSearchParam = searchParams.get('client_search') || ''
  const [clientDraft, setClientDraft] = useState(clientSearchParam)
  useEffect(() => {
    setClientDraft(clientSearchParam)
  }, [clientSearchParam])

  const applyClientFilter = useCallback(() => {
    const t = clientDraft.trim()
    patchQuery({ client_search: t, page: '1' })
  }, [clientDraft, patchQuery])

  const dateFrom = searchParams.get('date_from') || ''
  const dateTo = searchParams.get('date_to') || ''

  const columns = useMemo(() => getAssistedPurchasesListColumns(isStaff), [isStaff])

  const filtersProps: AssistedPurchasesListFiltersProps = {
    statusValue,
    onStatusChange: (v: string) => patchQuery({ status: v === 'all' ? '' : v, page: '1' }),
    siteFilterValue,
    onSiteChange: (v: string) => patchQuery({ merchant_id: v === 'all' ? '' : v, page: '1' }),
    merchantKnown,
    merchantIdParam,
    merchantsList,
    isStaff,
    clientDraft,
    onClientDraftChange: setClientDraft,
    onApplyClientFilter: applyClientFilter,
    dateFrom,
    dateTo,
    onDateFromChange: (v: string) => patchQuery({ date_from: v, page: '1' }),
    onDateToChange: (v: string) => patchQuery({ date_to: v, page: '1' }),
    onResetFilters: resetFilters,
  }

  return {
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    extraApiParams,
    filtersProps,
    columns,
    isStaff,
    isKanbanLoading,
    kanbanRes,
    updateStatusMutation,
  }
}
