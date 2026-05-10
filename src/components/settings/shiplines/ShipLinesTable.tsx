import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { displayLocalized } from '@/lib/localizedString'
import type { ShipLine, ShipLineCountryRef } from '@/types/settings'
import { CountryFlag } from '@/components/CountryFlag'

function FlagsCell({ countries }: { countries: ShipLineCountryRef[] }) {
  if (!countries.length) {
    return <span className="text-muted-foreground text-xs">—</span>
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 max-w-[min(100%,260px)]">
      {countries.map((c) => (
        <span
          key={c.id}
          className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/40 px-1.5 py-0.5 text-xs"
          title={c.name}
        >
          <CountryFlag emoji={c.emoji} iso2={c.iso2} code={c.code} className="!h-3 !w-4 shrink-0" />
          <span className="truncate max-w-[4.5rem]">{c.iso2 || c.code || c.name}</span>
        </span>
      ))}
    </div>
  )
}

interface ShipLinesTableProps {
  list: ShipLine[]
  formatMoney: (amount: number) => string
  onEdit: (item: ShipLine) => void
  onConfirmDelete: (item: ShipLine) => void
}

export function ShipLinesTable({ list, formatMoney, onEdit, onConfirmDelete }: ShipLinesTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[860px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <th className="p-3 font-medium">Route</th>
            <th className="p-3 font-medium">Origines</th>
            <th className="p-3 font-medium">Destinations</th>
            <th className="p-3 font-medium">Ligne</th>
            <th className="p-3 font-medium">Mode</th>
            <th className="p-3 font-medium">Délai (surcharge)</th>
            <th className="p-3 font-medium text-right">Prix</th>
            <th className="p-3 font-medium">Tarif</th>
            <th className="p-3 font-medium w-[100px]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map((item) => {
            const rates = item.rates?.length ? item.rates : [null]
            const rowSpan = rates.length
            const origins = item.origin_countries ?? []
            const dests = item.destination_countries ?? []
            return rates.map((rate, i) => (
              <tr
                key={rate?.id != null ? `r-${rate.id}` : `l-${item.id}-${i}`}
                className="border-b border-border last:border-0 hover:bg-muted/25 transition-colors"
              >
                {i === 0 ? (
                  <td rowSpan={rowSpan} className="align-top p-3 text-foreground">
                    <div className="font-medium leading-snug">{displayLocalized(item.name)}</div>
                    {item.description ? (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{String(item.description)}</p>
                    ) : null}
                  </td>
                ) : null}
                {i === 0 ? (
                  <td rowSpan={rowSpan} className="align-top p-3">
                    <FlagsCell countries={origins} />
                  </td>
                ) : null}
                {i === 0 ? (
                  <td rowSpan={rowSpan} className="align-top p-3">
                    <FlagsCell countries={dests} />
                  </td>
                ) : null}
                {i === 0 ? (
                  <td rowSpan={rowSpan} className="align-top p-3">
                    <Badge variant={item.is_active ? 'default' : 'secondary'} className="text-xs">
                      {item.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </td>
                ) : null}
                <td className="p-3 text-foreground">
                  {rate?.shipping_mode ? (
                    <span className="font-medium">{displayLocalized(String(rate.shipping_mode.name ?? ''))}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-3 text-muted-foreground text-xs max-w-[140px]">
                  {rate?.delivery_label_override ? String(rate.delivery_label_override) : '—'}
                </td>
                <td className="p-3 text-right font-medium tabular-nums whitespace-nowrap">
                  {rate != null ? formatMoney(Number(rate.unit_price ?? 0)) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-3">
                  {rate != null ? (
                    <Badge variant={rate.is_active !== false ? 'outline' : 'secondary'} className="text-xs">
                      {rate.is_active !== false ? 'Actif' : 'Inactif'}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
                {i === 0 ? (
                  <td rowSpan={rowSpan} className="align-top p-3">
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
                        <Pencil size={14} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette ligne ?</AlertDialogTitle>
                            <AlertDialogDescription>Les tarifs associés seront supprimés.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onConfirmDelete(item)}>Supprimer</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))
          })}
          {list.length === 0 && (
            <tr>
              <td colSpan={9} className="p-8 text-center text-muted-foreground text-sm">
                Aucune ligne configurée
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
