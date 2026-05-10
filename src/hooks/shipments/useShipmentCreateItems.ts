import { useMemo, useState } from "react";
import type { ItemsEntryMode, WizardShipmentItem } from "@/types/shipmentCreate";

const defaultItem = (): WizardShipmentItem => ({
  description: "",
  quantity: 1,
  weight_kg: 0,
  value: 0,
  length_cm: 0,
  width_cm: 0,
  height_cm: 0,
  category_id: "",
});

export function useShipmentCreateItems() {
  const [items, setItems] = useState<WizardShipmentItem[]>([defaultItem()]);
  const [itemsEntryMode, setItemsEntryMode] = useState<ItemsEntryMode>("per_item");
  const [globalTotalWeightKg, setGlobalTotalWeightKg] = useState("");
  const [globalTotalDeclaredValue, setGlobalTotalDeclaredValue] = useState("");

  const addItem = () => {
    setItems([...items, defaultItem()]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof WizardShipmentItem,
    value: string | number,
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const itemsSumValue = useMemo(() => {
    if (itemsEntryMode === "global") {
      const v = parseFloat(String(globalTotalDeclaredValue).replace(",", "."));
      return Number.isFinite(v) ? v : 0;
    }
    return items.reduce(
      (s, i) => s + Number(i.value || 0) * Number(i.quantity || 0),
      0,
    );
  }, [items, itemsEntryMode, globalTotalDeclaredValue]);

  const canProceedStep2 = useMemo(() => {
    if (items.length === 0) return false;
    const linesOk = items.every(
      (i) =>
        String(i.description ?? "").trim() !== "" && Number(i.quantity) > 0,
    );
    if (!linesOk) return false;

    if (itemsEntryMode === "per_item") {
      return items.every((i) => Number(i.weight_kg) > 0);
    }

    const totalQty = items.reduce((s, i) => s + Number(i.quantity || 0), 0);
    if (totalQty <= 0) return false;
    const w = parseFloat(String(globalTotalWeightKg).replace(",", "."));
    return Number.isFinite(w) && w > 0;
  }, [items, itemsEntryMode, globalTotalWeightKg]);

  return {
    items,
    setItems,
    itemsEntryMode,
    setItemsEntryMode,
    globalTotalWeightKg,
    setGlobalTotalWeightKg,
    globalTotalDeclaredValue,
    setGlobalTotalDeclaredValue,
    addItem,
    removeItem,
    updateItem,
    itemsSumValue,
    canProceedStep2,
  };
}
