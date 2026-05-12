import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  History,
  Search,
  Filter,
  User,
  Shield,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Plus,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ActivityLog {
  id: number
  uuid: string
  log_name: string
  description: string
  subject_type: string | null
  subject_id: number | null
  causer_type: string | null
  causer_id: number | null
  causer_name: string | null
  causer_email: string | null
  properties: Record<string, unknown>
  event: string | null
  created_at: string
}

interface ActivityLogResponse {
  data: ActivityLog[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}

const EVENT_ICONS: Record<string, typeof History> = {
  login: LogIn,
  logout: LogOut,
  created: Plus,
  updated: Edit,
  deleted: Trash2,
  viewed: Eye,
}

const EVENT_COLORS: Record<string, string> = {
  login: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  logout: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
  created: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  updated: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  deleted: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  viewed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

function getEventBadge(event: string | null) {
  const e = event ?? 'unknown'
  const colorClass = EVENT_COLORS[e] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  const Icon = EVENT_ICONS[e] ?? History
  return (
    <Badge variant="secondary" className={`${colorClass} gap-1 font-medium`}>
      <Icon size={12} />
      {e}
    </Badge>
  )
}

function formatSubject(subjectType: string | null): string {
  if (!subjectType) return '—'
  const parts = subjectType.split('\\')
  return parts[parts.length - 1] ?? subjectType
}

export default function UserActivityLogPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const searchTimeout = useMemo(() => {
    return (value: string) => {
      const timer = setTimeout(() => {
        setDebouncedSearch(value)
        setPage(1)
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleSearch = (value: string) => {
    setSearch(value)
    searchTimeout(value)
  }

  const logsQuery = useQuery({
    queryKey: ['activity-logs', page, debouncedSearch, eventFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('per_page', '25')
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (eventFilter !== 'all') params.append('event', eventFilter)
      const { data } = await api.get<ActivityLogResponse>(`/api/activity-logs?${params.toString()}`)
      return data
    },
  })

  const logs = logsQuery.data?.data ?? []
  const totalPages = logsQuery.data?.last_page ?? 1
  const totalItems = logsQuery.data?.total ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Journal d'activité
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Historique des actions effectuées par les utilisateurs
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => logsQuery.refetch()}
          disabled={logsQuery.isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${logsQuery.isFetching ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par utilisateur, description..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={eventFilter} onValueChange={(v) => { setEventFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Tous les événements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les événements</SelectItem>
                <SelectItem value="login">Connexion</SelectItem>
                <SelectItem value="logout">Déconnexion</SelectItem>
                <SelectItem value="created">Création</SelectItem>
                <SelectItem value="updated">Modification</SelectItem>
                <SelectItem value="deleted">Suppression</SelectItem>
                <SelectItem value="viewed">Consultation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {logsQuery.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <History className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Aucune activité trouvée</p>
              <p className="text-xs mt-1">Modifiez vos filtres ou attendez de nouvelles actions</p>
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {log.causer_name ? (
                        <span className="text-xs font-bold">
                          {log.causer_name.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <Shield className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {log.causer_name ?? 'Système'}
                      </span>
                      {getEventBadge(log.event)}
                      <Badge variant="outline" className="text-xs">
                        {formatSubject(log.subject_type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.description}</p>
                    {log.causer_email && (
                      <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.causer_email}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'dd MMM yyyy', { locale: fr })}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {format(new Date(log.created_at), 'HH:mm:ss')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-3">
              <p className="text-sm text-muted-foreground">
                {totalItems} résultat{totalItems > 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
