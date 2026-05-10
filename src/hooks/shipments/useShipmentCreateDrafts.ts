import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { toast } from "sonner";
import {
  useCheckExistingDraft,
  useDraft,
  useDraftAutoSave,
  useDeleteDraft,
} from "@/hooks/useDrafts";
import type { FormDraft } from "@/hooks/useDrafts";
import type { WizardShipmentItem } from "@/types/shipmentCreate";

/* eslint-disable react-hooks/set-state-in-effect -- draft resume/hydration mirrors legacy wizard */
export function useShipmentCreateDrafts(p: {
  workflowStep: string;
  isEditing: boolean;
  draftIdFromUrl: number | undefined;
  step: number;
  setStep: (n: number) => void;
  buildWizardPayload: () => Record<string, unknown> | null;
  setClientId: (v: string) => void;
  setRecipientId: (v: string) => void;
  setWizardRouteOriginId: (v: string) => void;
  setWizardRouteDestId: (v: string) => void;
  setUserOverrodeOrigin: (v: boolean) => void;
  setUserOverrodeDest: (v: boolean) => void;
  setShippingModeId: (v: string) => void;
  setPackagingTypeId: (v: string) => void;
  setTransportCompanyId: (v: string) => void;
  setShipLineRateId: (v: string) => void;
  setInsurancePct: (v: string) => void;
  setCustomsDutyPct: (v: string) => void;
  setTaxPct: (v: string) => void;
  setDiscountPct: (v: string) => void;
  setManualFee: (v: string) => void;
  setManualFeeLabel: (v: string) => void;
  setNotes: (v: string) => void;
  setItems: (v: WizardShipmentItem[]) => void;
  prevRouteRef: MutableRefObject<{ o: string; d: string }>;
}) {
  const {
    workflowStep,
    isEditing,
    draftIdFromUrl,
    step,
    buildWizardPayload,
  } = p;

  const [draftDialogOpen, setDraftDialogOpen] = useState(false);
  const [draftChecked, setDraftChecked] = useState(false);
  const deleteDraftMutation = useDeleteDraft();
  const urlDraftHydratedRef = useRef(false);
  const pRef = useRef(p);
  useEffect(() => {
    pRef.current = p;
  });

  const draftPayload = useMemo(() => {
    if (workflowStep !== "registration" || isEditing) return null;
    return buildWizardPayload() as Record<string, unknown> | null;
  }, [workflowStep, isEditing, buildWizardPayload]);

  const { data: existingDraft } = useCheckExistingDraft(
    "shipment",
    !isEditing && !draftChecked && !draftIdFromUrl,
  );

  const { data: draftFromUrl, isSuccess: draftFromUrlReady, isError: draftFromUrlError } =
    useDraft(!isEditing && draftIdFromUrl ? draftIdFromUrl : undefined);

  const {
    lastSavedAt: draftLastSavedAt,
    isSaving: draftIsSaving,
    saveDraftManually,
    loadDraft,
    clearAfterSubmit: clearDraftAfterSubmit,
  } = useDraftAutoSave("shipment", draftPayload, {
    enabled: draftChecked && !isEditing,
    metadata: { current_step: step, workflow_step: workflowStep },
  });

  const hydrateFromDraft = useCallback((draft: FormDraft) => {
    const payload = draft.payload as Record<string, unknown>;
    const meta = (draft.metadata || {}) as Record<string, unknown>;
    const ap = pRef.current;

    if (payload.sender_profile_id != null && String(payload.sender_profile_id) !== "") {
      ap.setClientId(String(payload.sender_profile_id));
    }
    if (payload.recipient_profile_id != null && String(payload.recipient_profile_id) !== "") {
      ap.setRecipientId(String(payload.recipient_profile_id));
    }

    if (payload.origin_country_id) {
      ap.setWizardRouteOriginId(String(payload.origin_country_id));
      ap.setUserOverrodeOrigin(true);
    }
    if (payload.dest_country_id) {
      ap.setWizardRouteDestId(String(payload.dest_country_id));
      ap.setUserOverrodeDest(true);
    }

    if (payload.shipping_mode_id) ap.setShippingModeId(String(payload.shipping_mode_id));
    if (payload.packaging_type_id) ap.setPackagingTypeId(String(payload.packaging_type_id));
    if (payload.transport_company_id) {
      ap.setTransportCompanyId(String(payload.transport_company_id));
    }
    if (payload.ship_line_rate_id) ap.setShipLineRateId(String(payload.ship_line_rate_id));

    const so = (payload.service_options as Record<string, unknown>) || {};
    const pct = (key: string, setter: (v: string) => void) => {
      const direct = payload[key];
      const nested = so[key];
      const val = direct ?? nested;
      if (val != null && val !== "") setter(String(val));
    };
    pct("insurance_pct", ap.setInsurancePct);
    pct("customs_duty_pct", ap.setCustomsDutyPct);
    pct("tax_pct", ap.setTaxPct);
    pct("discount_pct", ap.setDiscountPct);
    pct("manual_fee", ap.setManualFee);
    if (so.manual_fee_label) ap.setManualFeeLabel(String(so.manual_fee_label));

    const noteVal = payload.notes ?? so.notes;
    if (noteVal) ap.setNotes(String(noteVal));

    if (Array.isArray(payload.items) && payload.items.length > 0) {
      ap.setItems(
        (payload.items as Record<string, unknown>[]).map((it) => ({
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

    const cs = meta.current_step;
    if (typeof cs === "number" && cs >= 1 && cs <= 4) {
      ap.setStep(cs);
    } else if (typeof cs === "string") {
      const n = parseInt(cs, 10);
      if (n >= 1 && n <= 4) ap.setStep(n);
    }

    const origin = payload.origin_country_id ? String(payload.origin_country_id) : "";
    const dest = payload.dest_country_id ? String(payload.dest_country_id) : "";
    ap.prevRouteRef.current = { o: origin, d: dest };
  }, []);

  useEffect(() => {
    if (!draftIdFromUrl || isEditing) return;
    if (!draftFromUrlError) return;
    toast.error("Ce brouillon est introuvable ou a expiré.");
    setDraftChecked(true);
  }, [draftIdFromUrl, draftFromUrlError, isEditing]);

  useEffect(() => {
    if (isEditing || draftChecked || urlDraftHydratedRef.current) return;
    if (!draftIdFromUrl || !draftFromUrlReady || !draftFromUrl) return;

    hydrateFromDraft(draftFromUrl);
    loadDraft(draftFromUrl);
    setDraftChecked(true);
    urlDraftHydratedRef.current = true;
  }, [
    isEditing,
    draftChecked,
    draftIdFromUrl,
    draftFromUrlReady,
    draftFromUrl,
    hydrateFromDraft,
    loadDraft,
  ]);

  useEffect(() => {
    if (draftChecked || isEditing || draftIdFromUrl) return;

    if (existingDraft) {
      setDraftDialogOpen(true);
    } else if (existingDraft === null) {
      setDraftChecked(true);
    }
  }, [existingDraft, draftChecked, isEditing, draftIdFromUrl]);

  const handleResumeDraft = (draft: FormDraft) => {
    hydrateFromDraft(draft);
    loadDraft(draft);
    setDraftDialogOpen(false);
    setDraftChecked(true);
  };

  const handleDiscardDraft = (draft: FormDraft) => {
    deleteDraftMutation.mutate(draft.id);
    setDraftDialogOpen(false);
    setDraftChecked(true);
  };

  return {
    draftDialogOpen,
    setDraftDialogOpen,
    draftChecked,
    draftLastSavedAt,
    draftIsSaving,
    saveDraftManually,
    clearDraftAfterSubmit,
    existingDraft,
    handleResumeDraft,
    handleDiscardDraft,
  };
}
