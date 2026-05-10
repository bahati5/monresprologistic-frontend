import { SHIPMENT_STATUS_FILTER_OPTIONS } from '@/types/shipment'
import { STATUS_COLORS } from '@/lib/animations'
import { ListCardsToggle } from '@/components/common/ListCardsToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import type { ListOrCards } from '@/lib/listViewMode'

interface ShipmentListFiltersProps {
  search: string
  setSearch: (v: string) => void
  statusFilter: string
  setStatusFilter: (v: string) => void
  doSearch: () => void
  viewMode: ListOrCards
  setViewMode: Dispatch<SetStateAction<ListOrCards>>
}

export function ShipmentListFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  doSearch,
  viewMode,
  setViewMode,
}: ShipmentListFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par tracking, client..."
            className="pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') doSearch() }}
          />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v === 'all' ? '' : v); setTimeout(doSearch, 0) }}>
          <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {SHIPMENT_STATUS_FILTER_OPTIONS.map((st) => (
              <SelectItem key={st.code} value={st.code}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[st.code] || '#64748b' }} />
                  {st.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={doSearch}>Rechercher</Button>
      </div>
      <ListCardsToggle mode={viewMode} onModeChange={setViewMode} />
    </div>
  )
}
