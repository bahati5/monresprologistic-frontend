import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/CountryFlag";
import { displayLocalized } from "@/lib/localizedString";
import type { WizardCountryRow } from "@/types/shipmentCreate";
import { ShipLineRatesSection } from "@/components/shipments/create/ShipLineRatesSection";

export interface LogisticsRouteTariffsPanelProps {
  wizardRouteOriginId: string;
  wizardRouteDestId: string;
  routeLinesLoading: boolean;
  routeSelectionLabels: { origin?: WizardCountryRow; dest?: WizardCountryRow };
  hasRouteLines: boolean;
  routeShipLines: Record<string, unknown>[];
  shipLineRateId: string;
  setShipLineRateId: (v: string) => void;
  setShippingModeId: (v: string) => void;
  formatMoney: (n: number) => string;
  canManageSettings: boolean;
  setShipLineWizardOpen: (v: boolean) => void;
}

export function LogisticsRouteTariffsPanel({
  wizardRouteOriginId,
  wizardRouteDestId,
  routeLinesLoading,
  routeSelectionLabels,
  hasRouteLines,
  routeShipLines,
  shipLineRateId,
  setShipLineRateId,
  setShippingModeId,
  formatMoney,
  canManageSettings,
  setShipLineWizardOpen,
}: LogisticsRouteTariffsPanelProps) {
  if (!wizardRouteOriginId || !wizardRouteDestId) {
    return (
      <p className="text-sm text-muted-foreground">
        Indiquez le pays de départ et d&apos;arrivée pour proposer les tarifs des lignes configurées.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Tarifs ligne pour cette route</p>
        {routeLinesLoading ? (
          <span className="text-xs text-muted-foreground">Chargement…</span>
        ) : null}
      </div>
      {(routeSelectionLabels.origin || routeSelectionLabels.dest) && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-foreground">
          <span className="text-muted-foreground">Sélection :</span>
          {routeSelectionLabels.origin ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-background px-2 py-1">
              <CountryFlag
                emoji={routeSelectionLabels.origin.emoji}
                iso2={routeSelectionLabels.origin.iso2}
                code={routeSelectionLabels.origin.code}
                className="!h-3.5 !w-5"
              />
              <span className="font-medium">
                {displayLocalized(routeSelectionLabels.origin.name)}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Départ #{wizardRouteOriginId}</span>
          )}
          <span className="text-muted-foreground">→</span>
          {routeSelectionLabels.dest ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-background px-2 py-1">
              <CountryFlag
                emoji={routeSelectionLabels.dest.emoji}
                iso2={routeSelectionLabels.dest.iso2}
                code={routeSelectionLabels.dest.code}
                className="!h-3.5 !w-5"
              />
              <span className="font-medium">
                {displayLocalized(routeSelectionLabels.dest.name)}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Arrivée #{wizardRouteDestId}</span>
          )}
        </div>
      )}
      {hasRouteLines ? (
        <ShipLineRatesSection
          routeShipLines={routeShipLines}
          shipLineRateId={shipLineRateId}
          setShipLineRateId={setShipLineRateId}
          setShippingModeId={setShippingModeId}
          formatMoney={formatMoney}
        />
      ) : (
        !routeLinesLoading && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Aucune ligne ne couvre ce couple de pays. Vous pouvez créer une ligne (paramètres) ou
              choisir un mode manuellement ci-dessous.
            </p>
            {canManageSettings ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShipLineWizardOpen(true)}
              >
                Créer une ligne pour cette route
              </Button>
            ) : null}
          </div>
        )
      )}
    </div>
  );
}
