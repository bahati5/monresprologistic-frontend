import { useEffect, type MutableRefObject } from "react";
import type { WizardShipmentItem } from "@/types/shipmentCreate";

export function useShipmentCreateEditHydration(
  isEditing: boolean,
  existingShipment: unknown,
  setClientId: (v: string) => void,
  setRecipientId: (v: string) => void,
  setWizardRouteOriginId: (v: string) => void,
  setWizardRouteDestId: (v: string) => void,
  setUserOverrodeOrigin: (v: boolean) => void,
  setUserOverrodeDest: (v: boolean) => void,
  setShippingModeId: (v: string) => void,
  setPackagingTypeId: (v: string) => void,
  setTransportCompanyId: (v: string) => void,
  setShipLineRateId: (v: string) => void,
  setInsurancePct: (v: string) => void,
  setCustomsDutyPct: (v: string) => void,
  setTaxPct: (v: string) => void,
  setDiscountPct: (v: string) => void,
  setManualFee: (v: string) => void,
  setManualFeeLabel: (v: string) => void,
  setItems: (v: WizardShipmentItem[]) => void,
  prevRouteRef: MutableRefObject<{ o: string; d: string }>,
) {
  useEffect(() => {
    if (existingShipment && isEditing) {
      const s = existingShipment as Record<string, unknown>;
      const senderId = String(s.sender_profile_id || "");
      const recipientIdVal = String(s.recipient_profile_id || "");
      const originId = String(s.origin_country_id || "");
      const destId = String(s.dest_country_id || "");

      setClientId(senderId);
      setRecipientId(recipientIdVal);
      setWizardRouteOriginId(originId);
      setWizardRouteDestId(destId);
      setUserOverrodeOrigin(true);
      setUserOverrodeDest(true);

      prevRouteRef.current = { o: originId, d: destId };

      const so = (s.service_options as Record<string, unknown>) || {};
      setShippingModeId(String(so.shipping_mode_id || ""));
      setPackagingTypeId(String(so.packaging_type_id || ""));
      setTransportCompanyId(String(so.transport_company_id || ""));
      setShipLineRateId(String(so.ship_line_rate_id || ""));
      setInsurancePct(String(so.insurance_pct ?? "0"));
      setCustomsDutyPct(String(so.customs_duty_pct ?? "0"));
      setTaxPct(String(so.tax_pct ?? "0"));
      setDiscountPct(String(so.discount_pct ?? "0"));
      setManualFee(String(so.manual_fee ?? "0"));
      setManualFeeLabel(String(so.manual_fee_label ?? ""));

      if (Array.isArray(s.items) && (s.items as unknown[]).length > 0) {
        setItems(
          (s.items as Record<string, unknown>[]).map((it) => ({
            description: String(it.description ?? ""),
            quantity: Number(it.quantity) || 1,
            weight_kg: Number(it.weight_kg) || 0,
            value: Number(it.value) || 0,
            length_cm: Number(it.length_cm) || 0,
            width_cm: Number(it.width_cm) || 0,
            height_cm: Number(it.height_cm) || 0,
            category_id: (it.category_id as number | "") ?? "",
          })),
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once per loaded shipment
  }, [existingShipment, isEditing]);
}
