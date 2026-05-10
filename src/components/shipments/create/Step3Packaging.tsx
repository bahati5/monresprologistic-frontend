import { Plus, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ItemsEntryMode, WizardShipmentItem } from "@/types/shipmentCreate";
import { ShipmentItemRow } from "@/components/shipments/create/ShipmentItemRow";

export interface Step3PackagingProps {
  itemsEntryMode: ItemsEntryMode;
  setItemsEntryMode: (m: ItemsEntryMode) => void;
  globalTotalWeightKg: string;
  setGlobalTotalWeightKg: (v: string) => void;
  globalTotalDeclaredValue: string;
  setGlobalTotalDeclaredValue: (v: string) => void;
  currencyUiLabel: string;
  articleCategoryList: { id: number; name: unknown }[];
  displayVolumetricDivisor: number;
  items: WizardShipmentItem[];
  addItem: () => void;
  removeItem: (i: number) => void;
  updateItem: (
    i: number,
    field: keyof WizardShipmentItem,
    value: string | number,
  ) => void;
  totalVolEquivKg: number;
  itemsSumValue: number;
  formatMoney: (n: number) => string;
  canProceedStep2: boolean;
  setStep: (n: number) => void;
}

export function Step3Packaging({
  itemsEntryMode,
  setItemsEntryMode,
  globalTotalWeightKg,
  setGlobalTotalWeightKg,
  globalTotalDeclaredValue,
  setGlobalTotalDeclaredValue,
  currencyUiLabel,
  articleCategoryList,
  displayVolumetricDivisor,
  items,
  addItem,
  removeItem,
  updateItem,
  totalVolEquivKg,
  itemsSumValue,
  formatMoney,
  canProceedStep2,
  setStep,
}: Step3PackagingProps) {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-none shadow-none bg-transparent">
        <CardHeader className="px-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Contenu du colis
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Détaillez les articles présents dans l&apos;expédition.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg border bg-background p-1 shadow-sm">
              <Button
                type="button"
                size="sm"
                variant={itemsEntryMode === "per_item" ? "secondary" : "ghost"}
                className={cn(
                  "h-8 px-3 text-xs",
                  itemsEntryMode === "per_item" &&
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
                onClick={() => setItemsEntryMode("per_item")}
              >
                Par article
              </Button>
              <Button
                type="button"
                size="sm"
                variant={itemsEntryMode === "global" ? "secondary" : "ghost"}
                className={cn(
                  "h-8 px-3 text-xs",
                  itemsEntryMode === "global" &&
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
                onClick={() => setItemsEntryMode("global")}
              >
                Totaux globaux
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0 space-y-6">
          {itemsEntryMode === "global" && (
            <div className="grid gap-4 rounded-xl border bg-primary/5 p-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Poids total (kg) *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  className="bg-background border-primary/20 focus-visible:ring-primary"
                  value={globalTotalWeightKg}
                  onChange={(e) => setGlobalTotalWeightKg(e.target.value)}
                  placeholder="ex. 12,5"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Valeur déclarée totale ({currencyUiLabel})
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  className="bg-background border-primary/20 focus-visible:ring-primary"
                  value={globalTotalDeclaredValue}
                  onChange={(e) => setGlobalTotalDeclaredValue(e.target.value)}
                  placeholder="Somme de toutes les lignes"
                />
              </div>
              <p className="text-[11px] text-primary/70 sm:col-span-2 italic">
                Note : Le poids et la valeur seront répartis proportionnellement aux quantités sur chaque
                ligne.
              </p>
            </div>
          )}

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="p-4 min-w-[200px]">Description *</th>
                    {articleCategoryList.length > 0 && (
                      <th className="p-4 w-40">Catégorie</th>
                    )}
                    <th className="p-4 w-24 text-center">Qte *</th>
                    <th className="p-4 w-32 text-right">
                      {itemsEntryMode === "global" ? "Poids (kg)" : "Poids (kg) *"}
                    </th>
                    <th className="p-4 w-40 text-right">Valeur ({currencyUiLabel})</th>
                    <th className="p-4 min-w-[180px]">
                      <span className="block">Dimensions (cm)</span>
                      <span className="mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-muted-foreground tabular-nums">
                        ÷{displayVolumetricDivisor}
                      </span>
                    </th>
                    <th className="p-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item, index) => (
                    <ShipmentItemRow
                      key={index}
                      item={item}
                      index={index}
                      itemsLength={items.length}
                      itemsEntryMode={itemsEntryMode}
                      articleCategoryList={articleCategoryList}
                      displayVolumetricDivisor={displayVolumetricDivisor}
                      onUpdate={updateItem}
                      onRemove={removeItem}
                    />
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 font-medium">
                    <td className="p-4 text-xs uppercase tracking-wider text-muted-foreground">Totaux</td>
                    <td className="p-4 text-center">
                      {items.reduce((sum, i) => sum + i.quantity, 0)}
                    </td>
                    <td className="p-4 text-right tabular-nums">
                      {itemsEntryMode === "global"
                        ? (parseFloat(String(globalTotalWeightKg).replace(",", ".")) || 0).toFixed(2)
                        : items.reduce((sum, i) => sum + i.weight_kg * i.quantity, 0).toFixed(2)}{" "}
                      kg
                    </td>
                    <td className="p-4 text-right tabular-nums text-primary font-bold">
                      {formatMoney(itemsSumValue)}
                    </td>
                    <td colSpan={2} className="p-4 text-[10px] text-muted-foreground text-right space-y-1">
                      <div className="tabular-nums text-foreground">
                        Total vol. équ.{" "}
                        <span className="font-medium">{totalVolEquivKg.toFixed(2)} kg</span>
                      </div>
                      <div className="italic">
                        % assurance et douane sur la valeur totale.
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="p-4 border-t bg-muted/5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-dashed border-2 hover:border-primary hover:text-primary transition-all"
                onClick={addItem}
              >
                <Plus className="mr-2 h-4 w-4" /> Ajouter un article
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" size="lg" onClick={() => setStep(1)}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Précédent
        </Button>
        <Button
          size="lg"
          className="px-8 shadow-lg shadow-primary/20"
          onClick={() => setStep(3)}
          disabled={!canProceedStep2}
        >
          Suivant <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
