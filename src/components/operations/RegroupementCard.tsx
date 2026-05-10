import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LotRouteFlags } from '@/lib/countryFlags'
import { Package, ChevronRight, ChevronDown } from 'lucide-react'
import { lotStatusDisplay } from '@/components/operations/regroupementDisplay'
import type { RegroupementListItem } from '@/components/operations/regroupementDisplay'
import { RegroupementNestedShipmentsTable } from '@/components/operations/RegroupementNestedShipmentsTable'

interface RegroupementCardProps {
  regroupement: RegroupementListItem
  totalWeight: number
  expanded: boolean
  onToggleExpand: () => void
  onOpenStatus: () => void
}

export function RegroupementCard({
  regroupement: c,
  totalWeight: tw,
  expanded: open,
  onToggleExpand,
  onOpenStatus,
}: RegroupementCardProps) {
  const { stColor, stLabel } = lotStatusDisplay(c)
  return (
    <Card className="overflow-hidden flex flex-col">
      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-mono">#{c.id}</p>
            <p className="font-mono text-base font-semibold tracking-tight truncate">{c.batch_number}</p>
            <div className="mt-2 shrink-0">
              {c.lot_route ? (
                <LotRouteFlags
                  originIso2s={c.lot_route.origin_iso2s}
                  destIso2s={c.lot_route.dest_iso2s}
                  label={c.lot_route.label ?? undefined}
                />
              ) : null}
            </div>
            {c.lot_route?.label ? (
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground break-words">{c.lot_route.label}</p>
            ) : null}
          </div>
          <Badge
            className="text-xs shrink-0"
            style={{
              backgroundColor: `${stColor}20`,
              color: stColor,
              borderColor: `${stColor}40`,
            }}
          >
            {stLabel}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            <Package size={10} className="mr-1" />
            {c.shipments?.length ?? 0} expédition(s)
          </Badge>
          <span>{tw > 0 ? `${tw.toFixed(1)} kg` : 'Poids —'}</span>
          <span>{c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : ''}</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-auto pt-1">
          <Button type="button" variant="outline" size="sm" onClick={onToggleExpand}>
            {open ? 'Masquer les colis' : 'Voir les colis'}
            {open ? <ChevronDown className="ml-1 h-3 w-3" /> : <ChevronRight className="ml-1 h-3 w-3" />}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onOpenStatus}>
            Statut
          </Button>
        </div>
        {open ? <div className="pt-1 border-t border-border/80"><RegroupementNestedShipmentsTable shipments={c.shipments} /></div> : null}
      </CardContent>
    </Card>
  )
}
