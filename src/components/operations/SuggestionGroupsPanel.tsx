import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Lightbulb } from 'lucide-react'

export type SuggestionGroup = {
  destination?: string | null
  dest_country_id?: number | null
  shipping_mode_id?: number | null
  count: number
  total_weight: number
  shipment_ids: number[]
  shipments: Array<{
    id: number
    tracking?: string | null
    client?: string | null
    weight_kg?: number | null
  }>
}

interface SuggestionGroupsPanelProps {
  suggestions: SuggestionGroup[]
  onPreselGroup: (shipmentIds: number[]) => void
}

export function SuggestionGroupsPanel({ suggestions, onPreselGroup }: SuggestionGroupsPanelProps) {
  if (suggestions.length === 0) return null
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden />
          Suggestions (même destination + mode d’envoi, statut prêt à l’expédition)
        </div>
        <p className="text-xs text-muted-foreground">
          {suggestions.length} groupe(s) possible(s) : regrouper des colis réduit les coûts de manutention et le
          nombre d’envois. Sélectionnez un groupe puis créez un lot.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {suggestions.map((g, idx) => (
            <div
              key={`${g.dest_country_id ?? 'x'}-${g.shipping_mode_id ?? 'm'}-${idx}`}
              className="rounded-lg border bg-muted/20 p-3 text-sm"
            >
              <p className="font-medium">
                {g.destination || 'Destination'} — {g.count} colis, {g.total_weight} kg
              </p>
              <ul className="mt-2 max-h-24 overflow-y-auto text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                {g.shipments?.slice(0, 8).map((s) => (
                  <li key={s.id}>
                    {s.tracking || `#${s.id}`}
                    {s.client ? ` — ${s.client}` : ''}
                  </li>
                ))}
                {(g.shipments?.length ?? 0) > 8 ? <li>…</li> : null}
              </ul>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3 w-full"
                onClick={() => {
                  onPreselGroup(g.shipment_ids ?? [])
                }}
              >
                Pré-sélectionner ce groupe
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
