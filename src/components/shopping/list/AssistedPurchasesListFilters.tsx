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
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full min-w-[200px] max-w-xs space-y-1.5">
          <Label htmlFor="filter-status" className="text-xs">
            Statut
          </Label>
          <Select value={statusValue} onValueChange={onStatusChange}>
            <SelectTrigger id="filter-status" className="h-9">
              <SelectValue placeholder="Tous les statuts" />
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

        <div className="w-full min-w-[200px] max-w-xs space-y-1.5">
          <Label htmlFor="filter-site" className="text-xs">
            Site / marchand
          </Label>
          <Select value={siteFilterValue} onValueChange={onSiteChange}>
            <SelectTrigger id="filter-site" className="h-9">
              <SelectValue placeholder="Tous les sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les sites</SelectItem>
              {!merchantKnown && merchantIdParam ? (
                <SelectItem value={merchantIdParam}>Marchand (id {merchantIdParam})</SelectItem>
              ) : null}
              {merchantsList.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isStaff ? (
          <div className="w-full min-w-[200px] max-w-sm flex-1 space-y-1.5">
            <Label htmlFor="filter-client" className="text-xs">
              Client (nom ou e-mail)
            </Label>
            <Input
              id="filter-client"
              placeholder="Saisir puis Entrée ou quitter le champ…"
              value={clientDraft}
              onChange={(e) => onClientDraftChange(e.target.value)}
              onBlur={onApplyClientFilter}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onApplyClientFilter()
              }}
            />
          </div>
        ) : null}

        <div className="w-full min-w-[140px] max-w-[180px] space-y-1.5">
          <Label htmlFor="filter-from" className="text-xs">
            Date du
          </Label>
          <Input id="filter-from" type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} />
        </div>

        <div className="w-full min-w-[140px] max-w-[180px] space-y-1.5">
          <Label htmlFor="filter-to" className="text-xs">
            au
          </Label>
          <Input id="filter-to" type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} />
        </div>

        <Button type="button" variant="outline" size="sm" className="mb-0.5" onClick={onResetFilters}>
          Réinitialiser les filtres
        </Button>
      </div>
    </div>
  )
}
