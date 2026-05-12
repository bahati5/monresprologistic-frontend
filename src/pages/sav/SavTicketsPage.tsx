import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Search, Clock, AlertTriangle, HeadphonesIcon } from 'lucide-react'
import api from '@/api/client'
import { useSavTickets } from '@/hooks/useSav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import type { SavTicket } from '@/types/sav'
import { useAuthStore } from '@/stores/authStore'
import { getSavBasePath, isPortalClientUser } from '@/lib/savPortalPaths'

const STATUS_TABS: { value: string; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'open', label: 'Ouverts' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'escalated', label: 'Escaladés' },
  { value: 'resolved', label: 'Résolus' },
  { value: 'closed', label: 'Fermés' },
]

const SORT_OPTIONS = [
  { value: 'sla', label: 'SLA restant' },
  { value: 'newest', label: 'Plus récent' },
  { value: 'oldest', label: 'Plus ancien' },
]

function priorityIcon(priority: string) {
  if (priority === 'urgent') return <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
  if (priority === 'normal') return <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-400" />
  return <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400" />
}

function slaDisplay(ticket: SavTicket) {
  const mins = ticket.sla_remaining_minutes
  if (mins === null || mins === undefined) return null
  if (mins <= 0) return <span className="text-xs font-semibold text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> SLA dépassé</span>
  const hours = Math.floor(mins / 60)
  const m = mins % 60
  const display = hours > 0 ? `${hours}h${String(m).padStart(2, '0')}` : `${m}min`
  const color = mins < 60 ? 'text-red-600' : mins < 120 ? 'text-orange-500' : 'text-muted-foreground'
  return <span className={`text-xs font-medium ${color} flex items-center gap-1`}><Clock className="h-3 w-3" />{display} restant</span>
}

export default function SavTicketsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const savBase = getSavBasePath(user)
  const isClient = isPortalClientUser(user)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [agentFilter, setAgentFilter] = useState('')
  const [sortBy, setSortBy] = useState('sla')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useSavTickets({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    category: categoryFilter || undefined,
    assigned_to: agentFilter || undefined,
    search: search || undefined,
    sort: sortBy,
    page,
  })

  const { data: agentsData } = useQuery({
    queryKey: ['sav-agents'],
    queryFn: () => api.get('/api/users', { params: { per_page: 50, role: 'operator,agency_admin' } }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: !isClient,
  })

  const agents = agentsData?.users?.data ?? agentsData?.users ?? []

  const tickets = data?.tickets?.data ?? []
  const categories = data?.categories ?? []
  const priorities = data?.priorities ?? []
  const counts = data?.counts_by_status ?? {}
  const totalOpen = (counts['open'] ?? 0) + (counts['in_progress'] ?? 0) + (counts['waiting_client'] ?? 0)
  const escalated = counts['escalated'] ?? 0
  const slaAtRisk = tickets.filter(t => t.sla_remaining_minutes !== null && t.sla_remaining_minutes <= 120 && t.sla_remaining_minutes > 0).length

  const resetFilters = () => {
    setPriorityFilter('')
    setCategoryFilter('')
    setAgentFilter('')
    setPage(1)
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HeadphonesIcon className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">SAV — Tickets</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalOpen} ticket(s) ouvert(s) · {slaAtRisk > 0 && <span className="text-orange-600">{slaAtRisk} SLA en danger</span>}{slaAtRisk > 0 && ' · '}{escalated > 0 && <span className="text-red-600">{escalated} escaladé(s)</span>}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`${savBase}/new`)}>
          <Plus className="mr-2 h-4 w-4" /> Nouveau
        </Button>
      </motion.div>

      {/* Status tabs */}
      <motion.div variants={fadeInUp} className="flex flex-wrap gap-2">
        {STATUS_TABS.map(tab => {
          const count = tab.value ? (counts[tab.value] ?? 0) : Object.values(counts).reduce((s, v) => s + v, 0)
          return (
            <Button
              key={tab.value}
              variant={statusFilter === tab.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setStatusFilter(tab.value); setPage(1) }}
            >
              {tab.label}
              <Badge variant="secondary" className="ml-1.5 text-[10px]">{count}</Badge>
            </Button>
          )
        })}
      </motion.div>

      {/* Filters row */}
      <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isClient ? 'Rechercher par référence ou sujet...' : 'Rechercher par référence, sujet, client...'}
            className="pl-10"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <Select value={priorityFilter} onValueChange={v => { setPriorityFilter(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-[140px] h-9 text-xs">
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorités</SelectItem>
            {priorities.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-[180px] h-9 text-xs">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {!isClient && (
        <Select value={agentFilter} onValueChange={v => { setAgentFilter(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue placeholder="Agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous agents</SelectItem>
            {agents.map((a: { id: number; name: string }) => (
              <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        )}

        <Select value={sortBy} onValueChange={v => { setSortBy(v); setPage(1) }}>
          <SelectTrigger className="w-[140px] h-9 text-xs">
            <SelectValue placeholder="Tri" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {(priorityFilter || categoryFilter || agentFilter) && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
            Réinitialiser
          </Button>
        )}
      </motion.div>

      {/* Ticket list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : tickets.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Aucun ticket trouvé</CardContent></Card>
      ) : (
        <motion.div variants={fadeInUp} className="space-y-3">
          {tickets.map(ticket => (
            <Card
              key={ticket.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`${savBase}/${ticket.uuid}`)}
            >
              <CardContent className="py-4 px-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {priorityIcon(ticket.priority)}
                      <span className="font-mono text-sm font-medium">{ticket.reference_code}</span>
                      <Badge variant="outline" className="text-[10px] uppercase">{ticket.priority_label}</Badge>
                      <Badge className={`text-[10px] ${ticket.status_color}`}>{ticket.status_label}</Badge>
                    </div>
                    <p className="font-medium text-sm truncate">{ticket.category_label} · {ticket.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ticket.client?.name ?? 'Client inconnu'} · {ticket.channel} · {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                      {ticket.assignee && <> · <span className="font-medium">{ticket.assignee.name}</span></>}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {slaDisplay(ticket)}
                    {!ticket.assigned_to && (
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">Non assigné</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {data?.tickets && data.tickets.last_page > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
          <span className="text-sm text-muted-foreground py-1.5">Page {page} / {data.tickets.last_page}</span>
          <Button size="sm" variant="outline" disabled={page >= data.tickets.last_page} onClick={() => setPage(p => p + 1)}>Suivant</Button>
        </div>
      )}
    </motion.div>
  )
}
