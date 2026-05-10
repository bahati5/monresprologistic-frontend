import { Truck, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DbCombobox } from "@/components/ui/DbCombobox";
import type { DbComboboxOption } from "@/components/ui/DbCombobox";
import type { ShipmentCreateLogisticsModal, WizardCountryRow } from "@/types/shipmentCreate";
import { LogisticsRouteMismatchAlert } from "@/components/shipments/create/LogisticsRouteMismatchAlert";
import { LogisticsRouteTariffsPanel } from "@/components/shipments/create/LogisticsRouteTariffsPanel";
import { LogisticsModeSelection } from "@/components/shipments/create/LogisticsModeSelection";

export interface Step2LogisticsProps {
  clientId: string;
  recipientId: string;
  wizardRouteOriginId: string;
  setWizardRouteOriginId: (v: string) => void;
  setUserOverrodeOrigin: (v: boolean) => void;
  wizardRouteDestId: string;
  setWizardRouteDestId: (v: string) => void;
  setUserOverrodeDest: (v: boolean) => void;
  countryOptions: DbComboboxOption[];
  loadingOptions: boolean;
  fetchingCountriesList: boolean;
  routeOriginMismatchSender: boolean;
  routeDestMismatchRecipient: boolean;
  onUpdateClientCountry: (type: "sender" | "recipient") => void;
  routeLinesLoading: boolean;
  routeSelectionLabels: { origin?: WizardCountryRow; dest?: WizardCountryRow };
  hasRouteLines: boolean;
  routeShipLines: Record<string, unknown>[];
  shipLineRateId: string;
  setShipLineRateId: (v: string) => void;
  shippingModeId: string;
  setShippingModeId: (v: string) => void;
  showModeCards: boolean;
  modeList: { id: number; name: unknown }[];
  modesFiltered: { id: number; name: unknown }[];
  shippingModeFilter: string;
  setShippingModeFilter: (v: string) => void;
  errors: Record<string, string[]>;
  baseDeliveryLabelForItems: string;
  packagingTypeId: string;
  setPackagingTypeId: (v: string) => void;
  packagingOptions: DbComboboxOption[];
  packagingListLength: number;
  transportCompanyId: string;
  setTransportCompanyId: (v: string) => void;
  transportCompanyOptions: DbComboboxOption[];
  transportCompanyListLength: number;
  canManageSettings: boolean;
  setLogisticsModal: (v: ShipmentCreateLogisticsModal) => void;
  setShipLineWizardOpen: (v: boolean) => void;
  saveDraftManually: () => void;
  draftIsSaving: boolean;
  canProceedStep3: boolean;
  setStep: (n: number) => void;
  formatMoney: (n: number) => string;
}

export function Step2Logistics({
  clientId,
  recipientId,
  wizardRouteOriginId,
  setWizardRouteOriginId,
  setUserOverrodeOrigin,
  wizardRouteDestId,
  setWizardRouteDestId,
  setUserOverrodeDest,
  countryOptions,
  loadingOptions,
  fetchingCountriesList,
  routeOriginMismatchSender,
  routeDestMismatchRecipient,
  onUpdateClientCountry,
  routeLinesLoading,
  routeSelectionLabels,
  hasRouteLines,
  routeShipLines,
  shipLineRateId,
  setShipLineRateId,
  shippingModeId,
  setShippingModeId,
  showModeCards,
  modeList,
  modesFiltered,
  shippingModeFilter,
  setShippingModeFilter,
  errors,
  baseDeliveryLabelForItems,
  packagingTypeId,
  setPackagingTypeId,
  packagingOptions,
  packagingListLength,
  transportCompanyId,
  setTransportCompanyId,
  transportCompanyOptions,
  transportCompanyListLength,
  canManageSettings,
  setLogisticsModal,
  setShipLineWizardOpen,
  saveDraftManually,
  draftIsSaving,
  canProceedStep3,
  setStep,
  formatMoney,
}: Step2LogisticsProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Logistique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Pays de départ *</Label>
              <DbCombobox
                value={wizardRouteOriginId || "__none"}
                onValueChange={(v) => {
                  setWizardRouteOriginId(v === "__none" ? "" : v);
                  setUserOverrodeOrigin(true);
                }}
                options={countryOptions}
                placeholder="Choisir le pays de départ"
                searchPlaceholder="Rechercher un pays…"
                isLoading={loadingOptions || fetchingCountriesList}
              />
            </div>
            <div className="space-y-2">
              <Label>Pays d&apos;arrivée *</Label>
              <DbCombobox
                value={wizardRouteDestId || "__none"}
                onValueChange={(v) => {
                  setWizardRouteDestId(v === "__none" ? "" : v);
                  setUserOverrodeDest(true);
                }}
                options={countryOptions}
                placeholder="Choisir le pays d'arrivée"
                searchPlaceholder="Rechercher un pays…"
                isLoading={loadingOptions || fetchingCountriesList}
              />
            </div>
          </div>

          <LogisticsRouteMismatchAlert
            clientId={clientId}
            recipientId={recipientId}
            routeOriginMismatchSender={routeOriginMismatchSender}
            routeDestMismatchRecipient={routeDestMismatchRecipient}
            onUpdateClientCountry={onUpdateClientCountry}
          />

          <LogisticsRouteTariffsPanel
            wizardRouteOriginId={wizardRouteOriginId}
            wizardRouteDestId={wizardRouteDestId}
            routeLinesLoading={routeLinesLoading}
            routeSelectionLabels={routeSelectionLabels}
            hasRouteLines={hasRouteLines}
            routeShipLines={routeShipLines}
            shipLineRateId={shipLineRateId}
            setShipLineRateId={setShipLineRateId}
            setShippingModeId={setShippingModeId}
            formatMoney={formatMoney}
            canManageSettings={canManageSettings}
            setShipLineWizardOpen={setShipLineWizardOpen}
          />

          <LogisticsModeSelection
            showModeCards={showModeCards}
            modeList={modeList}
            modesFiltered={modesFiltered}
            shippingModeFilter={shippingModeFilter}
            setShippingModeFilter={setShippingModeFilter}
            shippingModeId={shippingModeId}
            setShippingModeId={setShippingModeId}
            hasRouteLines={hasRouteLines}
            setShipLineRateId={setShipLineRateId}
            errors={errors}
            baseDeliveryLabelForItems={baseDeliveryLabelForItems}
          />

          <div className="space-y-2">
            <Label>Emballage (optionnel)</Label>
            {packagingListLength === 0 && !loadingOptions ? (
              <p className="text-sm text-muted-foreground rounded-md border border-dashed p-3">
                Aucun type d&apos;emballage en base.{" "}
                {canManageSettings ? (
                  <button
                    type="button"
                    className="text-primary underline"
                    onClick={() => setLogisticsModal({ k: "packaging" })}
                  >
                    Créer un emballage
                  </button>
                ) : (
                  "Contactez un administrateur."
                )}
              </p>
            ) : (
              <DbCombobox
                value={packagingTypeId || "__none"}
                onValueChange={(v) => setPackagingTypeId(v === "__none" ? "" : v)}
                options={packagingOptions}
                placeholder="Aucun"
                searchPlaceholder="Filtrer…"
                onOpenCreateModal={
                  canManageSettings
                    ? (hint) => setLogisticsModal({ k: "packaging", hint })
                    : undefined
                }
                createButtonTitle="Nouvel emballage"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Compagnie de transport (optionnel)</Label>
            {transportCompanyListLength === 0 && !loadingOptions ? (
              <p className="text-sm text-muted-foreground rounded-md border border-dashed p-3">
                Aucune compagnie de transport en base.{" "}
                {canManageSettings ? (
                  <button
                    type="button"
                    className="text-primary underline"
                    onClick={() => setLogisticsModal({ k: "transport" })}
                  >
                    Créer une compagnie
                  </button>
                ) : (
                  "Contactez un administrateur."
                )}
              </p>
            ) : (
              <DbCombobox
                value={transportCompanyId || "__none"}
                onValueChange={(v) => setTransportCompanyId(v === "__none" ? "" : v)}
                options={transportCompanyOptions}
                placeholder="Aucune"
                searchPlaceholder="Filtrer…"
                onOpenCreateModal={
                  canManageSettings
                    ? (hint) => setLogisticsModal({ k: "transport", hint })
                    : undefined
                }
                createButtonTitle="Nouvelle compagnie"
              />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(2)}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Precedent
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={saveDraftManually} disabled={draftIsSaving}>
            {draftIsSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer en brouillon
          </Button>
          <Button onClick={() => setStep(4)} disabled={!canProceedStep3}>
            Suivant <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
