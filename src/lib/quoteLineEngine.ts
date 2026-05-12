import type {
  ActiveQuoteLine,
  QuoteLineTemplate,
  QuoteLineType,
  QuoteLineCalculationBase,
  QuoteCurrencySettings,
} from '@/types/assistedPurchase'
import type { ServerQuoteConfigurationLine } from '@/lib/assistedPurchaseQuote'

export interface QuoteLineCalculated {
  code: string
  name: string
  type: QuoteLineType
  base: QuoteLineCalculationBase | null
  rate: number | null
  base_amount: number | null
  calculated_amount: number
  is_visible_to_client: boolean
  is_modified: boolean
}

export interface QuoteCalculationOutput {
  product_price: number
  lines: QuoteLineCalculated[]
  total_primary: number
  total_secondary: number | null
  warnings: string[]
}

export function calculateQuote(
  activeLines: ActiveQuoteLine[],
  productPrice: number,
  currencySettings: QuoteCurrencySettings | null,
): QuoteCalculationOutput {
  const warnings: string[] = []
  const results: Record<string, number> = {}
  const calculatedLines: QuoteLineCalculated[] = []
  let total = productPrice

  const sorted = [...activeLines].sort((a, b) => a.display_order - b.display_order)

  for (const line of sorted) {
    let amount = 0
    let baseAmount: number | null = null
    let rate: number | null = null
    const rawValue = parseFloat(line.value) || 0

    if (line.type === 'fixed_amount') {
      amount = rawValue
    } else if (line.type === 'manual') {
      amount = rawValue
    } else if (line.type === 'percentage') {
      rate = rawValue
      let base = productPrice

      if (line.calculation_base === 'subtotal_after_commission') {
        const commissionAmount = results['COMMISSION']
        if (commissionAmount !== undefined) {
          base = productPrice + commissionAmount
        } else {
          warnings.push(
            `La ligne « ${line.name} » est basée sur le sous-total après commission, mais aucune ligne de commission n'est incluse. Le calcul sera effectué sur le prix produit seul.`,
          )
        }
      }

      baseAmount = base
      amount = Math.round(base * (rate / 100) * 100) / 100
    }

    results[line.internal_code] = amount
    total += amount

    calculatedLines.push({
      code: line.internal_code,
      name: line.name,
      type: line.type,
      base: line.calculation_base,
      rate,
      base_amount: baseAmount,
      calculated_amount: amount,
      is_visible_to_client: line.is_visible_to_client,
      is_modified: line.is_modified,
    })
  }

  total = Math.round(total * 100) / 100

  let totalSecondary: number | null = null
  if (currencySettings?.secondary_currency_enabled && currencySettings.secondary_currency_rate > 0) {
    totalSecondary = Math.round(total * currencySettings.secondary_currency_rate)
  }

  return {
    product_price: productPrice,
    lines: calculatedLines,
    total_primary: total,
    total_secondary: totalSecondary,
    warnings,
  }
}

export function templateToActiveLine(
  template: QuoteLineTemplate,
  overrides?: Partial<ActiveQuoteLine>,
): ActiveQuoteLine {
  return {
    id: `tpl-${template.id}`,
    template_id: template.id,
    internal_code: template.internal_code,
    name: template.name,
    description: template.description,
    type: template.type,
    calculation_base: template.calculation_base,
    value: template.default_value != null ? String(template.default_value) : '',
    is_mandatory: template.is_mandatory,
    is_visible_to_client: template.is_visible_to_client,
    display_order: template.display_order,
    is_modified: false,
    original_value: template.default_value,
    ...overrides,
  }
}

export function loadInitialLines(templates: QuoteLineTemplate[]): ActiveQuoteLine[] {
  const lines: ActiveQuoteLine[] = []
  const sorted = [...templates]
    .filter((t) => t.is_active)
    .sort((a, b) => a.display_order - b.display_order)

  for (const tpl of sorted) {
    if (tpl.behavior === 'mandatory' || tpl.behavior === 'optional_included') {
      lines.push(templateToActiveLine(tpl))
    }
  }

  return lines
}

export function getAvailableLines(
  templates: QuoteLineTemplate[],
  activeLines: ActiveQuoteLine[],
): QuoteLineTemplate[] {
  const activeCodes = new Set(activeLines.map((l) => l.internal_code))
  return templates
    .filter((t) => t.is_active && !activeCodes.has(t.internal_code))
    .sort((a, b) => a.display_order - b.display_order)
}

let oneTimeCounter = 0

export function createOneTimeLine(
  label: string,
  type: 'fixed_amount' | 'percentage',
  value: string,
  calculationBase: QuoteLineCalculationBase | null,
  isVisibleToClient: boolean,
  displayOrder: number,
): ActiveQuoteLine {
  oneTimeCounter += 1
  return {
    id: `onetime-${Date.now()}-${oneTimeCounter}`,
    template_id: null,
    internal_code: `CUSTOM_ONE_SHOT_${oneTimeCounter}`,
    name: label,
    description: null,
    type,
    calculation_base: type === 'percentage' ? calculationBase : null,
    value,
    is_mandatory: false,
    is_visible_to_client: isVisibleToClient,
    display_order: displayOrder,
    is_modified: false,
    original_value: null,
  }
}

/** Reconstruit les lignes dynamiques à partir du dernier snapshot serveur + les templates actifs. */
export function mapServerQuoteLinesToActiveLines(
  rows: ServerQuoteConfigurationLine[],
  templates: QuoteLineTemplate[],
): ActiveQuoteLine[] {
  return rows.map((row, idx) => {
    const tpl = templates.find((t) => t.internal_code === row.internal_code)
    const vis = row.is_visible_to_client
    const valueStr = String(row.value)

    if (tpl) {
      const cb: QuoteLineCalculationBase | null =
        row.calculation_base === 'product_price' || row.calculation_base === 'subtotal_after_commission'
          ? row.calculation_base
          : tpl.calculation_base

      return templateToActiveLine(tpl, {
        value: valueStr,
        is_visible_to_client: vis,
        calculation_base: tpl.type === 'percentage' ? cb : tpl.calculation_base,
      })
    }

    const type: QuoteLineType =
      row.type === 'percentage' || row.type === 'fixed_amount' || row.type === 'manual' ? row.type : 'manual'

    if (type === 'manual') {
      return {
        id: `srv-m-${idx}-${row.internal_code}`,
        template_id: null,
        internal_code: row.internal_code || `ROW_${idx}`,
        name: row.name || row.internal_code || 'Ligne',
        description: null,
        type: 'manual',
        calculation_base: null,
        value: valueStr,
        is_mandatory: false,
        is_visible_to_client: vis,
        display_order: idx + 1,
        is_modified: false,
        original_value: null,
      }
    }

    if (type === 'percentage') {
      const base: QuoteLineCalculationBase =
        row.calculation_base === 'subtotal_after_commission' ? 'subtotal_after_commission' : 'product_price'

      return createOneTimeLine(row.name || 'Pourcentage', 'percentage', valueStr, base, vis, idx + 1)
    }

    return createOneTimeLine(row.name || 'Montant', 'fixed_amount', valueStr, null, vis, idx + 1)
  })
}

export function buildQuoteSnapshot(
  productPrice: number,
  calcOutput: QuoteCalculationOutput,
  currencySettings: QuoteCurrencySettings | null,
  exchangeRates: Record<string, unknown>,
) {
  return {
    product_price_usd: productPrice,
    exchange_rates_used: exchangeRates,
    lines: calcOutput.lines.map((l) => ({
      template_id: null,
      code: l.code,
      name: l.name,
      type: l.type,
      base: l.base,
      rate: l.rate,
      base_amount: l.base_amount,
      calculated_amount: l.calculated_amount,
      modified_from_template: l.is_modified,
      visible_to_client: l.is_visible_to_client,
    })),
    primary_currency: currencySettings?.primary_currency ?? 'USD',
    total_primary: calcOutput.total_primary,
    secondary_currency_enabled: currencySettings?.secondary_currency_enabled ?? false,
    secondary_currency: currencySettings?.secondary_currency ?? null,
    secondary_currency_rate: currencySettings?.secondary_currency_rate ?? null,
    total_secondary: calcOutput.total_secondary,
  }
}
