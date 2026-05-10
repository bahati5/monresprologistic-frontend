import { useCallback, useEffect } from "react";
import { buildShipmentWizardPayload } from "@/lib/buildShipmentWizardPayload";
import type { ItemsEntryMode, WizardShipmentItem } from "@/types/shipmentCreate";

/* eslint-disable react-hooks/exhaustive-deps -- preview debounce keeps legacy quote trigger list */
export function useShipmentCreatePayloadAndPreview(p: {
  clientId: string;
  recipientId: string;
  isEditing: boolean;
  createdShipmentId: number | null | undefined;
  items: WizardShipmentItem[];
  itemsEntryMode: ItemsEntryMode;
  globalTotalWeightKg: string;
  globalTotalDeclaredValue: string;
  shippingModeId: string;
  packagingTypeId: string;
  transportCompanyId: string;
  wizardRouteOriginId: string;
  wizardRouteDestId: string;
  shipLineRateId: string;
  baseDeliveryLabelForItems: string;
  insurancePct: string;
  customsDutyPct: string;
  taxPct: string;
  discountPct: string;
  manualFee: string;
  manualFeeLabel: string;
  notes: string;
  globalCurrency: string;
  agencyId: number | null | undefined;
  step: number;
  runPreview: (body: Record<string, unknown>, opts: { onError: () => void }) => void;
}) {
  const buildWizardPayload = useCallback((): Record<string, unknown> | null => {
    return buildShipmentWizardPayload({
      clientId: p.clientId,
      recipientId: p.recipientId,
      isEditing: p.isEditing,
      createdShipmentId: p.createdShipmentId,
      items: p.items,
      itemsEntryMode: p.itemsEntryMode,
      globalTotalWeightKg: p.globalTotalWeightKg,
      globalTotalDeclaredValue: p.globalTotalDeclaredValue,
      shippingModeId: p.shippingModeId,
      packagingTypeId: p.packagingTypeId,
      transportCompanyId: p.transportCompanyId,
      wizardRouteOriginId: p.wizardRouteOriginId,
      wizardRouteDestId: p.wizardRouteDestId,
      shipLineRateId: p.shipLineRateId,
      baseDeliveryLabelForItems: p.baseDeliveryLabelForItems,
      insurancePct: p.insurancePct,
      customsDutyPct: p.customsDutyPct,
      taxPct: p.taxPct,
      discountPct: p.discountPct,
      manualFee: p.manualFee,
      manualFeeLabel: p.manualFeeLabel,
      notes: p.notes,
      globalCurrency: p.globalCurrency,
      agencyId: p.agencyId,
    });
  }, [
    p.clientId,
    p.recipientId,
    p.isEditing,
    p.createdShipmentId,
    p.items,
    p.itemsEntryMode,
    p.globalTotalWeightKg,
    p.globalTotalDeclaredValue,
    p.shippingModeId,
    p.packagingTypeId,
    p.transportCompanyId,
    p.wizardRouteOriginId,
    p.wizardRouteDestId,
    p.shipLineRateId,
    p.baseDeliveryLabelForItems,
    p.insurancePct,
    p.customsDutyPct,
    p.taxPct,
    p.discountPct,
    p.manualFee,
    p.manualFeeLabel,
    p.notes,
    p.globalCurrency,
    p.agencyId,
  ]);

  useEffect(() => {
    if (p.step !== 4) return;
    const body = buildWizardPayload();
    if (!body || !p.shippingModeId) return;
    const t = window.setTimeout(() => {
      p.runPreview(body, {
        onError: () => {},
      });
    }, 450);
    return () => window.clearTimeout(t);
  }, [
    p.step,
    buildWizardPayload,
    p.shippingModeId,
    p.runPreview,
    p.wizardRouteOriginId,
    p.wizardRouteDestId,
    p.shipLineRateId,
    p.items,
    p.baseDeliveryLabelForItems,
  ]);

  return { buildWizardPayload };
}
