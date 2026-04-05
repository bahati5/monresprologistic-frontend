import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useCreateShipment,
  useShipmentCreateOptions,
  usePreviewQuote,
  useShipLinesForRoute,
} from "@/hooks/useShipments";
import { useAppSettings, useFormatMoney } from "@/hooks/useSettings";
import { resolveMoneySymbol } from "@/lib/formatCurrency";
import { useClient } from "@/hooks/useCrm";
import { CountryFlag } from "@/components/CountryFlag";
import { profileCountryIdFromApi } from "@/lib/profileCountry";
import api from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DbCombobox } from "@/components/ui/DbCombobox";
import { ShipmentWizardStepper } from "@/components/workflow/ShipmentWizardStepper";
import {
  ShipmentWorkflowProvider,
  useShipmentWorkflow,
} from "@/contexts/ShipmentWorkflowContext";
import { ShipmentProcessSteps } from "@/components/workflow/ShipmentProcessSteps";
import { DocumentPreviewStep } from "@/components/workflow/DocumentPreviewStep";
import { CheckoutStep } from "@/components/workflow/CheckoutStep";
import { Step1Actors } from "@/components/workflow/Step1Actors";
import {
  WizardCountryCreateDialog,
  WizardPackagingCreateDialog,
  WizardShipLineCreateDialog,
  WizardTransportCreateDialog,
} from "@/components/workflow/ShipmentWizardCreateDialogs";
import { useAuthStore } from "@/stores/authStore";
import { userCan } from "@/lib/permissions";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Plus,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { displayLocalized } from "@/lib/localizedString";
import { cn } from "@/lib/utils";

interface ShipmentItem {
  description: string;
  quantity: number;
  weight_kg: number;
  value: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  origin_country_id: string;
}

type ItemsEntryMode = "per_item" | "global";

type WizardCountryRow = {
  id: number;
  name: unknown;
  code?: string | null;
  iso2?: string | null;
  emoji?: string | null;
};

function wizardRateUnitPrice(rate: Record<string, unknown>): number {
  const raw = rate.unit_price ?? rate.unitPrice;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = parseFloat(raw.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function firstDeliveryOptionFromMode(mode: unknown): string {
  if (!mode || typeof mode !== "object") return "";
  const m = mode as { delivery_options?: unknown; deliveryOptions?: unknown };
  const raw = m.delivery_options ?? m.deliveryOptions;
  if (!Array.isArray(raw)) return "";
  for (const x of raw) {
    const t = String(x).trim();
    if (t !== "") return t;
  }
  return "";
}

function effectiveDelayLabelForRate(rate: Record<string, unknown>): string {
  const ov = rate.delivery_label_override;
  if (typeof ov === "string" && ov.trim() !== "") return ov.trim();
  const sm = rate.shipping_mode as Record<string, unknown> | undefined;
  return firstDeliveryOptionFromMode(sm);
}

function WizardFlagsChips({
  countries,
}: {
  countries: Record<string, unknown>[];
}) {
  if (!countries.length) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      {countries.map((c) => {
        const id = String(c.id ?? "");
        const name = displayLocalized(c.name);
        const iso =
          (c.iso2 as string | undefined) ||
          (c.code as string | undefined) ||
          "";
        return (
          <span
            key={id}
            title={name}
            className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/40 px-1.5 py-0.5 text-xs">
            <CountryFlag
              emoji={c.emoji as string | null | undefined}
              iso2={c.iso2 as string | null | undefined}
              code={c.code as string | null | undefined}
              className="!h-3 !w-4 shrink-0"
            />
            <span className="max-w-[7rem] truncate">{name}</span>
            {iso ? (
              <span className="text-muted-foreground">({iso})</span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

type LogisticsModal =
  | null
  | { k: "country"; line: number; hint?: string }
  | { k: "packaging"; hint?: string }
  | { k: "transport"; hint?: string };

function ShipmentCreateContent() {
  const navigate = useNavigate();
  const {
    currentStep: workflowStep,
    completedSteps,
    goToStep,
    nextStep: workflowNext,
    markStepCompleted,
    shipmentId: createdShipmentId,
    setShipmentId,
  } = useShipmentWorkflow();

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [clientId, setClientId] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [items, setItems] = useState<ShipmentItem[]>([
    {
      description: "",
      quantity: 1,
      weight_kg: 0,
      value: 0,
      length_cm: 0,
      width_cm: 0,
      height_cm: 0,
      origin_country_id: "",
    },
  ]);
  const [itemsEntryMode, setItemsEntryMode] = useState<ItemsEntryMode>("per_item");
  const [globalTotalWeightKg, setGlobalTotalWeightKg] = useState("");
  const [globalTotalDeclaredValue, setGlobalTotalDeclaredValue] = useState("");
  const [shippingModeId, setShippingModeId] = useState("");
  const [packagingTypeId, setPackagingTypeId] = useState("");
  const [transportCompanyId, setTransportCompanyId] = useState("");
  const [shippingModeFilter, setShippingModeFilter] = useState("");
  const [logisticsModal, setLogisticsModal] = useState<LogisticsModal>(null);
  const [shipLineWizardOpen, setShipLineWizardOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const { user } = useAuthStore();
  const [wizardRouteOriginId, setWizardRouteOriginId] = useState("");
  const [wizardRouteDestId, setWizardRouteDestId] = useState("");
  const [shipLineRateId, setShipLineRateId] = useState("");

  const [insurancePct, setInsurancePct] = useState("0");
  const [customsDutyPct, setCustomsDutyPct] = useState("0");
  const [taxPct, setTaxPct] = useState("0");
  const [discountPct, setDiscountPct] = useState("0");
  const [manualFee, setManualFee] = useState("0");
  const [manualFeeLabel, setManualFeeLabel] = useState("");
  const [legalDeclarationAccepted, setLegalDeclarationAccepted] =
    useState(false);

  // Post-creation state for workflow phases
  const [shipmentData, setShipmentData] = useState<any>(null);
  const [docSettings, setDocSettings] = useState<any>(null);

  const { data: options, isLoading: loadingOptions } =
    useShipmentCreateOptions();
  const { data: appSettings } = useAppSettings();
  const { formatMoney } = useFormatMoney();
  const globalCurrency = String(appSettings?.currency ?? "USD").toUpperCase();
  const currencyUiLabel = resolveMoneySymbol({
    currency: globalCurrency,
    currency_symbol: String(appSettings?.currency_symbol ?? ""),
  });
  const volumetricDivisorApprox = useMemo(() => {
    const raw = (options as { volumetricDivisor?: number } | undefined)
      ?.volumetricDivisor;
    const n = typeof raw === "number" && Number.isFinite(raw) ? raw : 5000;
    return Math.max(1, n);
  }, [options]);
  const createMutation = useCreateShipment();
  const {
    mutate: runPreview,
    data: previewData,
    isPending: previewPending,
  } = usePreviewQuote();

  const { data: senderClientDetail } = useClient(clientId || undefined);
  const { data: recipientClientDetail } = useClient(recipientId || undefined);

  const modeList = useMemo(
    () => (Array.isArray(options?.shippingModes) ? options.shippingModes : []),
    [options?.shippingModes],
  );
  const packagingList = useMemo(
    () =>
      Array.isArray(options?.packagingTypes) ? options.packagingTypes : [],
    [options?.packagingTypes],
  );
  const transportCompanyList = useMemo(
    () =>
      Array.isArray(options?.transportCompanies)
        ? options.transportCompanies
        : [],
    [options?.transportCompanies],
  );
  const countryList = useMemo(
    () => (Array.isArray(options?.countries) ? options.countries : []),
    [options?.countries],
  );

  const { data: routeLinesData, isFetching: routeLinesLoading } =
    useShipLinesForRoute(wizardRouteOriginId, wizardRouteDestId);
  const routeShipLines = useMemo(
    () =>
      (Array.isArray(routeLinesData?.ship_lines)
        ? routeLinesData.ship_lines
        : []) as Record<string, unknown>[],
    [routeLinesData?.ship_lines],
  );
  const hasRouteLines = routeShipLines.length > 0;

  const modesFiltered = useMemo(() => {
    const q = shippingModeFilter.trim().toLowerCase();
    if (!q) return modeList;
    return modeList.filter((m: { name: unknown }) =>
      String(displayLocalized(m.name as string))
        .toLowerCase()
        .includes(q),
    );
  }, [modeList, shippingModeFilter]);

  const selectedMode = useMemo(
    () => modeList.find((m: { id: number }) => String(m.id) === shippingModeId),
    [modeList, shippingModeId],
  );

  const tariffBaseDeliveryLabel = useMemo(() => {
    if (!shipLineRateId) return "";
    for (const line of routeShipLines) {
      const rates = (
        Array.isArray(line.rates) ? line.rates : []
      ) as Record<string, unknown>[];
      const rate = rates.find((r) => String(r.id ?? "") === shipLineRateId);
      if (!rate) continue;
      const eff = effectiveDelayLabelForRate(rate);
      if (eff !== "") return eff;
    }
    return "";
  }, [shipLineRateId, routeShipLines]);

  const deliveryOptionLabels = useMemo(() => {
    const raw = selectedMode
      ? ((
          selectedMode as {
            delivery_options?: unknown[];
            deliveryOptions?: unknown[];
          }
        ).delivery_options ??
        (selectedMode as { deliveryOptions?: unknown[] }).deliveryOptions ??
        [])
      : [];
    if (!Array.isArray(raw)) return [];
    return raw.map((x) => String(x)).filter((s) => s.trim() !== "");
  }, [selectedMode]);

  const baseDeliveryLabelForItems = useMemo(
    () => tariffBaseDeliveryLabel || deliveryOptionLabels[0] || "",
    [tariffBaseDeliveryLabel, deliveryOptionLabels],
  );

  const pricingDefaultsApplied = useRef(false);
  useEffect(() => {
    if (!options || pricingDefaultsApplied.current) return;
    pricingDefaultsApplied.current = true;
    setInsurancePct(String(options.defaultInsurancePct ?? "0"));
    setCustomsDutyPct(String(options.defaultCustomsDutyPct ?? "0"));
    setTaxPct(String(options.defaultTaxPct ?? "0"));
  }, [options]);

  useEffect(() => {
    setRecipientId("");
  }, [clientId]);

  useEffect(() => {
    setShipLineRateId("");
  }, [wizardRouteOriginId, wizardRouteDestId]);

  useEffect(() => {
    if (!clientId) {
      setWizardRouteOriginId("");
      return;
    }
    const cid = profileCountryIdFromApi(senderClientDetail);
    if (cid != null) setWizardRouteOriginId(String(cid));
  }, [clientId, senderClientDetail]);

  useEffect(() => {
    if (!recipientId) {
      setWizardRouteDestId("");
      return;
    }
    const cid = profileCountryIdFromApi(recipientClientDetail);
    if (cid != null) setWizardRouteDestId(String(cid));
  }, [recipientId, recipientClientDetail]);

  useEffect(() => {
    if (step !== 2 || !wizardRouteOriginId) return;
    setItems((prev) =>
      prev.map((i) => {
        if (!i.origin_country_id) {
          return { ...i, origin_country_id: String(wizardRouteOriginId) };
        }
        return i;
      }),
    );
  }, [step, wizardRouteOriginId]);

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

  const buildWizardPayload = useCallback((): Record<string, unknown> | null => {
    if (!clientId || !recipientId) return null;
    const baseDelay = baseDeliveryLabelForItems;
    const totalQty = items.reduce(
      (s, i) => s + Number(i.quantity || 0),
      0,
    );
    const gw =
      itemsEntryMode === "global" && totalQty > 0
        ? parseFloat(String(globalTotalWeightKg).replace(",", "."))
        : NaN;
    const gv =
      itemsEntryMode === "global" && totalQty > 0
        ? parseFloat(String(globalTotalDeclaredValue).replace(",", "."))
        : NaN;
    const perUnitW =
      itemsEntryMode === "global" && totalQty > 0 && Number.isFinite(gw)
        ? gw / totalQty
        : null;
    const perUnitV =
      itemsEntryMode === "global" && totalQty > 0 && Number.isFinite(gv)
        ? gv / totalQty
        : null;

    const body: Record<string, unknown> = {
      sender_profile_id: Number(clientId),
      recipient_profile_id: Number(recipientId),
      items: items.map((i) => {
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
          ...(i.origin_country_id
            ? { origin_country_id: Number(i.origin_country_id) }
            : {}),
          ...(eff ? { delivery_time_label: eff } : {}),
        };
      }),
      shipping_mode_id: shippingModeId ? Number(shippingModeId) : undefined,
      ...(user?.agency_id != null
        ? { agency_id: Number(user.agency_id) }
        : {}),
      packaging_type_id: packagingTypeId ? Number(packagingTypeId) : undefined,
      transport_company_id: transportCompanyId
        ? Number(transportCompanyId)
        : undefined,
      origin_country_id: wizardRouteOriginId
        ? Number(wizardRouteOriginId)
        : undefined,
      dest_country_id: wizardRouteDestId
        ? Number(wizardRouteDestId)
        : undefined,
      ship_line_rate_id: shipLineRateId ? Number(shipLineRateId) : undefined,
      declared_currency: globalCurrency,
      insurance_pct: Number(insurancePct) || 0,
      customs_duty_pct: Number(customsDutyPct) || 0,
      tax_pct: Number(taxPct) || 0,
      discount_pct: Number(discountPct) || 0,
      manual_fee: Number(manualFee) || 0,
      service_options: {
        ...(manualFeeLabel.trim()
          ? { manual_fee_label: manualFeeLabel.trim() }
          : {}),
      },
    };
    return body;
  }, [
    clientId,
    recipientId,
    items,
    itemsEntryMode,
    globalTotalWeightKg,
    globalTotalDeclaredValue,
    shippingModeId,
    user?.agency_id,
    packagingTypeId,
    transportCompanyId,
    wizardRouteOriginId,
    wizardRouteDestId,
    shipLineRateId,
    baseDeliveryLabelForItems,
    insurancePct,
    customsDutyPct,
    taxPct,
    discountPct,
    manualFee,
    manualFeeLabel,
    globalCurrency,
  ]);

  useEffect(() => {
    if (step !== 4) return;
    const body = buildWizardPayload();
    if (!body || !shippingModeId) return;
    const t = window.setTimeout(() => {
      runPreview(body, {
        onError: () => {
          /* erreurs preview non bloquantes */
        },
      });
    }, 450);
    return () => window.clearTimeout(t);
  }, [
    step,
    buildWizardPayload,
    shippingModeId,
    runPreview,
    wizardRouteOriginId,
    wizardRouteDestId,
    shipLineRateId,
    items,
    baseDeliveryLabelForItems,
  ]);

  const addItem = () => {
    setItems([
      ...items,
      {
        description: "",
        quantity: 1,
        weight_kg: 0,
        value: 0,
        length_cm: 0,
        width_cm: 0,
        height_cm: 0,
        origin_country_id: wizardRouteOriginId || "",
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof ShipmentItem,
    value: string | number,
  ) => {
    const newItems = [...items];
    let next: string | number = value;
    if (field === "origin_country_id") {
      next = value === "" || value === "__none" ? "" : String(value);
    }
    newItems[index] = { ...newItems[index], [field]: next };
    setItems(newItems);
  };

  // Fetch full shipment data after creation (for Documents/Checkout/Dispatch phases)
  const fetchShipmentData = useCallback(async (sid: number) => {
    try {
      const r = await api.get(`/api/shipments/${sid}`);
      setShipmentData(r.data?.shipment ?? r.data);
      setDocSettings(r.data?.doc_settings ?? null);
    } catch {
      toast.error("Erreur lors du chargement des données");
    }
  }, []);

  // When workflow advances past registration, fetch the shipment data
  useEffect(() => {
    if (workflowStep !== "registration" && createdShipmentId && !shipmentData) {
      fetchShipmentData(createdShipmentId);
    }
  }, [workflowStep, createdShipmentId, shipmentData, fetchShipmentData]);

  const handleDocumentsValidate = () => {
    markStepCompleted("documents");
    workflowNext();
    toast.success("Documents vérifiés");
  };

  const handleRecordPayment = async (data: {
    amount: number;
    method: string;
    reference?: string;
    note?: string;
  }) => {
    await api.post(`/api/shipments/${createdShipmentId}/record-payment`, {
      amount: data.amount,
      payment_method: data.method,
      reference: data.reference,
      notes: data.note,
    });
    if (createdShipmentId) await fetchShipmentData(createdShipmentId);
  };

  const handlePaymentComplete = () => {
    markStepCompleted("checkout");
    toast.success("Paiement validé");
    if (createdShipmentId) {
      navigate(`/shipments/${createdShipmentId}`);
    }
  };

  const handleSubmit = () => {
    const payload = buildWizardPayload();
    if (!payload) return;
    if (notes.trim()) {
      const so = (payload.service_options as Record<string, unknown>) || {};
      payload.service_options = { ...so, notes: notes.trim() };
    }

    createMutation.mutate(
      { ...payload, legal_declaration_accepted: true },
      {
        onSuccess: (data: { id?: number }) => {
          const newId = data?.id;
          if (newId) {
            setShipmentId(newId);
            markStepCompleted("registration");
            workflowNext();
            toast.success("Expédition créée avec succès");
          } else {
            navigate("/shipments");
          }
        },
        onError: (err: {
          response?: {
            status?: number;
            data?: { errors?: Record<string, string[]> };
          };
        }) => {
          if (err.response?.status === 422) {
            setErrors(err.response.data?.errors || {});
          }
        },
      },
    );
  };

  const snap = previewData?.pricing_snapshot as
    | Record<string, number | string>
    | undefined;

  const canProceedStep1 = Boolean(clientId && recipientId);
  const canProceedStep2 =
    items.length > 0 &&
    items.every((i) => i.description && i.quantity > 0) &&
    (itemsEntryMode === "per_item" ||
      (() => {
        const tq = items.reduce((s, i) => s + i.quantity, 0);
        if (tq <= 0) return false;
        const w = parseFloat(String(globalTotalWeightKg).replace(",", "."));
        const v = parseFloat(String(globalTotalDeclaredValue).replace(",", "."));
        return Number.isFinite(w) && w >= 0 && Number.isFinite(v) && v >= 0;
      })());
  const showModeCards =
    !wizardRouteOriginId || !wizardRouteDestId || !hasRouteLines;
  const canProceedStep3 = Boolean(
    wizardRouteOriginId &&
    wizardRouteDestId &&
    shippingModeId &&
    (showModeCards || Boolean(shipLineRateId)),
  );
  const canSubmit =
    canProceedStep1 &&
    canProceedStep2 &&
    canProceedStep3 &&
    step === 4 &&
    legalDeclarationAccepted &&
    !createMutation.isPending;

  const packagingOptions = useMemo(
    () => [
      { value: "__none", label: "Aucun", keywords: ["aucun"] },
      ...packagingList.map((p: { id: number; name: unknown }) => ({
        value: String(p.id),
        label: displayLocalized(p.name as string),
        keywords: [String(displayLocalized(p.name as string))],
      })),
    ],
    [packagingList],
  );

  const canManageSettings = userCan(user, "manage_settings");

  const profileCountriesForPin = useMemo((): WizardCountryRow[] => {
    const rows: WizardCountryRow[] = [];
    const push = (raw: unknown) => {
      if (!raw || typeof raw !== "object") return;
      const c = raw as {
        id?: number;
        name?: unknown;
        code?: string | null;
        iso2?: string | null;
        emoji?: string | null;
      };
      if (c.id == null) return;
      rows.push({
        id: c.id,
        name: c.name ?? "",
        code: c.code ?? null,
        iso2: c.iso2 ?? null,
        emoji: c.emoji ?? null,
      });
    };
    push((senderClientDetail as { country?: unknown } | undefined)?.country);
    push((recipientClientDetail as { country?: unknown } | undefined)?.country);
    return rows;
  }, [senderClientDetail, recipientClientDetail]);

  const mergedCountryList = useMemo((): WizardCountryRow[] => {
    const byId = new Map<string, WizardCountryRow>();
    for (const c of countryList as WizardCountryRow[]) {
      byId.set(String(c.id), c);
    }
    for (const p of profileCountriesForPin) {
      if (!byId.has(String(p.id))) {
        byId.set(String(p.id), p);
      }
    }
    return Array.from(byId.values()).sort((a, b) =>
      displayLocalized(a.name).localeCompare(displayLocalized(b.name), "fr", {
        sensitivity: "base",
      }),
    );
  }, [countryList, profileCountriesForPin]);

  const countryOptions = useMemo(
    () => [
      {
        value: "__none",
        label: <span className="text-muted-foreground">Non renseigné</span>,
        keywords: ["aucun", "non"],
      },
      ...mergedCountryList.map((c) => {
        const code = c.iso2 || c.code || "";
        const labelName = displayLocalized(c.name);
        return {
          value: String(c.id),
          label: (
            <span className="flex items-center gap-2">
              <CountryFlag
                emoji={c.emoji}
                iso2={c.iso2}
                code={c.code}
                className="!h-4 !w-5"
              />
              <span>{labelName}</span>
              {code ? (
                <span className="text-muted-foreground text-xs">({code})</span>
              ) : null}
            </span>
          ),
          keywords: [labelName, code, String(c.id)].filter(Boolean) as string[],
        };
      }),
    ],
    [mergedCountryList],
  );

  const routeSelectionLabels = useMemo(() => {
    const o = mergedCountryList.find(
      (c) => String(c.id) === wizardRouteOriginId,
    );
    const d = mergedCountryList.find((c) => String(c.id) === wizardRouteDestId);
    return { origin: o, dest: d };
  }, [mergedCountryList, wizardRouteOriginId, wizardRouteDestId]);

  const transportCompanyOptions = useMemo(
    () => [
      { value: "__none", label: "Aucune", keywords: ["aucun"] },
      ...transportCompanyList.map((c: { id: number; name: string }) => ({
        value: String(c.id),
        label: c.name,
        keywords: [c.name],
      })),
    ],
    [transportCompanyList],
  );

  const trackingNumber =
    shipmentData?.public_tracking ||
    (createdShipmentId ? `#${createdShipmentId}` : "");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/shipments")}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nouvelle expédition</h1>
          {createdShipmentId && (
            <p className="text-sm text-muted-foreground">{trackingNumber}</p>
          )}
        </div>
      </div>

      {/* Main workflow stepper */}
      <Card>
        <CardContent className="pt-6">
          <ShipmentProcessSteps
            currentStep={workflowStep}
            completedSteps={completedSteps}
            onStepClick={goToStep}
          />
        </CardContent>
      </Card>

      {/* Phase 1: Registration (existing wizard) */}
      {workflowStep === "registration" && (
        <>
          {loadingOptions && (
            <p className="text-sm text-muted-foreground">
              Chargement des options de l&apos;assistant…
            </p>
          )}

          <ShipmentWizardStepper step={step} onStepChange={setStep} />

          <div className="space-y-4">
            {step === 1 && (
              <div className="space-y-4">
                <Step1Actors
                  senderId={clientId}
                  onSenderChange={setClientId}
                  recipientId={recipientId}
                  onRecipientChange={setRecipientId}
                  errors={errors}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep1}>
                    Suivant <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle>Articles a expedier</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addItem}>
                        <Plus className="mr-2 h-4 w-4" /> Ajouter
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-sm font-medium">Poids et valeur</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            itemsEntryMode === "per_item" ? "default" : "outline"
                          }
                          onClick={() => setItemsEntryMode("per_item")}>
                          Par article
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            itemsEntryMode === "global" ? "default" : "outline"
                          }
                          onClick={() => setItemsEntryMode("global")}>
                          Totaux globaux
                        </Button>
                      </div>
                      {itemsEntryMode === "global" ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Poids total (kg) *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              value={globalTotalWeightKg}
                              onChange={(e) =>
                                setGlobalTotalWeightKg(e.target.value)
                              }
                              placeholder="ex. 12,5"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>
                              Valeur déclarée totale ({currencyUiLabel}) *
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              value={globalTotalDeclaredValue}
                              onChange={(e) =>
                                setGlobalTotalDeclaredValue(e.target.value)
                              }
                              placeholder="Somme de toutes les lignes"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground sm:col-span-2">
                            Répartition proportionnelle aux quantités sur chaque
                            ligne (poids et valeur unitaires calculés).
                          </p>
                        </div>
                      ) : null}
                    </div>
                    {items.map((item, index) => {
                      const l = Number(item.length_cm) || 0;
                      const wcm = Number(item.width_cm) || 0;
                      const h = Number(item.height_cm) || 0;
                      const volLineKg =
                        l > 0 && wcm > 0 && h > 0
                          ? ((l * wcm * h) / volumetricDivisorApprox) *
                            item.quantity
                          : 0;
                      return (
                      <div
                        key={index}
                        className="space-y-4 rounded-lg border p-4">
                        <div className="grid gap-4 md:grid-cols-5">
                          <div className="space-y-2 md:col-span-2">
                            <Label>Description *</Label>
                            <Input
                              value={item.description}
                              onChange={(e) =>
                                updateItem(index, "description", e.target.value)
                              }
                              placeholder="Description de l'article"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Qte</Label>
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "quantity",
                                  parseInt(e.target.value, 10) || 1,
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Poids (kg)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              value={item.weight_kg}
                              disabled={itemsEntryMode === "global"}
                              title={
                                itemsEntryMode === "global"
                                  ? "Utilisez le poids total ci-dessus"
                                  : undefined
                              }
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "weight_kg",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="flex-1 space-y-2">
                              <Label>Valeur déclarée unitaire</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min={0}
                                value={item.value}
                                disabled={itemsEntryMode === "global"}
                                title={
                                  itemsEntryMode === "global"
                                    ? "Utilisez la valeur totale ci-dessus"
                                    : undefined
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "value",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                              />
                            </div>
                            {items.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-6">
                          <div className="space-y-2">
                            <Label>Longueur (cm)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min={0}
                              value={item.length_cm || ""}
                              placeholder="—"
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "length_cm",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Largeur (cm)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min={0}
                              value={item.width_cm || ""}
                              placeholder="—"
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "width_cm",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Hauteur (cm)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min={0}
                              value={item.height_cm || ""}
                              placeholder="—"
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "height_cm",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1 md:col-span-3 flex flex-col justify-end text-xs text-muted-foreground">
                            <span>
                              Poids volumétrique (ligne, indicatif) :{" "}
                              <strong className="text-foreground tabular-nums">
                                {volLineKg.toFixed(3)}
                              </strong>{" "}
                              kg
                            </span>
                            <span>
                              Diviseur cm³/kg (paramètres) :{" "}
                              {volumetricDivisorApprox}
                              {shippingModeId || shipLineRateId
                                ? " — le mode ou tarif peut utiliser un autre diviseur au calcul final."
                                : ""}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>
                            Pays d&apos;origine de l&apos;article (optionnel)
                          </Label>
                          <DbCombobox
                            value={item.origin_country_id || "__none"}
                            onValueChange={(v) =>
                              updateItem(
                                index,
                                "origin_country_id",
                                v === "__none" ? "" : v,
                              )
                            }
                            options={countryOptions}
                            placeholder="Non renseigné"
                            searchPlaceholder="Rechercher un pays…"
                            onOpenCreateModal={
                              canManageSettings
                                ? (hint) =>
                                    setLogisticsModal({
                                      k: "country",
                                      line: index,
                                      hint,
                                    })
                                : undefined
                            }
                            createButtonTitle="Nouveau pays"
                          />
                        </div>
                      </div>
                      );
                    })}

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Résumé</AlertTitle>
                      <AlertDescription>
                        {items.reduce((sum, i) => sum + i.quantity, 0)} articles
                        | Poids total :{" "}
                        {itemsEntryMode === "global"
                          ? (
                              parseFloat(
                                String(globalTotalWeightKg).replace(",", "."),
                              ) || 0
                            ).toFixed(2)
                          : items
                              .reduce(
                                (sum, i) => sum + i.weight_kg * i.quantity,
                                0,
                              )
                              .toFixed(2)}{" "}
                        kg | Valeur totale articles :{" "}
                        {formatMoney(itemsSumValue)} — Les % assurance / douane / taxe
                        s&apos;appliquent sur la valeur déclarée (somme des
                        lignes, ou montant forcé à l&apos;étape Résumé).
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Precedent
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!canProceedStep2}>
                    Suivant <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Logistique</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Pays de départ *</Label>
                        <DbCombobox
                          value={wizardRouteOriginId || "__none"}
                          onValueChange={(v) =>
                            setWizardRouteOriginId(v === "__none" ? "" : v)
                          }
                          options={countryOptions}
                          placeholder="Choisir le pays de départ"
                          searchPlaceholder="Rechercher un pays…"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Pays d&apos;arrivée *</Label>
                        <DbCombobox
                          value={wizardRouteDestId || "__none"}
                          onValueChange={(v) =>
                            setWizardRouteDestId(v === "__none" ? "" : v)
                          }
                          options={countryOptions}
                          placeholder="Choisir le pays d'arrivée"
                          searchPlaceholder="Rechercher un pays…"
                        />
                      </div>
                    </div>

                    {wizardRouteOriginId && wizardRouteDestId ? (
                      <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium">
                            Tarifs ligne pour cette route
                          </p>
                          {routeLinesLoading ? (
                            <span className="text-xs text-muted-foreground">
                              Chargement…
                            </span>
                          ) : null}
                        </div>
                        {(routeSelectionLabels.origin ||
                          routeSelectionLabels.dest) && (
                          <div className="flex flex-wrap items-center gap-2 text-sm text-foreground">
                            <span className="text-muted-foreground">
                              Sélection :
                            </span>
                            {routeSelectionLabels.origin ? (
                              <span className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-background px-2 py-1">
                                <CountryFlag
                                  emoji={routeSelectionLabels.origin.emoji}
                                  iso2={routeSelectionLabels.origin.iso2}
                                  code={routeSelectionLabels.origin.code}
                                  className="!h-3.5 !w-5"
                                />
                                <span className="font-medium">
                                  {displayLocalized(
                                    routeSelectionLabels.origin.name,
                                  )}
                                </span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                Départ #{wizardRouteOriginId}
                              </span>
                            )}
                            <span className="text-muted-foreground">→</span>
                            {routeSelectionLabels.dest ? (
                              <span className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-background px-2 py-1">
                                <CountryFlag
                                  emoji={routeSelectionLabels.dest.emoji}
                                  iso2={routeSelectionLabels.dest.iso2}
                                  code={routeSelectionLabels.dest.code}
                                  className="!h-3.5 !w-5"
                                />
                                <span className="font-medium">
                                  {displayLocalized(
                                    routeSelectionLabels.dest.name,
                                  )}
                                </span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                Arrivée #{wizardRouteDestId}
                              </span>
                            )}
                          </div>
                        )}
                        {hasRouteLines ? (
                          <div className="space-y-3">
                            <p className="text-xs text-muted-foreground">
                              Choisissez une ligne de tarif : le mode et le
                              délai sont appliqués automatiquement.
                            </p>
                            {routeShipLines.map((line) => {
                              const origins = (
                                Array.isArray(line.origin_countries)
                                  ? line.origin_countries
                                  : []
                              ) as Record<string, unknown>[];
                              const dests = (
                                Array.isArray(line.destination_countries)
                                  ? line.destination_countries
                                  : []
                              ) as Record<string, unknown>[];
                              const rates = (
                                Array.isArray(line.rates) ? line.rates : []
                              ) as Record<string, unknown>[];
                              return (
                                <div
                                  key={String(line.id)}
                                  className="overflow-x-auto rounded-lg border border-border bg-background">
                                  <p className="border-b border-border px-3 py-2 text-sm font-semibold">
                                    {displayLocalized(line.name)}
                                  </p>
                                  <table className="w-full min-w-[640px] border-collapse text-sm">
                                    <thead>
                                      <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        <th className="p-2 font-medium">
                                          Origines
                                        </th>
                                        <th className="p-2 font-medium">
                                          Destinations
                                        </th>
                                        <th className="p-2 font-medium">
                                          Mode
                                        </th>
                                        <th className="p-2 font-medium">
                                          Délai
                                        </th>
                                        <th className="p-2 font-medium text-right">
                                          Prix
                                        </th>
                                        <th className="p-2 w-[88px] font-medium">
                                          Choix
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {rates.length === 0 ? (
                                        <tr>
                                          <td
                                            colSpan={6}
                                            className="p-3 text-muted-foreground text-xs">
                                            Aucun tarif actif sur cette ligne.
                                          </td>
                                        </tr>
                                      ) : (
                                        rates.map((rate) => {
                                          const rid = String(rate.id ?? "");
                                          const sel = shipLineRateId === rid;
                                          const sm = (
                                            rate.shipping_mode as
                                              | { name?: unknown }
                                              | undefined
                                          )?.name;
                                          const dt =
                                            effectiveDelayLabelForRate(
                                              rate,
                                            ) || "";
                                          const price =
                                            wizardRateUnitPrice(rate);
                                          return (
                                            <tr
                                              key={
                                                rid ||
                                                `l${String(line.id)}-m${String(rate.shipping_mode_id ?? "")}`
                                              }
                                              className={cn(
                                                "border-b border-border last:border-0",
                                                sel && "bg-primary/5",
                                              )}>
                                              <td className="p-2 align-top">
                                                <WizardFlagsChips
                                                  countries={origins}
                                                />
                                              </td>
                                              <td className="p-2 align-top">
                                                <WizardFlagsChips
                                                  countries={dests}
                                                />
                                              </td>
                                              <td className="p-2 align-top font-medium">
                                                {displayLocalized(sm)}
                                              </td>
                                              <td className="p-2 align-top text-xs text-muted-foreground max-w-[160px]">
                                                {dt.trim() ? dt : "—"}
                                              </td>
                                              <td className="p-2 align-top text-right font-medium tabular-nums whitespace-nowrap">
                                                {formatMoney(price)}
                                              </td>
                                              <td className="p-2 align-top">
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant={
                                                    sel ? "default" : "outline"
                                                  }
                                                  className="h-8 w-full text-xs"
                                                  onClick={() => {
                                                    setShipLineRateId(rid);
                                                    setShippingModeId(
                                                      String(
                                                        rate.shipping_mode_id ??
                                                          "",
                                                      ),
                                                    );
                                                  }}>
                                                  {sel ? "Choisi" : "Choisir"}
                                                </Button>
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          !routeLinesLoading && (
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">
                                Aucune ligne ne couvre ce couple de pays. Vous
                                pouvez créer une ligne (paramètres) ou choisir
                                un mode manuellement ci-dessous.
                              </p>
                              {canManageSettings ? (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setShipLineWizardOpen(true)}>
                                  Créer une ligne pour cette route
                                </Button>
                              ) : null}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Indiquez le pays de départ et d&apos;arrivée pour
                        proposer les tarifs des lignes configurées.
                      </p>
                    )}

                    {showModeCards ? (
                      <div className="space-y-2">
                        <Label>Mode d&apos;expédition (service) *</Label>
                        {modeList.length > 5 && (
                          <Input
                            value={shippingModeFilter}
                            onChange={(e) =>
                              setShippingModeFilter(e.target.value)
                            }
                            placeholder="Filtrer les modes…"
                            className="max-w-md"
                            aria-label="Filtrer les modes d'expédition"
                          />
                        )}
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {modesFiltered.map(
                            (m: { id: number; name: unknown }) => {
                              const idStr = String(m.id);
                              const selected = idStr === shippingModeId;
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setShippingModeId(idStr);
                                    if (hasRouteLines) setShipLineRateId("");
                                  }}
                                  className={cn(
                                    "rounded-lg border bg-card p-3 text-left text-sm shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    selected &&
                                      "border-primary bg-primary/5 ring-2 ring-primary",
                                  )}>
                                  <span className="font-medium leading-snug">
                                    {displayLocalized(m.name as string)}
                                  </span>
                                </button>
                              );
                            },
                          )}
                        </div>
                        {modeList.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            Aucun mode d&apos;expédition configuré.
                          </p>
                        )}
                        {modeList.length > 0 && modesFiltered.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            Aucun mode ne correspond au filtre.
                          </p>
                        )}
                        {errors.shipping_mode_id && (
                          <p className="text-sm text-destructive">
                            {errors.shipping_mode_id[0]}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Le délai affiché sur l&apos;expédition est celui de la
                        ligne de tarif choisie, ou à défaut le premier libellé
                        de délai configuré sur le mode d&apos;expédition.
                      </p>
                    )}

                    {shippingModeId ? (
                      <div className="rounded-lg border border-border bg-muted/15 px-3 py-2 text-sm">
                        <span className="text-muted-foreground">
                          Délai appliqué à l&apos;expédition :{" "}
                        </span>
                        <span className="font-medium">
                          {baseDeliveryLabelForItems.trim()
                            ? baseDeliveryLabelForItems
                            : "— (aucun libellé de délai pour ce tarif ou ce mode)"}
                        </span>
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <Label>Emballage (optionnel)</Label>
                      <DbCombobox
                        value={packagingTypeId || "__none"}
                        onValueChange={(v) =>
                          setPackagingTypeId(v === "__none" ? "" : v)
                        }
                        options={packagingOptions}
                        placeholder="Aucun"
                        searchPlaceholder="Filtrer…"
                        onOpenCreateModal={
                          canManageSettings
                            ? (hint) =>
                                setLogisticsModal({ k: "packaging", hint })
                            : undefined
                        }
                        createButtonTitle="Nouvel emballage"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Compagnie de transport (optionnel)</Label>
                      <DbCombobox
                        value={transportCompanyId || "__none"}
                        onValueChange={(v) =>
                          setTransportCompanyId(v === "__none" ? "" : v)
                        }
                        options={transportCompanyOptions}
                        placeholder="Aucune"
                        searchPlaceholder="Filtrer…"
                        onOpenCreateModal={
                          canManageSettings
                            ? (hint) =>
                                setLogisticsModal({ k: "transport", hint })
                            : undefined
                        }
                        createButtonTitle="Nouvelle compagnie"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Precedent
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    disabled={!canProceedStep3}>
                    Suivant <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Résumé & tarification</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Assurance (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          max={100}
                          value={insurancePct}
                          onChange={(e) => setInsurancePct(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Droits de douane (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          max={100}
                          value={customsDutyPct}
                          onChange={(e) => setCustomsDutyPct(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Taxe (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          max={100}
                          value={taxPct}
                          onChange={(e) => setTaxPct(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Remise (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          max={100}
                          value={discountPct}
                          onChange={(e) => setDiscountPct(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Supplément (montant fixe)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={manualFee}
                          onChange={(e) => setManualFee(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Libellé du supplément (optionnel)</Label>
                        <Input
                          value={manualFeeLabel}
                          onChange={(e) => setManualFeeLabel(e.target.value)}
                          placeholder="Ex. Frais spéciaux — affiché « Supplément … » sur la facture"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3 rounded-lg border border-muted bg-muted/30 p-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="legal-declaration"
                          checked={legalDeclarationAccepted}
                          onChange={(e) =>
                            setLegalDeclarationAccepted(e.target.checked)
                          }
                          className="mt-1 h-4 w-4 shrink-0 rounded border-input"
                        />
                        <Label
                          htmlFor="legal-declaration"
                          className="cursor-pointer text-sm font-normal leading-snug">
                          Je certifie que les informations déclarées
                          (description, quantités, valeurs et pays
                          d&apos;origine) sont exactes et que le contenu
                          respecte la réglementation en vigueur (douanes,
                          produits interdits, etc.). *
                        </Label>
                      </div>
                      {errors.legal_declaration_accepted && (
                        <p className="text-sm text-destructive">
                          {errors.legal_declaration_accepted[0]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Notes / instructions</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Instructions spéciales…"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Aperçu du tarif</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {previewPending && (
                      <p className="text-muted-foreground">Calcul…</p>
                    )}
                    {snap && !previewPending && (
                      <ul className="grid gap-1 sm:grid-cols-2">
                        <li>
                          Base :{" "}
                          <strong>{formatMoney(Number(snap.base_quote))}</strong>
                        </li>
                        <li>
                          Emballage :{" "}
                          <strong>
                            {formatMoney(Number(snap.packaging_fee ?? 0))}
                          </strong>
                        </li>
                        {Number(snap.manual_fee ?? 0) > 0 && (
                          <li>
                            Supplément :{" "}
                            <strong>
                              {formatMoney(Number(snap.manual_fee))}
                            </strong>
                          </li>
                        )}
                        <li>
                          Assurance :{" "}
                          <strong>
                            {formatMoney(Number(snap.insurance_amount))}
                          </strong>{" "}
                          ({snap.insurance_pct}%)
                        </li>
                        <li>
                          Douane :{" "}
                          <strong>
                            {formatMoney(Number(snap.customs_duty_amount))}
                          </strong>{" "}
                          ({snap.customs_duty_pct}%)
                        </li>
                        <li>
                          Sous-total :{" "}
                          <strong>{formatMoney(Number(snap.subtotal))}</strong>
                        </li>
                        <li>
                          Taxe :{" "}
                          <strong>{formatMoney(Number(snap.tax_amount))}</strong>{" "}
                          ({snap.tax_pct}%)
                        </li>
                        <li>
                          Remise :{" "}
                          <strong>
                            {formatMoney(Number(snap.discount_amount))}
                          </strong>
                        </li>
                        <li className="sm:col-span-2 text-base font-semibold">
                          Total : {formatMoney(Number(snap.total))}
                        </li>
                      </ul>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Precedent
                  </Button>
                  <Button onClick={handleSubmit} disabled={!canSubmit}>
                    {createMutation.isPending
                      ? "Creation..."
                      : "Creer l'expedition"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <WizardCountryCreateDialog
            open={logisticsModal?.k === "country"}
            onOpenChange={(o) => {
              if (!o) setLogisticsModal(null);
            }}
            user={user}
            onCreated={(id) => {
              const m = logisticsModal;
              if (m?.k === "country")
                updateItem(m.line, "origin_country_id", id);
              setLogisticsModal(null);
            }}
          />
          <WizardPackagingCreateDialog
            open={logisticsModal?.k === "packaging"}
            onOpenChange={(o) => {
              if (!o) setLogisticsModal(null);
            }}
            user={user}
            onCreated={(id) => {
              setPackagingTypeId(id);
              setLogisticsModal(null);
            }}
          />
          <WizardTransportCreateDialog
            open={logisticsModal?.k === "transport"}
            onOpenChange={(o) => {
              if (!o) setLogisticsModal(null);
            }}
            user={user}
            onCreated={(id) => {
              setTransportCompanyId(id);
              setLogisticsModal(null);
            }}
          />
          <WizardShipLineCreateDialog
            open={shipLineWizardOpen}
            onOpenChange={setShipLineWizardOpen}
            user={user}
            prefillOriginCountryId={wizardRouteOriginId || undefined}
            prefillDestCountryId={wizardRouteDestId || undefined}
            onCreated={() => {
              setShipLineWizardOpen(false);
              toast.success(
                "Ligne créée. Les tarifs pour cette route vont se recharger.",
              );
            }}
          />
        </>
      )}

      {/* Phase 2: Documents */}
      {workflowStep === "documents" && createdShipmentId && (
        <DocumentPreviewStep
          shipmentId={createdShipmentId}
          trackingNumber={trackingNumber}
          onValidate={handleDocumentsValidate}
        />
      )}

      {/* Phase 3: Checkout / Caisse */}
      {workflowStep === "checkout" && createdShipmentId && (
        <CheckoutStep
          shipment={shipmentData}
          docSettings={docSettings}
          onPaymentRecorded={handlePaymentComplete}
          onRecordPayment={handleRecordPayment}
          onInvoiceOptionsSaved={() => {
            if (createdShipmentId) void fetchShipmentData(createdShipmentId)
          }}
          isProcessing={false}
        />
      )}

    </div>
  );
}

export default function ShipmentCreate() {
  return (
    <ShipmentWorkflowProvider>
      <ShipmentCreateContent />
    </ShipmentWorkflowProvider>
  );
}
