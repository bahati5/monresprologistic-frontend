import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Eye } from 'lucide-react'

export default function ShipmentsList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') || '1')
  const [search, setSearch] = useState(searchParams.get('search') || '')

  const { data, isLoading } = useQuery({
    queryKey: ['shipments', page, search],
    queryFn: () => api.get('/api/shipments', { params: { page, search } }).then((r) => r.data),
  })

  const shipments = data?.shipments?.data || []
  const pagination = data?.shipments || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expeditions</h1>
        <Link to="/shipments/create">
          <Button><Plus size={16} /> Nouvelle expedition</Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par tracking, client..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearchParams({ search, page: '1' })
              }
            }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Tracking</th>
                  <th className="px-4 py-3 text-left font-medium">Expediteur</th>
                  <th className="px-4 py-3 text-left font-medium">Destinataire</th>
                  <th className="px-4 py-3 text-left font-medium">Statut</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b">
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 w-24 animate-pulse rounded bg-muted" /></td>
                      ))}
                    </tr>
                  ))
                ) : shipments.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Aucune expedition trouvee.</td></tr>
                ) : (
                  shipments.map((s: any) => (
                    <tr key={s.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-xs">{s.tracking_number}</td>
                      <td className="px-4 py-3">{s.sender?.name || '-'}</td>
                      <td className="px-4 py-3">{s.recipient?.name || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                          {s.status?.name || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/shipments/${s.id}`}>
                          <Button variant="ghost" size="sm"><Eye size={14} /></Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline" size="sm"
            disabled={page <= 1}
            onClick={() => setSearchParams({ search, page: String(page - 1) })}
          >
            Precedent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} / {pagination.last_page}
          </span>
          <Button
            variant="outline" size="sm"
            disabled={page >= pagination.last_page}
            onClick={() => setSearchParams({ search, page: String(page + 1) })}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  )
}
