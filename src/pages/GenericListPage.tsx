import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { displayLocalized } from '@/lib/localizedString'

interface Column {
  key: string
  label: string
  render?: (row: any) => React.ReactNode
}

interface GenericListPageProps {
  title: string
  apiPath: string
  dataKey: string
  columns: Column[]
  createPath?: string
  createLabel?: string
  detailPath?: (row: any) => string
}

export default function GenericListPage({ title, apiPath, dataKey, columns, createPath, createLabel, detailPath }: GenericListPageProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') || '1')
  const [search, setSearch] = useState(searchParams.get('search') || '')

  const { data, isLoading } = useQuery({
    queryKey: [dataKey, page, search],
    queryFn: () => api.get(apiPath, { params: { page, search: search || undefined } }).then((r) => r.data),
  })

  const items = data?.[dataKey]?.data || data?.[dataKey] || []
  const pagination = data?.[dataKey] || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        {createPath && (
          <a href={createPath}>
            <Button>{createLabel || 'Nouveau'}</Button>
          </a>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') setSearchParams({ search, page: '1' }) }}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {columns.map((col) => (
                    <th key={col.key} className="px-4 py-3 text-left font-medium">{col.label}</th>
                  ))}
                  {detailPath && <th className="px-4 py-3 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b">
                      {columns.map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 w-24 animate-pulse rounded bg-muted" /></td>
                      ))}
                      {detailPath && <td className="px-4 py-3" />}
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr><td colSpan={columns.length + (detailPath ? 1 : 0)} className="px-4 py-8 text-center text-muted-foreground">Aucun resultat.</td></tr>
                ) : (
                  items.map((row: any) => (
                    <tr key={row.id} className="border-b hover:bg-muted/50">
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3">
                          {col.render
                          ? col.render(row)
                          : (() => {
                              const v = row[col.key]
                              if (v != null && typeof v === 'object' && !Array.isArray(v)) {
                                return displayLocalized(v) || displayLocalized((v as Record<string, unknown>).name)
                              }
                              return v ?? '-'
                            })()}
                        </td>
                      ))}
                      {detailPath && (
                        <td className="px-4 py-3 text-right">
                          <a href={detailPath(row)}>
                            <Button variant="ghost" size="sm">Voir</Button>
                          </a>
                        </td>
                      )}
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
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setSearchParams({ search, page: String(page - 1) })}>
            Precedent
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} / {pagination.last_page}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.last_page} onClick={() => setSearchParams({ search, page: String(page + 1) })}>
            Suivant
          </Button>
        </div>
      )}
    </div>
  )
}
