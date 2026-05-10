import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ListCardsToggle } from '@/components/common/ListCardsToggle'
import { ClientFormDialog } from '@/components/crm/clients/ClientFormDialog'
import { ClientGridCard } from '@/components/crm/clients/ClientGridCard'
import { ClientListRow } from '@/components/crm/clients/ClientListRow'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useClients, useCreateClient, useUpdateClient, useToggleClientActive } from '@/hooks/useCrm'
import { loadViewMode, saveViewMode, type ListOrCards } from '@/lib/listViewMode'
import type { PaginatedData } from '@/types'
import type { Client } from '@/types/crm'
import { Users, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'

const VIEW_KEY = 'clients-list-view'

type ClientsPageClient = Client & {
  company?: string | null
  is_recipient?: boolean
}

export default function ClientsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading } = useClients({ page, search: search || undefined })
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const toggleStatus = useToggleClientActive()

  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<ClientsPageClient | null>(null)
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [viewMode, setViewMode] = useState<ListOrCards>(() => loadViewMode(VIEW_KEY))

  useEffect(() => {
    saveViewMode(VIEW_KEY, viewMode)
  }, [viewMode])

  const clients = (data?.data || []) as ClientsPageClient[]
  const pagination: PaginatedData<ClientsPageClient> = (data as PaginatedData<ClientsPageClient> | undefined) ?? {
    data: [],
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
    from: null,
    to: null,
    links: [],
  }

  const setField = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  const openCreate = () => {
    setEditItem(null)
    setForm({})
    setFormOpen(true)
  }

  const openEdit = (c: ClientsPageClient) => {
    setEditItem(c)
    setForm({ ...c })
    setFormOpen(true)
  }

  const handleSubmit = () => {
    if (editItem) {
      updateClient.mutate(
        { id: editItem.id, payload: form },
        { onSuccess: () => setFormOpen(false) },
      )
    } else {
      createClient.mutate(form as Record<string, unknown>, { onSuccess: () => setFormOpen(false) })
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">{pagination.total ?? 0} client(s)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-1.5" />
          Nouveau client
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ListCardsToggle mode={viewMode} onModeChange={setViewMode} />
      </div>

      {viewMode === 'list' ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Client</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Telephone</th>
                    <th className="px-4 py-3 text-left font-medium">Locker</th>
                    <th className="px-4 py-3 text-left font-medium">Statut</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b">
                        {[...Array(6)].map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : clients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <Users size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                        <p className="text-muted-foreground">Aucun client</p>
                      </td>
                    </tr>
                  ) : (
                    clients.map((c) => (
                      <ClientListRow
                        key={c.id}
                        client={c}
                        navigate={navigate}
                        onEdit={openEdit}
                        onToggleActive={(id) => toggleStatus.mutate(id)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : clients.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">Aucun client</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((c) => (
                <ClientGridCard
                  key={c.id}
                  client={c}
                  navigate={navigate}
                  onEdit={openEdit}
                  onToggleActive={(id) => toggleStatus.mutate(id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {(pagination.last_page ?? 1) > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {pagination.from}-{pagination.to} sur {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft size={14} className="mr-1" />
              Precedent
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {page} / {pagination.last_page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= (pagination.last_page ?? 1)}
              onClick={() => setPage(page + 1)}
            >
              Suivant
              <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      <ClientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editItem}
        form={form}
        setField={setField}
        onSubmit={handleSubmit}
        createPending={createClient.isPending}
        updatePending={updateClient.isPending}
      />
    </motion.div>
  )
}
