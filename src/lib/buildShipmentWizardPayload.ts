import type { ItemsEntryMode, WizardShipmentItem } from "@/types/shipmentCreate";

export interface BuildShipmentWizardPayloadParams {
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
}

export function buildShipmentWizardPayload(
  p: BuildShipmentWizardPayloadParams,
): Record<string, unknown> | null {
  if (!p.clientId && !p.isEditing && !p.createdShipmentId) return null;

  const baseDelay = p.baseDeliveryLabelForItems;
  const totalQty = p.items.reduce(
    (s, i) => s + Number(i.quantity || 0),
    0,
  );
  const gw =
    p.itemsEntryMode === "global" && totalQty > 0
      ? parseFloat(String(p.globalTotalWeightKg).replace(",", "."))
      : NaN;
  const gv =
    p.itemsEntryMode === "global" && totalQty > 0
      ? parseFloat(String(p.globalTotalDeclaredValue).replace(",", "."))
      : NaN;
  const perUnitW =
    p.itemsEntryMode === "global" && totalQty > 0 && Number.isFinite(gw)
      ? gw / totalQty
      : null;
  const perUnitV =
    p.itemsEntryMode === "global" && totalQty > 0 && Number.isFinite(gv)
      ? gv / totalQty
      : null;

  const body: Record<string, unknown> = {
    sender_profile_id: p.clientId ? Number(p.clientId) : undefined,
    recipient_profile_id: p.recipientId ? Number(p.recipientId) : undefined,
    items: p.items.map((i) => {
      const eff = baseDelay.trim();
      const w =
        perUnitW != null ? perUnitW : Number(i.weight_kg || 0);
      const val = perUnitV != null ? perUnitV : Number(i.value || 0);
      const len = Number(i.length_cm) || 0;
      const wid = Number(i.width_cm) || 0;
      const h = Number(i.height_cm) || 0;
      return {
        description: i.description,
        quantity: i.quantity,
        weight_kg: w,
        value: val,
        ...(len > 0 ? { length_cm: len } : {}),
        ...(wid > 0 ? { width_cm: wid } : {}),
        ...(h > 0 ? { height_cm: h } : {}),
        ...(eff ? { delivery_time_label: eff } : {}),
        ...(i.category_id ? { category_id: Number(i.category_id) } : {}),
      };
    }),
    shipping_mode_id: p.shippingModeId ? Number(p.shippingModeId) : undefined,
    ...(p.agencyId != null ? { agency_id: Number(p.agencyId) } : {}),
    packaging_type_id: p.packagingTypeId ? Number(p.packagingTypeId) : undefined,
    transport_company_id: p.transportCompanyId
      ? Number(p.transportCompanyId)
      : undefined,
    origin_country_id: p.wizardRouteOriginId
      ? Number(p.wizardRouteOriginId)
      : undefined,
    dest_country_id: p.wizardRouteDestId
      ? Number(p.wizardRouteDestId)
      : undefined,
    ship_line_rate_id: p.shipLineRateId ? Number(p.shipLineRateId) : undefined,
    declared_currency: p.globalCurrency,
    insurance_pct: Number(p.insurancePct) || 0,
    customs_duty_pct: Number(p.customsDutyPct) || 0,
    tax_pct: Number(p.taxPct) || 0,
    discount_pct: Number(p.discountPct) || 0,
    manual_fee: Number(p.manualFee) || 0,
    service_options: {
      ...(p.manualFeeLabel.trim()
        ? { manual_fee_label: p.manualFeeLabel.trim() }
        : {}),
      ...(p.notes.trim() ? { notes: p.notes.trim() } : {}),
    },
  };
  return body;
}
