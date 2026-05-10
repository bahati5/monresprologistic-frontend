import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { displayLocalized } from "@/lib/localizedString";
import type { WizardShipmentItem } from "@/types/shipmentCreate";

export interface ShipmentItemRowProps {
  item: WizardShipmentItem;
  index: number;
  itemsLength: number;
  itemsEntryMode: "per_item" | "global";
  articleCategoryList: { id: number; name: unknown }[];
  displayVolumetricDivisor: number;
  onUpdate: (
    index: number,
    field: keyof WizardShipmentItem,
    value: string | number,
  ) => void;
  onRemove: (index: number) => void;
}

export function ShipmentItemRow({
  item,
  index,
  itemsLength,
  itemsEntryMode,
  articleCategoryList,
  displayVolumetricDivisor,
  onUpdate,
  onRemove,
}: ShipmentItemRowProps) {
  const l = Number(item.length_cm) || 0;
  const wcm = Number(item.width_cm) || 0;
  const h = Number(item.height_cm) || 0;
  const volLineKg =
    l > 0 && wcm > 0 && h > 0
      ? ((l * wcm * h) / displayVolumetricDivisor) * item.quantity
      : 0;

  return (
    <tr className="group hover:bg-muted/20 transition-colors">
      <td className="p-3 align-top">
        <Input
          value={item.description}
          className="h-9 bg-transparent border-transparent group-hover:border-input focus:bg-background transition-all"
          onChange={(e) => onUpdate(index, "description", e.target.value)}
          placeholder="Ex: Vêtements, Électronique..."
        />
      </td>
      {articleCategoryList.length > 0 && (
        <td className="p-3 align-top">
          <select
            value={item.category_id || ""}
            onChange={(e) =>
              onUpdate(
                index,
                "category_id",
                e.target.value ? Number(e.target.value) : "",
              )
            }
            className="h-9 w-full rounded-md border border-transparent bg-transparent px-2 text-sm group-hover:border-input focus:border-input focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          >
            <option value="">—</option>
            {articleCategoryList.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {displayLocalized(cat.name as string)}
              </option>
            ))}
          </select>
        </td>
      )}
      <td className="p-3 align-top">
        <Input
          type="number"
          min={1}
          value={item.quantity}
          className="h-9 text-center bg-transparent border-transparent group-hover:border-input focus:bg-background transition-all"
          onChange={(e) =>
            onUpdate(index, "quantity", parseInt(e.target.value, 10) || 1)
          }
        />
      </td>
      <td className="p-3 align-top">
        <Input
          type="number"
          step="0.01"
          min={0}
          value={item.weight_kg}
          disabled={itemsEntryMode === "global"}
          className="h-9 text-right bg-transparent border-transparent group-hover:border-input focus:bg-background transition-all disabled:opacity-50"
          onChange={(e) =>
            onUpdate(index, "weight_kg", parseFloat(e.target.value) || 0)
          }
        />
      </td>
      <td className="p-3 align-top">
        <Input
          type="number"
          step="0.01"
          min={0}
          value={item.value}
          disabled={itemsEntryMode === "global"}
          className="h-9 text-right bg-transparent border-transparent group-hover:border-input focus:bg-background transition-all disabled:opacity-50"
          onChange={(e) =>
            onUpdate(index, "value", parseFloat(e.target.value) || 0)
          }
        />
      </td>
      <td className="p-3 align-top">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            step="0.1"
            placeholder="L"
            value={item.length_cm || ""}
            className="h-8 w-14 text-center text-[11px] px-1 bg-transparent border-transparent group-hover:border-input focus:bg-background transition-all"
            onChange={(e) =>
              onUpdate(index, "length_cm", parseFloat(e.target.value) || 0)
            }
          />
          <span className="text-muted-foreground text-[10px]">×</span>
          <Input
            type="number"
            step="0.1"
            placeholder="l"
            value={item.width_cm || ""}
            className="h-8 w-14 text-center text-[11px] px-1 bg-transparent border-transparent group-hover:border-input focus:bg-background transition-all"
            onChange={(e) =>
              onUpdate(index, "width_cm", parseFloat(e.target.value) || 0)
            }
          />
          <span className="text-muted-foreground text-[10px]">×</span>
          <Input
            type="number"
            step="0.1"
            placeholder="h"
            value={item.height_cm || ""}
            className="h-8 w-14 text-center text-[11px] px-1 bg-transparent border-transparent group-hover:border-input focus:bg-background transition-all"
            onChange={(e) =>
              onUpdate(index, "height_cm", parseFloat(e.target.value) || 0)
            }
          />
        </div>
        {volLineKg > 0 && (
          <p className="text-[10px] text-muted-foreground mt-1 text-right pr-1 tabular-nums">
            <span className="font-medium text-foreground">
              {volLineKg.toFixed(2)} kg
            </span>{" "}
            vol. équ.
          </p>
        )}
      </td>
      <td className="p-3 align-top text-center">
        {itemsLength > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </td>
    </tr>
  );
}
