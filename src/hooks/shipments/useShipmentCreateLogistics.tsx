import { useEffect, useMemo, useRef, useState } from "react";
import { useShipLinesForRoute } from "@/hooks/useShipments";
import { profileCountryIdFromApi } from "@/lib/profileCountry";
import { displayLocalized } from "@/lib/localizedString";
import { effectiveDelayLabelForRate } from "@/lib/shipmentCreateUtils";
import type { ShipmentCreateLogisticsModal, WizardCountryRow } from "@/types/shipmentCreate";
import { CountryFlag } from "@/components/CountryFlag";

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- route fields sync from profiles like legacy wizard */
export function useShipmentCreateLogistics(
  clientId: string,
  recipientId: string,
  senderClientDetail: unknown,
  recipientClientDetail: unknown,
  userOverrodeOrigin: boolean,
  setUserOverrodeOrigin: (v: boolean) => void,
  userOverrodeDest: boolean,
  setUserOverrodeDest: (v: boolean) => void,
  modeList: Array<{ id: number; name?: unknown; is_active?: boolean; delivery_options?: unknown; volumetric_divisor?: number | null; volumetricDivisor?: number | null }>,
  packagingList: { id: number; name?: unknown; is_active?: boolean }[],
  transportCompanyList: { id: number; name: string; is_active?: boolean }[],
  countryList: WizardCountryRow[],
  profileCountriesForPin: WizardCountryRow[],
  volumetricDivisorApprox: number,
) {
  const [wizardRouteOriginId, setWizardRouteOriginId] = useState("");
  const [wizardRouteDestId, setWizardRouteDestId] = useState("");
  const [shipLineRateId, setShipLineRateId] = useState("");
  const [shippingModeId, setShippingModeId] = useState("");
  const [packagingTypeId, setPackagingTypeId] = useState("");
  const [transportCompanyId, setTransportCompanyId] = useState("");
  const [shippingModeFilter, setShippingModeFilter] = useState("");
  const [logisticsModal, setLogisticsModal] =
    useState<ShipmentCreateLogisticsModal>(null);
  const [shipLineWizardOpen, setShipLineWizardOpen] = useState(false);

  const prevRouteRef = useRef<{ o: string; d: string }>({ o: "", d: "" });

  const { data: routeLinesData, isFetching: routeLinesLoading } =
    useShipLinesForRoute(wizardRouteOriginId, wizardRouteDestId);
  const routeShipLines = useMemo(
    () =>
      (Array.isArray(routeLinesData?.ship_lines)
        ? routeLinesData.ship_lines
        : []) as Record<string, unknown>[],
    [routeLinesData],
  );
  const hasRouteLines = routeShipLines.length > 0;

  const modesFiltered = useMemo(() => {
    const q = shippingModeFilter.trim().toLowerCase();
    if (!q) return modeList;
    return modeList.filter((m) =>
      String(displayLocalized(m.name as string))
        .toLowerCase()
        .includes(q),
    );
  }, [modeList, shippingModeFilter]);

  const selectedMode = useMemo(
    () => modeList.find((m) => String(m.id) === shippingModeId),
    [modeList, shippingModeId],
  );

  const displayVolumetricDivisor = useMemo(() => {
    if (!selectedMode) return volumetricDivisorApprox;
    const m = selectedMode as {
      volumetric_divisor?: number | null;
      volumetricDivisor?: number | null;
    };
    const raw = m.volumetric_divisor ?? m.volumetricDivisor;
    if (typeof raw === "number" && Number.isFinite(raw) && raw >= 1) {
      return Math.floor(raw);
    }
    return volumetricDivisorApprox;
  }, [selectedMode, volumetricDivisorApprox]);

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

  useEffect(() => {
    const { o: po, d: pd } = prevRouteRef.current;
    const o = wizardRouteOriginId;
    const d = wizardRouteDestId;
    prevRouteRef.current = { o, d };
    if ((po !== "" && po !== o) || (pd !== "" && pd !== d)) {
      setShipLineRateId("");
    }
  }, [wizardRouteOriginId, wizardRouteDestId]);

  useEffect(() => {
    if (!clientId) {
      setWizardRouteOriginId("");
      setUserOverrodeOrigin(false);
      return;
    }
    if (userOverrodeOrigin) return;
    const cid = profileCountryIdFromApi(senderClientDetail);
    if (cid != null) setWizardRouteOriginId(String(cid));
  }, [clientId, senderClientDetail, userOverrodeOrigin]);

  useEffect(() => {
    if (!recipientId) {
      setWizardRouteDestId("");
      setUserOverrodeDest(false);
      return;
    }
    if (userOverrodeDest) return;
    const cid = profileCountryIdFromApi(recipientClientDetail);
    if (cid != null) setWizardRouteDestId(String(cid));
  }, [recipientId, recipientClientDetail, userOverrodeDest]);

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

  const packagingOptions = useMemo(
    () => [
      { value: "__none", label: "Aucun", keywords: ["aucun"] },
      ...packagingList.map(
        (p) => {
          const labelBase = displayLocalized(p.name as string);
          const inactive = p.is_active === false;
          return {
            value: String(p.id),
            label: inactive ? (
              <span className="flex flex-wrap items-center gap-2">
                <span>{labelBase}</span>
                <span className="text-muted-foreground text-xs">(inactif)</span>
              </span>
            ) : (
              labelBase
            ),
            keywords: inactive
              ? [labelBase, "inactif"]
              : [labelBase],
          };
        },
      ),
    ],
    [packagingList],
  );

  const transportCompanyOptions = useMemo(
    () => [
      { value: "__none", label: "Aucune", keywords: ["aucun"] },
      ...transportCompanyList.map(
        (c: { id: number; name: string; is_active?: boolean }) => {
          const inactive = c.is_active === false;
          return {
            value: String(c.id),
            label: inactive ? (
              <span className="flex flex-wrap items-center gap-2">
                <span>{c.name}</span>
                <span className="text-muted-foreground text-xs">(inactif)</span>
              </span>
            ) : (
              c.name
            ),
            keywords: inactive ? [c.name, "inactif"] : [c.name],
          };
        },
      ),
    ],
    [transportCompanyList],
  );

  const showModeCards =
    !wizardRouteOriginId || !wizardRouteDestId || !hasRouteLines;

  return {
    wizardRouteOriginId,
    setWizardRouteOriginId,
    wizardRouteDestId,
    setWizardRouteDestId,
    shipLineRateId,
    setShipLineRateId,
    userOverrodeOrigin,
    setUserOverrodeOrigin,
    userOverrodeDest,
    setUserOverrodeDest,
    shippingModeId,
    setShippingModeId,
    packagingTypeId,
    setPackagingTypeId,
    transportCompanyId,
    setTransportCompanyId,
    shippingModeFilter,
    setShippingModeFilter,
    logisticsModal,
    setLogisticsModal,
    shipLineWizardOpen,
    setShipLineWizardOpen,
    prevRouteRef,
    routeLinesLoading,
    routeShipLines,
    hasRouteLines,
    modesFiltered,
    selectedMode,
    displayVolumetricDivisor,
    baseDeliveryLabelForItems,
    mergedCountryList,
    countryOptions,
    routeSelectionLabels,
    packagingOptions,
    transportCompanyOptions,
    showModeCards,
  };
}
