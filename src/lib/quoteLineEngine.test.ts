import { describe, it, expect } from 'vitest'
import {
  calculateQuote,
  templateToActiveLine,
  loadInitialLines,
  getAvailableLines,
  createOneTimeLine,
  buildQuoteSnapshot,
} from './quoteLineEngine'
import type {
  ActiveQuoteLine,
  QuoteLineTemplate,
  QuoteCurrencySettings,
} from '@/types/assistedPurchase'

function makeTemplate(overrides: Partial<QuoteLineTemplate> = {}): QuoteLineTemplate {
  return {
    id: 1,
    agency_id: 1,
    name: 'Commission',
    internal_code: 'COMMISSION',
    description: null,
    type: 'percentage',
    calculation_base: 'product_price',
    default_value: 10,
    is_mandatory: true,
    is_visible_to_client: true,
    is_active: true,
    display_order: 1,
    applies_to: 'assisted_purchase',
    behavior: 'mandatory',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides,
  }
}

function makeLine(overrides: Partial<ActiveQuoteLine> = {}): ActiveQuoteLine {
  return {
    id: 'tpl-1',
    template_id: 1,
    internal_code: 'COMMISSION',
    name: 'Commission',
    description: null,
    type: 'percentage',
    calculation_base: 'product_price',
    value: '10',
    is_mandatory: true,
    is_visible_to_client: true,
    display_order: 1,
    is_modified: false,
    original_value: 10,
    ...overrides,
  }
}

const baseCurrency: QuoteCurrencySettings = {
  primary_currency: 'USD',
  secondary_currency_enabled: true,
  secondary_currency: 'CDF',
  secondary_currency_rate_mode: 'manual',
  secondary_currency_rate: 2800,
  secondary_currency_rate_updated_at: '2024-01-01',
}

describe('calculateQuote', () => {
  it('calculates a percentage line on product price', () => {
    const lines: ActiveQuoteLine[] = [makeLine({ value: '10', type: 'percentage', calculation_base: 'product_price' })]
    const result = calculateQuote(lines, 100, null)

    expect(result.total_primary).toBe(110)
    expect(result.lines[0].calculated_amount).toBe(10)
    expect(result.lines[0].rate).toBe(10)
    expect(result.lines[0].base_amount).toBe(100)
  })

  it('calculates a fixed amount line', () => {
    const lines: ActiveQuoteLine[] = [makeLine({ value: '25', type: 'fixed_amount', internal_code: 'SHIPPING' })]
    const result = calculateQuote(lines, 100, null)

    expect(result.total_primary).toBe(125)
    expect(result.lines[0].calculated_amount).toBe(25)
    expect(result.lines[0].rate).toBeNull()
  })

  it('calculates a manual line', () => {
    const lines: ActiveQuoteLine[] = [makeLine({ value: '50', type: 'manual', internal_code: 'MANUAL' })]
    const result = calculateQuote(lines, 200, null)

    expect(result.total_primary).toBe(250)
  })

  it('calculates subtotal_after_commission base correctly', () => {
    const commission = makeLine({ value: '10', type: 'percentage', calculation_base: 'product_price', internal_code: 'COMMISSION', display_order: 1 })
    const bankFee = makeLine({
      id: 'tpl-2',
      template_id: 2,
      value: '3',
      type: 'percentage',
      calculation_base: 'subtotal_after_commission',
      internal_code: 'BANK_FEE',
      name: 'Frais bancaires',
      display_order: 2,
    })

    const result = calculateQuote([commission, bankFee], 100, null)

    expect(result.lines[0].calculated_amount).toBe(10)
    expect(result.lines[1].base_amount).toBe(110)
    expect(result.lines[1].calculated_amount).toBe(3.3)
    expect(result.total_primary).toBe(113.3)
  })

  it('produces a warning when subtotal_after_commission is used without COMMISSION line', () => {
    const bankFee = makeLine({
      value: '3',
      type: 'percentage',
      calculation_base: 'subtotal_after_commission',
      internal_code: 'BANK_FEE',
      name: 'Frais bancaires',
    })

    const result = calculateQuote([bankFee], 100, null)

    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0]).toContain('commission')
    expect(result.lines[0].base_amount).toBe(100)
    expect(result.lines[0].calculated_amount).toBe(3)
  })

  it('calculates secondary currency total', () => {
    const lines: ActiveQuoteLine[] = [makeLine({ value: '10', type: 'percentage' })]
    const result = calculateQuote(lines, 100, baseCurrency)

    expect(result.total_primary).toBe(110)
    expect(result.total_secondary).toBe(308000)
  })

  it('returns null for secondary total if disabled', () => {
    const disabled: QuoteCurrencySettings = { ...baseCurrency, secondary_currency_enabled: false }
    const result = calculateQuote([makeLine()], 100, disabled)

    expect(result.total_secondary).toBeNull()
  })

  it('handles zero product price', () => {
    const result = calculateQuote([makeLine({ value: '10' })], 0, null)

    expect(result.total_primary).toBe(0)
    expect(result.lines[0].calculated_amount).toBe(0)
  })

  it('handles empty lines', () => {
    const result = calculateQuote([], 150, null)

    expect(result.total_primary).toBe(150)
    expect(result.lines).toHaveLength(0)
  })

  it('sorts lines by display_order before calculation', () => {
    const line2 = makeLine({ id: 'tpl-2', internal_code: 'B', name: 'B', display_order: 2, value: '5', type: 'fixed_amount' })
    const line1 = makeLine({ id: 'tpl-1', internal_code: 'A', name: 'A', display_order: 1, value: '10', type: 'fixed_amount' })

    const result = calculateQuote([line2, line1], 100, null)

    expect(result.lines[0].code).toBe('A')
    expect(result.lines[1].code).toBe('B')
  })

  it('rounds amounts to 2 decimals', () => {
    const lines: ActiveQuoteLine[] = [makeLine({ value: '7.3', type: 'percentage' })]
    const result = calculateQuote(lines, 123.45, null)

    expect(result.lines[0].calculated_amount).toBe(9.01)
    expect(result.total_primary).toBe(132.46)
  })
})

describe('templateToActiveLine', () => {
  it('converts a template to an active line', () => {
    const template = makeTemplate()
    const line = templateToActiveLine(template)

    expect(line.id).toBe('tpl-1')
    expect(line.template_id).toBe(1)
    expect(line.name).toBe('Commission')
    expect(line.value).toBe('10')
    expect(line.is_modified).toBe(false)
    expect(line.original_value).toBe(10)
  })

  it('applies overrides', () => {
    const template = makeTemplate()
    const line = templateToActiveLine(template, { value: '15', is_modified: true })

    expect(line.value).toBe('15')
    expect(line.is_modified).toBe(true)
  })

  it('handles null default_value', () => {
    const template = makeTemplate({ default_value: null })
    const line = templateToActiveLine(template)

    expect(line.value).toBe('')
    expect(line.original_value).toBeNull()
  })
})

describe('loadInitialLines', () => {
  it('includes mandatory and optional_included templates', () => {
    const templates = [
      makeTemplate({ id: 1, behavior: 'mandatory', internal_code: 'A', display_order: 1 }),
      makeTemplate({ id: 2, behavior: 'optional_included', internal_code: 'B', display_order: 2 }),
      makeTemplate({ id: 3, behavior: 'optional', internal_code: 'C', display_order: 3 }),
    ]

    const lines = loadInitialLines(templates)

    expect(lines).toHaveLength(2)
    expect(lines[0].internal_code).toBe('A')
    expect(lines[1].internal_code).toBe('B')
  })

  it('filters out inactive templates', () => {
    const templates = [
      makeTemplate({ id: 1, behavior: 'mandatory', is_active: true }),
      makeTemplate({ id: 2, behavior: 'mandatory', is_active: false, internal_code: 'INACTIVE' }),
    ]

    const lines = loadInitialLines(templates)

    expect(lines).toHaveLength(1)
  })

  it('sorts by display_order', () => {
    const templates = [
      makeTemplate({ id: 2, behavior: 'mandatory', internal_code: 'B', display_order: 5 }),
      makeTemplate({ id: 1, behavior: 'mandatory', internal_code: 'A', display_order: 1 }),
    ]

    const lines = loadInitialLines(templates)

    expect(lines[0].internal_code).toBe('A')
    expect(lines[1].internal_code).toBe('B')
  })
})

describe('getAvailableLines', () => {
  it('returns active templates not already in active lines', () => {
    const templates = [
      makeTemplate({ id: 1, internal_code: 'A' }),
      makeTemplate({ id: 2, internal_code: 'B' }),
      makeTemplate({ id: 3, internal_code: 'C' }),
    ]
    const activeLines: ActiveQuoteLine[] = [makeLine({ internal_code: 'A' })]

    const available = getAvailableLines(templates, activeLines)

    expect(available).toHaveLength(2)
    expect(available[0].internal_code).toBe('B')
    expect(available[1].internal_code).toBe('C')
  })

  it('excludes inactive templates', () => {
    const templates = [
      makeTemplate({ id: 1, internal_code: 'A', is_active: false }),
      makeTemplate({ id: 2, internal_code: 'B', is_active: true }),
    ]

    const available = getAvailableLines(templates, [])

    expect(available).toHaveLength(1)
    expect(available[0].internal_code).toBe('B')
  })
})

describe('createOneTimeLine', () => {
  it('creates a one-time fixed amount line', () => {
    const line = createOneTimeLine('Frais douaniers', 'fixed_amount', '50', null, true, 10)

    expect(line.template_id).toBeNull()
    expect(line.name).toBe('Frais douaniers')
    expect(line.type).toBe('fixed_amount')
    expect(line.value).toBe('50')
    expect(line.is_visible_to_client).toBe(true)
    expect(line.display_order).toBe(10)
    expect(line.id).toContain('onetime-')
  })

  it('creates a one-time percentage line with calculation base', () => {
    const line = createOneTimeLine('Remise', 'percentage', '5', 'product_price', false, 5)

    expect(line.type).toBe('percentage')
    expect(line.calculation_base).toBe('product_price')
    expect(line.is_visible_to_client).toBe(false)
  })
})

describe('buildQuoteSnapshot', () => {
  it('builds a complete snapshot structure', () => {
    const lines: ActiveQuoteLine[] = [makeLine({ value: '10' })]
    const calcOutput = calculateQuote(lines, 100, baseCurrency)
    const rates = { USD_CDF: 2800 }

    const snapshot = buildQuoteSnapshot(100, calcOutput, baseCurrency, rates)

    expect(snapshot.product_price_usd).toBe(100)
    expect(snapshot.exchange_rates_used).toEqual(rates)
    expect(snapshot.primary_currency).toBe('USD')
    expect(snapshot.total_primary).toBe(110)
    expect(snapshot.secondary_currency_enabled).toBe(true)
    expect(snapshot.secondary_currency).toBe('CDF')
    expect(snapshot.secondary_currency_rate).toBe(2800)
    expect(snapshot.total_secondary).toBe(308000)
    expect(snapshot.lines).toHaveLength(1)
    expect(snapshot.lines[0].code).toBe('COMMISSION')
  })

  it('handles null currency settings', () => {
    const lines: ActiveQuoteLine[] = []
    const calcOutput = calculateQuote(lines, 50, null)

    const snapshot = buildQuoteSnapshot(50, calcOutput, null, {})

    expect(snapshot.primary_currency).toBe('USD')
    expect(snapshot.secondary_currency_enabled).toBe(false)
    expect(snapshot.secondary_currency).toBeNull()
    expect(snapshot.total_secondary).toBeNull()
  })
})
