import { useMemo } from "react";
import {
  useCreateShipment,
  useShipmentCreateOptions,
  useUpdateShipment,
  usePreviewQuote,
} from "@/hooks/useShipments";
import { useAppSettings, useCountriesList, useFormatMoney } from "@/hooks/useSettings";
import { resolveMoneySymbol } from "@/lib/formatCurrency";
import { displayLocalized } from "@/lib/localizedString";
import { mergeWizardCountryRows } from "@/lib/shipmentCreateUtils";
import type { WizardCountryRow } from "@/types/shipmentCreate";

export function useShipmentCreateQueries() {
  const { data: options, isLoading: loadingOptions } = useShipmentCreateOptions();
  const { data: countriesFromLocations = [], isFetching: fetchingCountriesList } =
    useCountriesList();
  const { data: appSettings } = useAppSettings();
  const { formatMoney } = useFormatMoney();
  const globalCurrency = String(appSettings?.currency ?? "").toUpperCase();
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
  const updateMutation = useUpdateShipment();
  const preview = usePreviewQuote();

  const modeList = useMemo(
    () => (Array.isArray(options?.shippingModes) ? options.shippingModes : []),
    [options],
  );

  const packagingList = useMemo(() => {
    const raw = Array.isArray(options?.packagingTypes)
      ? options.packagingTypes
      : [];
    type Row = {
      id: number;
      name?: unknown;
      is_active?: boolean;
      sort_order?: number;
    };
    return [...raw].sort((a: Row, b: Row) => {
      const ae = a.is_active !== false ? 0 : 1;
      const be = b.is_active !== false ? 0 : 1;
      if (ae !== be) return ae - be;
      const so =
        (Number(a.sort_order ?? 0) || 0) - (Number(b.sort_order ?? 0) || 0);
      if (so !== 0) return so;
      return displayLocalized(a.name).localeCompare(
        displayLocalized(b.name),
        "fr",
        { sensitivity: "base" },
      );
    });
  }, [options]);

  const transportCompanyList = useMemo(() => {
    const raw = Array.isArray(options?.transportCompanies)
      ? options.transportCompanies
      : [];
    type Row = { id: number; name?: string; is_active?: boolean };
    return [...raw].sort((a: Row, b: Row) => {
      const ae = a.is_active !== false ? 0 : 1;
      const be = b.is_active !== false ? 0 : 1;
      if (ae !== be) return ae - be;
      return String(a.name ?? "").localeCompare(String(b.name ?? ""), "fr", {
        sensitivity: "base",
      });
    });
  }, [options]);

  const articleCategoryList = useMemo(() => {
    const raw = Array.isArray(options?.articleCategories)
      ? options.articleCategories
      : [];
    return raw as { id: number; name: unknown }[];
  }, [options]);

  const countryList = useMemo((): WizardCountryRow[] => {
    const fromWizard = Array.isArray(options?.countries)
      ? (options.countries as WizardCountryRow[])
      : [];
    return mergeWizardCountryRows(countriesFromLocations, fromWizard);
  }, [options, countriesFromLocations]);

  return {
    options,
    loadingOptions,
    countriesFromLocations,
    fetchingCountriesList,
    appSettings,
    formatMoney,
    globalCurrency,
    currencyUiLabel,
    volumetricDivisorApprox,
    createMutation,
    updateMutation,
    preview,
    modeList,
    packagingList,
    transportCompanyList,
    articleCategoryList,
    countryList,
  };
}

export type ShipmentCreateQueries = ReturnType<typeof useShipmentCreateQueries>;
