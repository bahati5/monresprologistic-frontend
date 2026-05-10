import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { STATUS_FILTER_OPTIONS } from './assistedPurchasesListConstants'

export interface AssistedPurchasesListFiltersProps {
  statusValue: string
  onStatusChange: (value: string) => void
  siteFilterValue: string
  onSiteChange: (value: string) => void
  merchantKnown: boolean
  merchantIdParam: string
  merchantsList: { id: number; name: string }[]
  isStaff: boolean
  clientDraft: string
  onClientDraftChange: (value: string) => void
  onApplyClientFilter: () => void
  dateFrom: string
  dateTo: string
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onResetFilters: () => void
}

export function AssistedPurchasesListFilters({
  statusValue,
  onStatusChange,
  siteFilterValue,
  onSiteChange,
  merchantKnown,
  merchantIdParam,
  merchantsList,
  isStaff,
  clientDraft,
  onClientDraftChange,
  onApplyClientFilter,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onResetFilters,
}: AssistedPurchasesListFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="min-w-[140px] max-w-[180px] space-y-1">
        <Label htmlFor="filter-status" className="text-[11px] font-medium">
          Statut
        </Label>
        <Select value={statusValue} onValueChange={onStatusChange}>
          <SelectTrigger id="filter-status" className="h-8 text-sm">
            <SelectValue placeholder="Tous" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {STATUS_FILTER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[140px] max-w-[180px] space-y-1">
        <Label htmlFor="filter-site" className="text-[11px] font-medium">
          Marchand
        </Label>
        <Select value={siteFilterValue} onValueChange={onSiteChange}>
          <SelectTrigger id="filter-site" className="h-8 text-sm">
            <SelectValue placeholder="Tous" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les sites</SelectItem>
            {!merchantKnown && merchantIdParam && (
              <SelectItem value={merchantIdParam}>Marchand (id {merchantIdParam})</SelectItem>
            )}
            {merchantsList.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isStaff && (
        <div className="min-w-[160px] max-w-[220px] flex-1 space-y-1">
          <Label htmlFor="filter-client" className="text-[11px] font-medium">
            Client
          </Label>
          <Input
            id="filter-client"
            placeholder="Nom ou e-mail…"
            value={clientDraft}
            onChange={(e) => onClientDraftChange(e.target.value)}
            onBlur={onApplyClientFilter}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onApplyClientFilter()
            }}
            className="h-8 text-sm"
          />
        </div>
      )}

      <div className="min-w-[120px] max-w-[150px] space-y-1">
        <Label htmlFor="filter-from" className="text-[11px] font-medium">
          Du
        </Label>
        <Input
          id="filter-from"
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      <div className="min-w-[120px] max-w-[150px] space-y-1">
        <Label htmlFor="filter-to" className="text-[11px] font-medium">
          Au
        </Label>
        <Input
          id="filter-to"
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground mb-0"
        onClick={onResetFilters}
      >
        <RotateCcw size={12} />
        Réinitialiser
      </Button>
    </div>
  )
}
