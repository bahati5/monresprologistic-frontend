import { describe, it, expect } from 'vitest'
import { validateQuoteSend } from './QuoteSendValidation'
import type { PurchaseArticle, ActiveQuoteLine } from '@/types/assistedPurchase'

function makeArticle(overrides: Partial<PurchaseArticle> = {}): PurchaseArticle {
  return {
    id: 1,
    name: 'Nike Air Max',
    product_url: 'https://amazon.fr/dp/123',
    price_original: 89.99,
    price_converted: 95.0,
    currency_original: 'EUR',
    quantity: 1,
    merchant: { id: 1, name: 'Amazon', logo_url: null },
    attributes: {},
    preference: null,
    availability: { status: 'available_exact', alternative_note: '' },
    image_url: null,
    is_available: true,
    scrape_status: 'success',
    options_label: null,
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

describe('validateQuoteSend', () => {
  it('returns canSend=true when all articles are verified and subtotal > 0', () => {
    const articles = [makeArticle()]
    const lines = [makeLine()]
    const result = validateQuoteSend({ articles, activeLines: lines, subtotal: 100 })

    expect(result.canSend).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.allUnavailable).toBe(false)
  })

  it('blocks sending when articles are not_checked (ATTR-006)', () => {
    const articles = [
      makeArticle({ availability: { status: 'not_checked', alternative_note: '' } }),
    ]
    const result = validateQuoteSend({ articles, activeLines: [], subtotal: 100 })

    expect(result.canSend).toBe(false)
    expect(result.errors[0]).toContain('non vérifié')
  })

  it('blocks sending when alternative note is empty (ATTR-007)', () => {
    const articles = [
      makeArticle({
        availability: { status: 'available_alternative', alternative_note: '' },
      }),
    ]
    const result = validateQuoteSend({ articles, activeLines: [], subtotal: 100 })

    expect(result.canSend).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining('alternative sans note'))
  })

  it('allows sending when alternative note is filled', () => {
    const articles = [
      makeArticle({
        availability: { status: 'available_alternative', alternative_note: 'Disponible en noir' },
      }),
    ]
    const result = validateQuoteSend({ articles, activeLines: [], subtotal: 100 })

    expect(result.canSend).toBe(true)
  })

  it('detects all unavailable (ATTR-008)', () => {
    const articles = [
      makeArticle({ id: 1, availability: { status: 'unavailable', alternative_note: '' } }),
      makeArticle({ id: 2, availability: { status: 'unavailable', alternative_note: '' } }),
    ]
    const result = validateQuoteSend({ articles, activeLines: [], subtotal: 0 })

    expect(result.allUnavailable).toBe(true)
    expect(result.canSend).toBe(true)
  })

  it('blocks when subtotal is 0 and not all unavailable', () => {
    const articles = [makeArticle()]
    const result = validateQuoteSend({ articles, activeLines: [], subtotal: 0 })

    expect(result.canSend).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining('prix unitaire'))
  })

  it('warns about pending scrape', () => {
    const articles = [makeArticle({ scrape_status: 'pending' })]
    const result = validateQuoteSend({ articles, activeLines: [], subtotal: 100 })

    expect(result.canSend).toBe(true)
    expect(result.warnings).toContainEqual(expect.stringContaining('extraction'))
  })

  it('warns about failed scrape', () => {
    const articles = [makeArticle({ scrape_status: 'failed' })]
    const result = validateQuoteSend({ articles, activeLines: [], subtotal: 100 })

    expect(result.warnings).toContainEqual(expect.stringContaining('échouée'))
  })

  it('warns about mandatory lines at zero without reason', () => {
    const lines = [makeLine({ value: '0', is_mandatory: true })]
    const articles = [makeArticle()]
    const result = validateQuoteSend({ articles, activeLines: lines, subtotal: 100 })

    expect(result.warnings).toContainEqual(expect.stringContaining('obligatoire'))
  })

  it('does not warn about mandatory lines at zero with reason', () => {
    const lines = [makeLine({ value: '0', is_mandatory: true, zero_reason: 'Client VIP' })]
    const articles = [makeArticle()]
    const result = validateQuoteSend({ articles, activeLines: lines, subtotal: 100 })

    expect(result.warnings).not.toContainEqual(expect.stringContaining('obligatoire'))
  })

  it('handles multiple errors and warnings simultaneously', () => {
    const articles = [
      makeArticle({
        id: 1,
        availability: { status: 'not_checked', alternative_note: '' },
        scrape_status: 'pending',
      }),
      makeArticle({
        id: 2,
        availability: { status: 'available_alternative', alternative_note: '' },
        scrape_status: 'failed',
      }),
    ]
    const lines = [makeLine({ value: '0', is_mandatory: true })]

    const result = validateQuoteSend({ articles, activeLines: lines, subtotal: 0 })

    expect(result.canSend).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
    expect(result.warnings.length).toBeGreaterThanOrEqual(2)
  })

  it('handles empty articles array', () => {
    const result = validateQuoteSend({ articles: [], activeLines: [], subtotal: 100 })

    expect(result.canSend).toBe(true)
    expect(result.allUnavailable).toBe(false)
  })
})
