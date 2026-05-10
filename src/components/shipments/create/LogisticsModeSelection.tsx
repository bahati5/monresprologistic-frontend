import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { displayLocalized } from "@/lib/localizedString";
import { cn } from "@/lib/utils";

export interface LogisticsModeSelectionProps {
  showModeCards: boolean;
  modeList: { id: number; name: unknown }[];
  modesFiltered: { id: number; name: unknown }[];
  shippingModeFilter: string;
  setShippingModeFilter: (v: string) => void;
  shippingModeId: string;
  setShippingModeId: (v: string) => void;
  hasRouteLines: boolean;
  setShipLineRateId: (v: string) => void;
  errors: Record<string, string[]>;
  baseDeliveryLabelForItems: string;
}

export function LogisticsModeSelection({
  showModeCards,
  modeList,
  modesFiltered,
  shippingModeFilter,
  setShippingModeFilter,
  shippingModeId,
  setShippingModeId,
  hasRouteLines,
  setShipLineRateId,
  errors,
  baseDeliveryLabelForItems,
}: LogisticsModeSelectionProps) {
  return (
    <>
      {showModeCards ? (
        <div className="space-y-2">
          <Label>Mode d&apos;expédition (service) *</Label>
          {modeList.length > 5 && (
            <Input
              value={shippingModeFilter}
              onChange={(e) => setShippingModeFilter(e.target.value)}
              placeholder="Filtrer les modes…"
              className="max-w-md"
              aria-label="Filtrer les modes d'expédition"
            />
          )}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {modesFiltered.map((m) => {
              const idStr = String(m.id);
              const selected = idStr === shippingModeId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setShippingModeId(idStr);
                    if (hasRouteLines) setShipLineRateId("");
                  }}
                  className={cn(
                    "rounded-lg border bg-card p-3 text-left text-sm shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected && "border-primary bg-primary/5 ring-2 ring-primary",
                  )}
                >
                  <span className="font-medium leading-snug">
                    {displayLocalized(m.name as string)}
                  </span>
                </button>
              );
            })}
          </div>
          {modeList.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucun mode d&apos;expédition configuré.
            </p>
          )}
          {modeList.length > 0 && modesFiltered.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun mode ne correspond au filtre.</p>
          )}
          {errors.shipping_mode_id && (
            <p className="text-sm text-destructive">{errors.shipping_mode_id[0]}</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Le délai affiché sur l&apos;expédition est celui de la ligne de tarif choisie, ou à défaut le
          premier libellé de délai configuré sur le mode d&apos;expédition.
        </p>
      )}

      {shippingModeId ? (
        <div className="rounded-lg border border-border bg-muted/15 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Délai appliqué à l&apos;expédition : </span>
          <span className="font-medium">
            {baseDeliveryLabelForItems.trim()
              ? baseDeliveryLabelForItems
              : "— (aucun libellé de délai pour ce tarif ou ce mode)"}
          </span>
        </div>
      ) : null}
    </>
  );
}
