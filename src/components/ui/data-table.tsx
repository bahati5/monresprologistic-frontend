import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { displayLocalized, resolveLocalized } from '@/lib/localizedString'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  ArrowUpDown,
} from 'lucide-react'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  className?: string
  render?: (row: T, index: number) => ReactNode
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  searchPlaceholder?: string
  onSearch?: (value: string) => void
  searchValue?: string
  expandRow?: (row: T) => ReactNode
  emptyMessage?: string
  emptyIcon?: ReactNode
  pagination?: {
    page: number
    lastPage: number
    total: number
    onPageChange: (page: number) => void
  }
  statusColumn?: {
    key: string
    colors?: Record<string, { bg: string; text: string }>
  }
  onRowClick?: (row: T) => void
  headerActions?: ReactNode
}

const defaultStatusColors: Record<string, { bg: string; text: string }> = {
  active:     { bg: 'bg-emerald-100 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-400' },
  completed:  { bg: 'bg-emerald-100 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-400' },
  delivered:  { bg: 'bg-emerald-100 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-400' },
  pending:    { bg: 'bg-amber-100 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-400' },
  created:    { bg: 'bg-blue-100 dark:bg-blue-500/15', text: 'text-blue-700 dark:text-blue-400' },
  in_transit: { bg: 'bg-indigo-100 dark:bg-indigo-500/15', text: 'text-indigo-700 dark:text-indigo-400' },
  cancelled:  { bg: 'bg-red-100 dark:bg-red-500/15', text: 'text-red-700 dark:text-red-400' },
  rejected:   { bg: 'bg-red-100 dark:bg-red-500/15', text: 'text-red-700 dark:text-red-400' },
}

function rowKey<T extends Record<string, unknown>>(row: T, index: number): string | number {
  const id = row['id']
  if (typeof id === 'string' || typeof id === 'number') return id
  return index
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  searchPlaceholder = 'Rechercher...',
  onSearch,
  searchValue,
  expandRow,
  emptyMessage = 'Aucun resultat',
  emptyIcon,
  pagination,
  statusColumn,
  onRowClick,
  headerActions,
}: DataTableProps<T>) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const cellSortText = (v: unknown) =>
    resolveLocalized(v) ||
    (typeof v === 'object' && v !== null && !Array.isArray(v)
      ? resolveLocalized((v as Record<string, unknown>).name)
      : '') ||
    (typeof v === 'string' ? v : '')

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const va = a[sortKey]
        const vb = b[sortKey]
        if (va == null) return 1
        if (vb == null) return -1
        if (typeof va === 'number' && typeof vb === 'number') {
          const cmp = va - vb
          return sortDir === 'asc' ? cmp : -cmp
        }
        const cmp = cellSortText(va).localeCompare(cellSortText(vb))
        return sortDir === 'asc' ? cmp : -cmp
      })
    : data

  function renderCell(row: T, col: Column<T>, idx: number): ReactNode {
    if (col.render) return col.render(row, idx)

    const val = row[col.key]

    if (statusColumn && col.key === statusColumn.key) {
      const statusObj = typeof val === 'object' && val != null ? (val as Record<string, unknown>) : null
      const statusName = statusObj != null ? displayLocalized(statusObj.name, '-') : displayLocalized(val, '-')
      const statusCode = statusObj != null
        ? String(statusObj.code || resolveLocalized(statusObj.name) || '').toLowerCase()
        : String(val || '').toLowerCase()
      const colors = statusColumn.colors || defaultStatusColors
      const c = colors[statusCode] || { bg: 'bg-secondary', text: 'text-secondary-foreground' }
      return (
        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', c.bg, c.text)}>
          {statusName || '-'}
        </span>
      )
    }

    if (val != null && typeof val === 'object' && !Array.isArray(val)) {
      const s = resolveLocalized(val) || resolveLocalized((val as Record<string, unknown>).name)
      return s || '-'
    }
    if (val == null) return '-'
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return String(val)
    return '-'
  }

  return (
    <div className="space-y-4">
      {/* Search + actions header */}
      {(onSearch || headerActions) && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {onSearch && (
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearch(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          )}
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}

      {/* Tableau (md+) + cartes empilées (mobile, sans défilement horizontal) */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="hidden min-w-0 md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {expandRow && <th className="w-10 px-2" />}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                      col.sortable && 'cursor-pointer select-none hover:text-foreground',
                      col.className
                    )}
                    onClick={() => col.sortable && toggleSort(col.key)}
                  >
                    <span className="flex items-center gap-1.5">
                      {col.label}
                      {col.sortable && (
                        sortKey === col.key
                          ? (sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)
                          : <ArrowUpDown size={12} className="opacity-30" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b">
                    {expandRow && <td className="px-2"><div className="h-4 w-4 rounded bg-muted animate-pulse" /></td>}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (expandRow ? 1 : 0)} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      {emptyIcon}
                      <p className="text-sm">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sorted.map((row, idx) => (
                  <RowContent
                    key={rowKey(row, idx)}
                    row={row}
                    idx={idx}
                    columns={columns}
                    expandRow={expandRow}
                    expandedIdx={expandedIdx}
                    setExpandedIdx={setExpandedIdx}
                    onRowClick={onRowClick}
                    renderCell={renderCell}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="min-w-0 space-y-3 p-3 md:hidden">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="space-y-2 p-4">
                  {columns.map((col) => (
                    <div key={col.key} className="h-3 max-w-[90%] animate-pulse rounded bg-muted" />
                  ))}
                </CardContent>
              </Card>
            ))
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              {emptyIcon}
              <p className="text-sm">{emptyMessage}</p>
            </div>
          ) : (
            sorted.map((row, idx) => {
              const expanded = expandedIdx === idx
              return (
                <Card
                  key={rowKey(row, idx)}
                  className={cn('overflow-hidden', onRowClick && 'cursor-pointer')}
                  onClick={() => onRowClick?.(row)}
                >
                  <CardContent className="space-y-2 p-4">
                    {expandRow && (
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedIdx(expanded ? null : idx)
                        }}
                      >
                        <ChevronDown size={14} className={cn('transition-transform', expanded && 'rotate-180')} />
                        Détails
                      </button>
                    )}
                    <dl className="space-y-2 text-sm">
                      {columns.map((col) => (
                        <div key={col.key} className="min-w-0">
                          <dt className="text-xs text-muted-foreground">{col.label}</dt>
                          <dd className="min-w-0 break-words font-medium">{renderCell(row, col, idx)}</dd>
                        </div>
                      ))}
                    </dl>
                    <AnimatePresence>
                      {expanded && expandRow && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t pt-3 text-sm"
                        >
                          {expandRow(row)}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.lastPage > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {pagination.page} sur {pagination.lastPage} ({pagination.total} resultats)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <ChevronLeft size={14} className="mr-1" /> Precedent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.lastPage}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Suivant <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function RowContent<T extends Record<string, unknown>>({
  row,
  idx,
  columns,
  expandRow,
  expandedIdx,
  setExpandedIdx,
  onRowClick,
  renderCell,
}: {
  row: T
  idx: number
  columns: Column<T>[]
  expandRow?: (row: T) => ReactNode
  expandedIdx: number | null
  setExpandedIdx: (idx: number | null) => void
  onRowClick?: (row: T) => void
  renderCell: (row: T, col: Column<T>, idx: number) => ReactNode
}) {
  const isExpanded = expandedIdx === idx

  return (
    <>
      <tr
        className={cn(
          'border-b transition-colors hover:bg-muted/30',
          onRowClick && 'cursor-pointer',
          isExpanded && 'bg-muted/20'
        )}
        onClick={() => onRowClick?.(row)}
      >
        {expandRow && (
          <td className="px-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpandedIdx(isExpanded ? null : idx)
              }}
              className="p-1 rounded hover:bg-muted"
            >
              <ChevronDown
                size={14}
                className={cn('transition-transform', isExpanded && 'rotate-180')}
              />
            </button>
          </td>
        )}
        {columns.map((col) => (
          <td key={col.key} className={cn('px-4 py-3', col.className)}>
            {renderCell(row, col, idx)}
          </td>
        ))}
      </tr>
      <AnimatePresence>
        {isExpanded && expandRow && (
          <tr>
            <td colSpan={columns.length + 1} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden border-b bg-muted/10"
              >
                <div className="p-4">{expandRow(row)}</div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  )
}
