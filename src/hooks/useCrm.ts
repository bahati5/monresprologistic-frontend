/* ── React Query hooks for CRM: Clients, Users, Drivers, Notifications ── */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { getApiErrorMessage } from '@/lib/apiError'
import { toast } from 'sonner'
import type { Client, ClientCreatePayload, User, UserCreatePayload, Driver, DriverCreatePayload, Notification } from '@/types/crm'
import type { PaginatedData, PaginationLink } from '@/types'

// ── Clients ──
function normalizeClientsPayload(root: Record<string, unknown> | undefined): PaginatedData<Client> {
  const raw = root?.clients ?? root
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const r = raw as Record<string, unknown>
    if (r.meta && typeof r.meta === 'object' && !Array.isArray(r.meta)) {
      const meta = r.meta as Record<string, unknown>
      const total = Number(meta.total ?? 0)
      const current = Number(meta.current_page ?? 1)
      const perPage = Number(meta.per_page ?? 25)
      const computedFrom = total === 0 ? null : (current - 1) * perPage + 1
      const computedTo = total === 0 ? null : Math.min(current * perPage, total)
      return {
        data: (Array.isArray(r.data) ? r.data : []) as Client[],
        current_page: Number(meta.current_page ?? 1),
        last_page: Number(meta.last_page ?? 1),
        per_page: Number(meta.per_page ?? 25),
        total,
        from: meta.from != null ? Number(meta.from) : computedFrom,
        to: meta.to != null ? Number(meta.to) : computedTo,
        links: (Array.isArray(r.links) ? r.links : []) as PaginationLink[],
      }
    }
  }
  if (Array.isArray(raw) && root?.meta && typeof root.meta === 'object' && !Array.isArray(root.meta)) {
    const m = root.meta as Record<string, unknown>
    const total = Number(m.total ?? 0)
    const current = Number(m.current_page ?? 1)
    const perPage = Number(m.per_page ?? 25)
    const from = total === 0 ? null : (current - 1) * perPage + 1
    const to = total === 0 ? null : Math.min(current * perPage, total)
    return {
      data: raw as Client[],
      current_page: Number(m.current_page ?? 1),
      last_page: Number(m.last_page ?? 1),
      per_page: Number(m.per_page ?? 25),
      total,
      from: m.from != null ? Number(m.from) : from,
      to: m.to != null ? Number(m.to) : to,
      links: (Array.isArray(root.links) ? root.links : []) as PaginationLink[],
    }
  }
  if (Array.isArray(raw)) {
    return {
      data: raw as Client[],
      current_page: 1,
      last_page: 1,
      per_page: raw.length,
      total: raw.length,
      from: raw.length ? 1 : null,
      to: raw.length,
      links: [],
    }
  }
  return raw as PaginatedData<Client>
}

export function useClients(params: Record<string, unknown> = {}) {
  return useQuery<PaginatedData<Client>>({
    queryKey: ['clients', params],
    queryFn: () => api.get('/api/clients', { params }).then((r) => normalizeClientsPayload(r.data)),
  })
}

export function useClient(uuid: string | undefined) {
  return useQuery<Client>({
    queryKey: ['clients', uuid],
    queryFn: () => api.get(`/api/clients/${uuid}`).then(r => r.data?.client ?? r.data),
    enabled: !!uuid,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClientCreatePayload | Record<string, unknown>) =>
      api.post('/api/clients', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['wizard', 'profiles'] })
      toast.success('Client créé')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: Partial<Client> | Record<string, unknown> }) =>
      api.patch(`/api/clients/${uuid}`, payload).then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['clients', vars.uuid] })
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client mis à jour')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export function useToggleClientActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) =>
      api.post(`/api/clients/${uuid}/toggle-active`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Statut modifié')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

// ── Users ──
function normalizePagination(paginated: Record<string, unknown> | unknown[]) {
  // Laravel peut renvoyer soit une page paginée { data, meta, ... }, soit un tableau brut de ressources.
  if (Array.isArray(paginated)) {
    const rows = paginated as User[]
    const n = rows.length
    return {
      rows,
      total: n,
      current: 1,
      perPage: n || 25,
      lastPage: 1,
      from: n ? 1 : null,
      to: n || null,
      links: [] as PaginationLink[],
    }
  }

  const meta =
    paginated.meta && typeof paginated.meta === 'object' && !Array.isArray(paginated.meta)
      ? (paginated.meta as Record<string, unknown>)
      : undefined
  const rows = (paginated.data as User[]) ?? []
  const total = Number(paginated.total ?? meta?.total ?? rows.length)
  const current = Number(paginated.current_page ?? meta?.current_page ?? 1)
  const perPage = Number(paginated.per_page ?? meta?.per_page ?? 25)
  const lastPage = Number(paginated.last_page ?? meta?.last_page ?? 1)
  const from =
    paginated.from != null ? Number(paginated.from) :
    meta?.from != null ? Number(meta.from) :
    total === 0 ? null : (current - 1) * perPage + 1
  const to =
    paginated.to != null ? Number(paginated.to) :
    meta?.to != null ? Number(meta.to) :
    total === 0 ? null : Math.min(current * perPage, total)
  return { rows, total, current, perPage, lastPage, from, to, links: (Array.isArray(paginated.links) ? paginated.links : []) as PaginationLink[] }
}

export function useUsers(params: Record<string, unknown> = {}) {
  return useQuery<import('@/types/crm').UsersListResult>({
    queryKey: ['users', params],
    queryFn: async () => {
      const r = await api.get<{
        users?: Record<string, unknown>
        availableRoles?: string[]
        agencies?: { uuid: string; name: string }[]
      }>('/api/users', { params })
      const body = r.data
      const paginated = (body.users ?? r.data) as Record<string, unknown>
      const p = normalizePagination(paginated)
      return {
        data: p.rows,
        current_page: p.current,
        last_page: p.lastPage,
        per_page: p.perPage,
        total: p.total,
        from: p.from,
        to: p.to,
        links: p.links,
        availableRoles: Array.isArray(body.availableRoles) ? body.availableRoles : [],
        agencies: Array.isArray(body.agencies) ? body.agencies : [],
      }
    },
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UserCreatePayload) =>
      api.post('/api/users', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Utilisateur créé')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: Partial<User> }) =>
      api.patch(`/api/users/${uuid}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Utilisateur mis à jour')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export function useToggleUserActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) =>
      api.post(`/api/users/${uuid}/toggle-active`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Statut modifié')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export function useResetUserPassword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      uuid,
      password,
      password_confirmation,
    }: {
      uuid: string
      password: string
      password_confirmation: string
    }) =>
      api
        .post(`/api/users/${uuid}/reset-password`, { password, password_confirmation })
        .then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Mot de passe réinitialisé')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

// ── Drivers ──
export function useDrivers(params: Record<string, unknown> = {}) {
  return useQuery<PaginatedData<Driver>>({
    queryKey: ['drivers', params],
    queryFn: () => api.get('/api/drivers', { params }).then(r => r.data?.drivers ?? r.data),
  })
}

export function useAssignableDrivers(options?: { enabled?: boolean }) {
  return useQuery<Pick<Driver, 'uuid' | 'name' | 'email'>[]>({
    queryKey: ['drivers', 'assignable'],
    queryFn: () =>
      api.get('/api/shipments/assignable-drivers').then((r) => r.data?.drivers ?? []),
    staleTime: 60_000,
    enabled: options?.enabled !== false,
  })
}

export function useCreateDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: DriverCreatePayload) =>
      api.post('/api/drivers', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drivers'] })
      qc.invalidateQueries({ queryKey: ['drivers', 'assignable'] })
      toast.success('Chauffeur créé')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export function useUpdateDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: Partial<Driver> }) =>
      api.patch(`/api/drivers/${uuid}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drivers'] })
      qc.invalidateQueries({ queryKey: ['drivers', 'assignable'] })
      toast.success('Chauffeur mis à jour')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export function useToggleDriverActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) =>
      api.post(`/api/drivers/${uuid}/toggle-active`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drivers'] })
      qc.invalidateQueries({ queryKey: ['drivers', 'assignable'] })
      toast.success('Statut modifié')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

// ── Notifications ──
export function useNotifications(params: Record<string, unknown> = {}) {
  return useQuery<Notification[]>({
    queryKey: ['notifications', params],
    queryFn: () => api.get('/api/notifications', { params }).then(r => r.data?.notifications ?? r.data),
  })
}

export function useUnreadCount() {
  return useQuery<number>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get('/api/notifications/unread-count').then(r => r.data?.count ?? 0),
    refetchInterval: 30000,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) =>
      api.post(`/api/notifications/${uuid}/read`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/api/notifications/read-all').then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Toutes les notifications marquées comme lues')
    },
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) =>
      api.delete(`/api/notifications/${uuid}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
