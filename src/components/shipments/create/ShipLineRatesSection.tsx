import { displayLocalized } from "@/lib/localizedString";
import { wizardRateUnitPrice, effectiveDelayLabelForRate } from "@/lib/shipmentCreateUtils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { WizardFlagsChips } from "@/components/shipments/create/WizardFlagsChips";

export interface ShipLineRatesSectionProps {
  routeShipLines: Record<string, unknown>[];
  shipLineRateId: string;
  setShipLineRateId: (v: string) => void;
  setShippingModeId: (v: string) => void;
  formatMoney: (n: number) => string;
}

export function ShipLineRatesSection({
  routeShipLines,
  shipLineRateId,
  setShipLineRateId,
  setShippingModeId,
  formatMoney,
}: ShipLineRatesSectionProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Choisissez une ligne de tarif : le mode et le délai sont appliqués automatiquement.
      </p>
      {routeShipLines.map((line) => {
        const origins = (
          Array.isArray(line.origin_countries) ? line.origin_countries : []
        ) as Record<string, unknown>[];
        const dests = (
          Array.isArray(line.destination_countries) ? line.destination_countries : []
        ) as Record<string, unknown>[];
        const rates = (Array.isArray(line.rates) ? line.rates : []) as Record<
          string,
          unknown
        >[];
        return (
          <div
            key={String(line.id)}
            className="overflow-x-auto rounded-lg border border-border bg-background"
          >
            <p className="border-b border-border px-3 py-2 text-sm font-semibold">
              {displayLocalized(line.name)}
            </p>
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="p-2 font-medium">Origines</th>
                  <th className="p-2 font-medium">Destinations</th>
                  <th className="p-2 font-medium">Mode</th>
                  <th className="p-2 font-medium">Délai</th>
                  <th className="p-2 font-medium text-right">Prix</th>
                  <th className="p-2 w-[88px] font-medium">Choix</th>
                </tr>
              </thead>
              <tbody>
                {rates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-3 text-muted-foreground text-xs">
                      Aucun tarif actif sur cette ligne.
                    </td>
                  </tr>
                ) : (
                  rates.map((rate) => {
                    const rid = String(rate.id ?? "");
                    const sel = shipLineRateId === rid;
                    const sm = (
                      rate.shipping_mode as { name?: unknown } | undefined
                    )?.name;
                    const dt = effectiveDelayLabelForRate(rate) || "";
                    const price = wizardRateUnitPrice(rate);
                    return (
                      <tr
                        key={
                          rid ||
                          `l${String(line.id)}-m${String(rate.shipping_mode_id ?? "")}`
                        }
                        className={cn(
                          "border-b border-border last:border-0",
                          sel && "bg-primary/5",
                        )}
                      >
                        <td className="p-2 align-top">
                          <WizardFlagsChips countries={origins} />
                        </td>
                        <td className="p-2 align-top">
                          <WizardFlagsChips countries={dests} />
                        </td>
                        <td className="p-2 align-top font-medium">
                          {displayLocalized(sm)}
                        </td>
                        <td className="p-2 align-top text-xs text-muted-foreground max-w-[160px]">
                          {dt.trim() ? dt : "—"}
                        </td>
                        <td className="p-2 align-top text-right font-medium tabular-nums whitespace-nowrap">
                          {formatMoney(price)}
                        </td>
                        <td className="p-2 align-top">
                          <Button
                            type="button"
                            size="sm"
                            variant={sel ? "default" : "outline"}
                            className="h-8 w-full text-xs"
                            onClick={() => {
                              setShipLineRateId(rid);
                              setShippingModeId(String(rate.shipping_mode_id ?? ""));
                            }}
                          >
                            {sel ? "Choisi" : "Choisir"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
