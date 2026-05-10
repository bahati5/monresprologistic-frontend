import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useShipment } from "@/hooks/useShipments";
import { useShipmentWorkflow } from "@/contexts/ShipmentWorkflowContext";

export function useShipmentCreateMeta() {
  const { id: editId } = useParams();
  const [searchParams] = useSearchParams();
  const draftIdFromUrl = useMemo(() => {
    const raw = searchParams.get("draft_id");
    if (!raw || !/^\d+$/.test(raw)) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [searchParams]);
  const isEditing = Boolean(editId);
  const { data: existingShipment, isLoading: loadingExisting } = useShipment(editId);

  const navigate = useNavigate();
  const workflow = useShipmentWorkflow();

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  return {
    editId,
    draftIdFromUrl,
    isEditing,
    existingShipment,
    loadingExisting,
    navigate,
    workflow,
    step,
    setStep,
    errors,
    setErrors,
  };
}

export type ShipmentCreateMeta = ReturnType<typeof useShipmentCreateMeta>;
