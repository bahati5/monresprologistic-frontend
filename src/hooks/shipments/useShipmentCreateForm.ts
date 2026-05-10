import { useMemo, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useShipmentCreateMeta } from "@/hooks/shipments/useShipmentCreateMeta";
import { useShipmentCreateQueries } from "@/hooks/shipments/useShipmentCreateQueries";
import { useShipmentCreateActors } from "@/hooks/shipments/useShipmentCreateActors";
import { useShipmentCreateLogistics } from "@/hooks/shipments/useShipmentCreateLogistics";
import { useShipmentCreateItems } from "@/hooks/shipments/useShipmentCreateItems";
import { useShipmentCreatePricing } from "@/hooks/shipments/useShipmentCreatePricing";
import { useShipmentCreateEditHydration } from "@/hooks/shipments/useShipmentCreateEditHydration";
import { useShipmentCreatePayloadAndPreview } from "@/hooks/shipments/useShipmentCreatePayloadAndPreview";
import { useShipmentCreateDrafts } from "@/hooks/shipments/useShipmentCreateDrafts";
import { useShipmentCreateSubmitHandlers } from "@/hooks/shipments/useShipmentCreateSubmitHandlers";

export function useShipmentCreateForm() {
  const { user } = useAuthStore();
  const meta = useShipmentCreateMeta();
  const q = useShipmentCreateQueries();

  const [clientId, setClientId] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [userOverrodeOrigin, setUserOverrodeOrigin] = useState(false);
  const [userOverrodeDest, setUserOverrodeDest] = useState(false);

  const actors = useShipmentCreateActors(
    clientId,
    setClientId,
    recipientId,
    setRecipientId,
    setUserOverrodeOrigin,
    setUserOverrodeDest,
  );

  const logistics = useShipmentCreateLogistics(
    clientId,
    recipientId,
    actors.senderClientDetail,
    actors.recipientClientDetail,
    userOverrodeOrigin,
    setUserOverrodeOrigin,
    userOverrodeDest,
    setUserOverrodeDest,
    q.modeList,
    q.packagingList,
    q.transportCompanyList,
    q.countryList,
    actors.profileCountriesForPin,
    q.volumetricDivisorApprox,
  );

  const itemsBlock = useShipmentCreateItems();

  const pricing = useShipmentCreatePricing(q.options);

  useShipmentCreateEditHydration(
    meta.isEditing,
    meta.existingShipment,
    setClientId,
    setRecipientId,
    logistics.setWizardRouteOriginId,
    logistics.setWizardRouteDestId,
    setUserOverrodeOrigin,
    setUserOverrodeDest,
    logistics.setShippingModeId,
    logistics.setPackagingTypeId,
    logistics.setTransportCompanyId,
    logistics.setShipLineRateId,
    pricing.setInsurancePct,
    pricing.setCustomsDutyPct,
    pricing.setTaxPct,
    pricing.setDiscountPct,
    pricing.setManualFee,
    pricing.setManualFeeLabel,
    itemsBlock.setItems,
    logistics.prevRouteRef,
  );

  const { buildWizardPayload } = useShipmentCreatePayloadAndPreview({
    clientId,
    recipientId,
    isEditing: meta.isEditing,
    createdShipmentId: meta.workflow.shipmentId,
    items: itemsBlock.items,
    itemsEntryMode: itemsBlock.itemsEntryMode,
    globalTotalWeightKg: itemsBlock.globalTotalWeightKg,
    globalTotalDeclaredValue: itemsBlock.globalTotalDeclaredValue,
    shippingModeId: logistics.shippingModeId,
    packagingTypeId: logistics.packagingTypeId,
    transportCompanyId: logistics.transportCompanyId,
    wizardRouteOriginId: logistics.wizardRouteOriginId,
    wizardRouteDestId: logistics.wizardRouteDestId,
    shipLineRateId: logistics.shipLineRateId,
    baseDeliveryLabelForItems: logistics.baseDeliveryLabelForItems,
    insurancePct: pricing.insurancePct,
    customsDutyPct: pricing.customsDutyPct,
    taxPct: pricing.taxPct,
    discountPct: pricing.discountPct,
    manualFee: pricing.manualFee,
    manualFeeLabel: pricing.manualFeeLabel,
    notes: pricing.notes,
    globalCurrency: q.globalCurrency,
    agencyId: user?.agency_id ?? null,
    step: meta.step,
    runPreview: q.preview.mutate,
  });

  const drafts = useShipmentCreateDrafts({
    workflowStep: meta.workflow.currentStep,
    isEditing: meta.isEditing,
    draftIdFromUrl: meta.draftIdFromUrl,
    step: meta.step,
    setStep: meta.setStep,
    buildWizardPayload,
    setClientId,
    setRecipientId,
    setWizardRouteOriginId: logistics.setWizardRouteOriginId,
    setWizardRouteDestId: logistics.setWizardRouteDestId,
    setUserOverrodeOrigin,
    setUserOverrodeDest,
    setShippingModeId: logistics.setShippingModeId,
    setPackagingTypeId: logistics.setPackagingTypeId,
    setTransportCompanyId: logistics.setTransportCompanyId,
    setShipLineRateId: logistics.setShipLineRateId,
    setInsurancePct: pricing.setInsurancePct,
    setCustomsDutyPct: pricing.setCustomsDutyPct,
    setTaxPct: pricing.setTaxPct,
    setDiscountPct: pricing.setDiscountPct,
    setManualFee: pricing.setManualFee,
    setManualFeeLabel: pricing.setManualFeeLabel,
    setNotes: pricing.setNotes,
    setItems: itemsBlock.setItems,
    prevRouteRef: logistics.prevRouteRef,
  });

  const canProceedStep1 = Boolean(clientId && recipientId);

  const routeOriginMismatchSender = useMemo(
    () =>
      Boolean(
        clientId &&
          logistics.wizardRouteOriginId &&
          actors.senderProfileCountryId != null &&
          String(actors.senderProfileCountryId) !== logistics.wizardRouteOriginId,
      ),
    [
      clientId,
      logistics.wizardRouteOriginId,
      actors.senderProfileCountryId,
    ],
  );

  const routeDestMismatchRecipient = useMemo(
    () =>
      Boolean(
        recipientId &&
          logistics.wizardRouteDestId &&
          actors.recipientProfileCountryId != null &&
          String(actors.recipientProfileCountryId) !== logistics.wizardRouteDestId,
      ),
    [
      recipientId,
      logistics.wizardRouteDestId,
      actors.recipientProfileCountryId,
    ],
  );

  const canProceedStep3 = Boolean(
    logistics.wizardRouteOriginId &&
    logistics.wizardRouteDestId &&
    logistics.shippingModeId &&
    (logistics.showModeCards || Boolean(logistics.shipLineRateId)) &&
    !routeOriginMismatchSender &&
    !routeDestMismatchRecipient,
  );

  const submit = useShipmentCreateSubmitHandlers({
    navigate: meta.navigate,
    isEditing: meta.isEditing,
    editId: meta.editId,
    clientId,
    recipientId,
    createdShipmentId: meta.workflow.shipmentId,
    workflowStep: meta.workflow.currentStep,
    canProceedStep1,
    canProceedStep2: itemsBlock.canProceedStep2,
    canProceedStep3,
    step: meta.step,
    legalDeclarationAccepted: pricing.legalDeclarationAccepted,
    notes: pricing.notes,
    buildWizardPayload,
    senderProfileCountryId: actors.senderProfileCountryId,
    recipientProfileCountryId: actors.recipientProfileCountryId,
    wizardRouteOriginId: logistics.wizardRouteOriginId,
    wizardRouteDestId: logistics.wizardRouteDestId,
    createMutation: q.createMutation,
    updateMutation: q.updateMutation,
    clearDraftAfterSubmit: drafts.clearDraftAfterSubmit,
    setShipmentId: (id) => meta.workflow.setShipmentId(id),
    markStepCompleted: meta.workflow.markStepCompleted,
    workflowNext: meta.workflow.nextStep,
    setErrors: meta.setErrors,
  });

  const totalVolEquivKg = useMemo(
    () =>
      itemsBlock.items.reduce((sum, i) => {
        const l = Number(i.length_cm) || 0;
        const wcm = Number(i.width_cm) || 0;
        const h = Number(i.height_cm) || 0;
        if (l <= 0 || wcm <= 0 || h <= 0) return sum;
        return (
          sum + ((l * wcm * h) / logistics.displayVolumetricDivisor) * i.quantity
        );
      }, 0),
    [itemsBlock.items, logistics.displayVolumetricDivisor],
  );

  const snap = q.preview.data?.pricing_snapshot as
    | Record<string, number | string>
    | undefined;

  return {
    user,
    meta,
    q,
    clientId,
    setClientId,
    recipientId,
    setRecipientId,
    actors,
    logistics,
    itemsBlock,
    pricing,
    drafts,
    buildWizardPayload,
    canProceedStep1,
    canProceedStep3,
    routeOriginMismatchSender,
    routeDestMismatchRecipient,
    submit,
    snap,
    previewPending: q.preview.isPending,
    totalVolEquivKg,
  };
}
