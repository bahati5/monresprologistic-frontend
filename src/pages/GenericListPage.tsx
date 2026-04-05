import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ListCardsToggle } from '@/components/common/ListCardsToggle'
import { loadViewMode, saveViewMode, type ListOrCards } from '@/lib/listViewMode'
import { Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { displayLocalized } from '@/lib/localizedString'

interface Column {
  key: string
  label: string
  render?: (row: any) => React.ReactNode
}

function cleanParams(params: Record<string, string | number | undefined>): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue
    out[k] = v
  }
  return out
}

interface GenericListPageProps {
  title: string
  apiPath: string
  dataKey: string
  columns: Column[]
  createPath?: string
  createLabel?: string
  detailPath?: (row: any) => string
  /** Clé localStorage pour mémoriser liste / cartes (défaut : generic-list-{dataKey}) */
  viewStorageKey?: string
  /** Logo institutionnel (ex. branding public) */
  logoUrl?: string | null
  logoAlt?: string
  /** Paramètres GET supplémentaires (filtres dynamiques, etc.) */
  extraApiParams?: Record<string, string | undefined>
  /** Barre de filtres au-dessus de la recherche */
  filtersSlot?: ReactNode
}

function cellContent(col: Column, row: any): React.ReactNode {
  if (col.render) return col.render(row)
  const v = row[col.key]
  if (v != null && typeof v === 'object' && !Array.isArray(v)) {
    return displayLocalized(v) || displayLocalized((v as Record<string, unknown>).name)
  }
  return v ?? '-'
}

export default function GenericListPage({
  title,
  apiPath,
  dataKey,
  columns,
  createPath,
  createLabel,
  detailPath,
  viewStorageKey,
  logoUrl,
  logoAlt,
  extraApiParams,
  filtersSlot,
}: GenericListPageProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') || '1')
  const [search, setSearch] = useState(() => searchParams.get('search') || '')

  useEffect(() => {
    setSearch(searchParams.get('search') || '')
  }, [searchParams])

  const storageKey = viewStorageKey ?? `generic-list-${dataKey}`
  const [viewMode, setViewMode] = useState<ListOrCards>(() => loadViewMode(storageKey))

  useEffect(() => {
    saveViewMode(storageKey, viewMode)
  }, [storageKey, viewMode])

  const extraSerialized = useMemo(() => JSON.stringify(extraApiParams ?? {}), [extraApiParams])

  const requestParams = useMemo(
    () =>
      cleanParams({
        page,
        search: search.trim() || undefined,
        ...(extraApiParams ?? {}),
      }),
    [page, search, extraApiParams],
  )

  const { data, isLoading } = useQuery({
    queryKey: [dataKey, apiPath, page, search, extraSerialized],
    queryFn: () => api.get(apiPath, { params: requestParams }).then((r) => r.data),
  })

  const mergeParams = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(searchParams)
      for (const [k, raw] of Object.entries(updates)) {
        if (raw === '' || raw == null) next.delete(k)
        else next.set(k, raw)
      }
      setSearchParams(next)
    },
    [searchParams, setSearchParams],
  )

  const applySearch = useCallback(() => {
    mergeParams({ search: search.trim(), page: '1' })
  }, [mergeParams, search])

  const goPage = useCallback(
    (p: number) => {
      mergeParams({ page: String(p) })
    },
    [mergeParams],
  )

  const items = data?.[dataKey]?.data || data?.[dataKey] || []
  const pagination = data?.[dataKey] || {}

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={logoAlt ?? title}
              className="h-11 w-auto max-h-14 max-w-[min(200px,40vw)] shrink-0 object-contain object-left"
            />
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        {createPath && (
          <a href={createPath} className="shrink-0">
            <Button>{createLabel || 'Nouveau'}</Button>
          </a>
        )}
      </div>

      {filtersSlot ? <div className="rounded-lg border border-border/60 bg-muted/20 p-4">{filtersSlot}</div> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applySearch()
            }}
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
                    {columns.map((col) => (
                      <th key={col.key} className="px-4 py-3 text-left font-medium">
                        {col.label}
                      </th>
                    ))}
                    {detailPath && <th className="px-4 py-3 text-right font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b">
                        {columns.map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                          </td>
                        ))}
                        {detailPath && <td className="px-4 py-3" />}
                      </tr>
                    ))
                  ) : items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length + (detailPath ? 1 : 0)}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        Aucun resultat.
                      </td>
                    </tr>
                  ) : (
                    items.map((row: any) => (
                      <tr key={row.id} className="border-b hover:bg-muted/50">
                        {columns.map((col) => (
                          <td key={col.key} className="px-4 py-3 align-top">
                            {cellContent(col, row)}
                          </td>
                        ))}
                        {detailPath && (
                          <td className="px-4 py-3 text-right">
                            <a href={detailPath(row)}>
                              <Button variant="ghost" size="sm">
                                Voir
                              </Button>
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
      ) : (
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="space-y-2 p-4">
                    {columns.map((c) => (
                      <div key={c.key} className="h-3 max-w-[85%] animate-pulse rounded bg-muted" />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">Aucun resultat.</CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((row: any) => (
                <Card key={row.id} className="overflow-visible">
                  <CardContent className="space-y-3 overflow-visible p-4">
                    <dl className="space-y-2 text-sm">
                      {columns.map((col) => (
                        <div key={col.key} className="min-w-0">
                          <dt className="text-xs text-muted-foreground">{col.label}</dt>
                          <dd className="min-w-0 overflow-visible break-words font-medium">{cellContent(col, row)}</dd>
                        </div>
                      ))}
                    </dl>
                    {detailPath ? (
                      <a href={detailPath(row)} className="inline-block pt-2">
                        <Button variant="outline" size="sm">
                          Voir
                        </Button>
                      </a>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goPage(page - 1)}>
            Precedent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} / {pagination.last_page}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.last_page}
            onClick={() => goPage(page + 1)}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  )
}
