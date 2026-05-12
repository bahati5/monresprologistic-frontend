import { ChevronLeft, Loader2, FileText, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export interface ShipmentCreateSummaryProps {
  insurancePct: string;
  setInsurancePct: (v: string) => void;
  customsDutyPct: string;
  setCustomsDutyPct: (v: string) => void;
  taxPct: string;
  setTaxPct: (v: string) => void;
  discountPct: string;
  setDiscountPct: (v: string) => void;
  manualFee: string;
  setManualFee: (v: string) => void;
  manualFeeLabel: string;
  setManualFeeLabel: (v: string) => void;
  legalDeclarationAccepted: boolean;
  setLegalDeclarationAccepted: (v: boolean) => void;
  notes: string;
  setNotes: (v: string) => void;
  errors: Record<string, string[]>;
  previewPending: boolean;
  snap: Record<string, number | string> | undefined;
  formatMoney: (n: number) => string;
  saveDraftManually: () => void;
  draftIsSaving: boolean;
  canSubmit: boolean;
  createMutationPending: boolean;
  updateMutationPending: boolean;
  isEditing: boolean;
  onSubmit: () => void;
  setStep: (n: number) => void;
}

export function ShipmentCreateSummary({
  insurancePct,
  setInsurancePct,
  customsDutyPct,
  setCustomsDutyPct,
  taxPct,
  setTaxPct,
  discountPct,
  setDiscountPct,
  manualFee,
  setManualFee,
  manualFeeLabel,
  setManualFeeLabel,
  legalDeclarationAccepted,
  setLegalDeclarationAccepted,
  notes,
  setNotes,
  errors,
  previewPending,
  snap,
  formatMoney,
  saveDraftManually,
  draftIsSaving,
  canSubmit,
  createMutationPending,
  updateMutationPending,
  isEditing,
  onSubmit,
  setStep,
}: ShipmentCreateSummaryProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Résumé & tarification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Assurance (%)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={insurancePct}
                onChange={(e) => setInsurancePct(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Droits de douane (%)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={customsDutyPct}
                onChange={(e) => setCustomsDutyPct(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Taxe (%)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={taxPct}
                onChange={(e) => setTaxPct(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Remise (%)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Supplément (montant fixe)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={manualFee}
                onChange={(e) => setManualFee(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Libellé du supplément (optionnel)</Label>
              <Input
                value={manualFeeLabel}
                onChange={(e) => setManualFeeLabel(e.target.value)}
                placeholder="Ex. Frais spéciaux — affiché « Supplément … » sur la facture"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3 rounded-lg border border-muted bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="legal-declaration"
                checked={legalDeclarationAccepted}
                onChange={(e) => setLegalDeclarationAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-input"
              />
              <Label
                htmlFor="legal-declaration"
                className="cursor-pointer text-sm font-normal leading-snug"
              >
                Je certifie que les informations déclarées (description, quantités, valeurs) sont
                exactes et que le contenu respecte la réglementation en vigueur (douanes, produits
                interdits, etc.). *
              </Label>
            </div>
            {errors.legal_declaration_accepted && (
              <p className="text-sm text-destructive">
                {errors.legal_declaration_accepted[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notes / instructions</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instructions spéciales…"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Aperçu de la tarification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {previewPending && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
          )}
          {snap && !previewPending && (
            <div className="space-y-3">
              <div className="flex flex-col gap-2 rounded-lg border bg-background p-4 shadow-sm">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frais de transport de base</span>
                  <span className="font-medium">{formatMoney(Number(snap.base_quote))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Emballage</span>
                  <span className="font-medium">
                    {formatMoney(Number(snap.packaging_fee ?? 0))}
                  </span>
                </div>
                {Number(snap.manual_fee ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Supplément</span>
                    <span className="font-medium">{formatMoney(Number(snap.manual_fee))}</span>
                  </div>
                )}

                <Separator className="my-1" />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Assurance ({snap.insurance_pct}%)
                  </span>
                  <span className="font-medium">
                    {formatMoney(Number(snap.insurance_amount))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Frais de douane ({snap.customs_duty_pct}%)
                  </span>
                  <span className="font-medium">
                    {formatMoney(Number(snap.customs_duty_amount))}
                  </span>
                </div>

                <Separator className="my-1" />

                <div className="flex justify-between text-sm font-semibold">
                  <span>Sous-total</span>
                  <span>{formatMoney(Number(snap.subtotal))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxe ({snap.tax_pct}%)</span>
                  <span className="font-medium">{formatMoney(Number(snap.tax_amount))}</span>
                </div>
                {Number(snap.discount_amount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-success font-medium">
                    <span>Remise</span>
                    <span>-{formatMoney(Number(snap.discount_amount))}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg bg-primary p-4 text-primary-foreground shadow-md">
                <span className="text-lg font-bold uppercase tracking-wider">Total à payer</span>
                <span className="text-2xl font-black tabular-nums">
                  {formatMoney(Number(snap.total))}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(3)}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Precedent
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={saveDraftManually} disabled={draftIsSaving}>
            {draftIsSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer en brouillon
          </Button>
          <Button
            onClick={() => onSubmit()}
            disabled={!canSubmit || createMutationPending || updateMutationPending}
          >
            {createMutationPending || updateMutationPending
              ? isEditing
                ? "Mise à jour..."
                : "Creation..."
              : isEditing
                ? "Valider les modifications"
                : "Creer l'expedition"}
          </Button>
        </div>
      </div>
    </div>
  );
}
