import { useEffect, useRef, useState } from "react";

export function useShipmentCreatePricing(options: unknown) {
  const [insurancePct, setInsurancePct] = useState("0");
  const [customsDutyPct, setCustomsDutyPct] = useState("0");
  const [taxPct, setTaxPct] = useState("0");
  const [discountPct, setDiscountPct] = useState("0");
  const [manualFee, setManualFee] = useState("0");
  const [manualFeeLabel, setManualFeeLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [legalDeclarationAccepted, setLegalDeclarationAccepted] =
    useState(false);

  const pricingDefaultsApplied = useRef(false);
  useEffect(() => {
    if (!options || pricingDefaultsApplied.current) return;
    pricingDefaultsApplied.current = true;
    const o = options as {
      defaultInsurancePct?: string | number;
      defaultCustomsDutyPct?: string | number;
      defaultTaxPct?: string | number;
    };
    /* eslint-disable react-hooks/set-state-in-effect -- synching form defaults from loaded options */
    setInsurancePct(String(o.defaultInsurancePct ?? "0"));
    setCustomsDutyPct(String(o.defaultCustomsDutyPct ?? "0"));
    setTaxPct(String(o.defaultTaxPct ?? "0"));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [options]);

  return {
    insurancePct,
    setInsurancePct,
    customsDutyPct,
    setCustomsDutyPct,
    taxPct,
    setTaxPct,
    discountPct,
    setDiscountPct,
    manualFee,
    setManualFee,
    manualFeeLabel,
    setManualFeeLabel,
    notes,
    setNotes,
    legalDeclarationAccepted,
    setLegalDeclarationAccepted,
  };
}
