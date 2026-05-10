import { useCallback, useEffect, useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";
import api from "@/api/client";
import type { ShipmentWorkflowStep } from "@/contexts/ShipmentWorkflowContext";

export function useShipmentCreateSubmitHandlers(p: {
  navigate: NavigateFunction;
  isEditing: boolean;
  editId: string | undefined;
  clientId: string;
  recipientId: string;
  createdShipmentId: number | null | undefined;
  workflowStep: string;
  canProceedStep1: boolean;
  canProceedStep2: boolean;
  canProceedStep3: boolean;
  step: number;
  legalDeclarationAccepted: boolean;
  notes: string;
  buildWizardPayload: () => Record<string, unknown> | null;
  senderProfileCountryId: number | null | undefined;
  recipientProfileCountryId: number | null | undefined;
  wizardRouteOriginId: string;
  wizardRouteDestId: string;
  createMutation: { isPending: boolean; mutate: (body: Record<string, unknown>, opts?: { onSuccess?: (data: { id?: number }) => void; onError?: (err: unknown) => void }) => void };
  updateMutation: { isPending: boolean; mutate: (args: { id: string | number; payload: Record<string, unknown> }, opts?: { onSuccess?: () => void; onError?: (err: unknown) => void }) => void };
  clearDraftAfterSubmit: () => void;
  setShipmentId: (id: number) => void;
  markStepCompleted: (step: ShipmentWorkflowStep) => void;
  workflowNext: () => void;
  setErrors: (e: Record<string, string[]>) => void;
}) {
  const [shipmentData, setShipmentData] = useState<unknown>(null);
  const [docSettings, setDocSettings] = useState<unknown>(null);

  const fetchShipmentData = useCallback(async (sid: number) => {
    try {
      const r = await api.get(`/api/shipments/${sid}`);
      setShipmentData(r.data?.shipment ?? r.data);
      setDocSettings(r.data?.doc_settings ?? null);
    } catch {
      toast.error("Erreur lors du chargement des données");
    }
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- fetch populates local shipment copy for checkout */
    if (p.workflowStep !== "registration" && p.createdShipmentId && !shipmentData) {
      void fetchShipmentData(p.createdShipmentId);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [p.workflowStep, p.createdShipmentId, shipmentData, fetchShipmentData]);

  const routeOriginMismatchSender = Boolean(
    p.clientId &&
      p.wizardRouteOriginId &&
      p.senderProfileCountryId != null &&
      String(p.senderProfileCountryId) !== p.wizardRouteOriginId,
  );
  const routeDestMismatchRecipient = Boolean(
    p.recipientId &&
      p.wizardRouteDestId &&
      p.recipientProfileCountryId != null &&
      String(p.recipientProfileCountryId) !== p.wizardRouteDestId,
  );

  const canSubmit =
    p.canProceedStep1 &&
    p.canProceedStep2 &&
    p.canProceedStep3 &&
    p.step === 4 &&
    p.legalDeclarationAccepted &&
    !p.createMutation.isPending &&
    !p.updateMutation.isPending;

  const handleDocumentsValidate = () => {
    p.markStepCompleted("documents");
    p.workflowNext();
    toast.success("Documents vérifiés");
  };

  const handleRecordPayment = async (data: {
    amount: number;
    method: string;
    reference?: string;
    note?: string;
  }) => {
    await api.post(`/api/shipments/${p.createdShipmentId}/record-payment`, {
      amount: data.amount,
      payment_method: data.method,
      reference: data.reference,
      notes: data.note,
    });
    if (p.createdShipmentId) await fetchShipmentData(p.createdShipmentId);
  };

  const handlePaymentComplete = () => {
    p.markStepCompleted("checkout");
    toast.success("Paiement validé");
    if (p.createdShipmentId) {
      p.navigate(`/shipments/${p.createdShipmentId}`);
    }
  };

  const handleSubmit = () => {
    const payload = p.buildWizardPayload();
    if (!payload) return;
    if (p.notes.trim()) {
      const so = (payload.service_options as Record<string, unknown>) || {};
      payload.service_options = { ...so, notes: p.notes.trim() };
    }

    const finalPayload = {
      ...payload,
      legal_declaration_accepted: true,
    };

    if (p.isEditing && p.editId) {
      p.updateMutation.mutate(
        { id: p.editId, payload: finalPayload },
        {
          onSuccess: () => {
            p.clearDraftAfterSubmit();
            p.setShipmentId(Number(p.editId));
            p.markStepCompleted("registration");
            p.workflowNext();
          },
          onError: (err: unknown) => {
            const e = err as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } };
            if (e.response?.status === 422) {
              p.setErrors(e.response.data?.errors || {});
            }
          },
        },
      );
    } else {
      p.createMutation.mutate(finalPayload, {
        onSuccess: (data: { id?: number }) => {
          const newId = data?.id;
          if (newId) {
            p.clearDraftAfterSubmit();
            p.setShipmentId(newId);
            p.markStepCompleted("registration");
            p.workflowNext();
            toast.success("Expédition créée avec succès");
          } else {
            p.navigate("/shipments");
          }
        },
        onError: (err: unknown) => {
          const e = err as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } };
          if (e.response?.status === 422) {
            p.setErrors(e.response.data?.errors || {});
          }
        },
      });
    }
  };

  const trackingNumber =
    (shipmentData as { public_tracking?: string } | null)?.public_tracking ||
    (p.createdShipmentId ? `#${p.createdShipmentId}` : "");

  return {
    shipmentData,
    docSettings,
    fetchShipmentData,
    routeOriginMismatchSender,
    routeDestMismatchRecipient,
    canSubmit,
    handleDocumentsValidate,
    handleRecordPayment,
    handlePaymentComplete,
    handleSubmit,
    trackingNumber,
  };
}
