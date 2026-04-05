/**
 * Payloads partiels pour PUT /api/settings/app (Laravel ne met à jour que les clés envoyées).
 */
import { normalizeLockerDigits } from '@/lib/lockerAddressTemplate'

function optInt(v: unknown, min = 1): number | null {
  if (v === '' || v == null) return null
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return Math.max(min, Math.floor(n))
}

function optNum(v: unknown): number | null {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function buildLockerPayload(form: Record<string, unknown>): Record<string, unknown> {
  return {
    locker_address_template: String(form.locker_address ?? ''),
    locker_mode: form.locker_mode === 'sequential' ? 'sequential' : 'random',
    locker_digits: normalizeLockerDigits(form.locker_digits),
    locker_prefix: String(form.locker_prefix ?? ''),
    locker_code_format: String(form.locker_code_format ?? '{prefix}-{randnum}'),
    locker_next_seq: optInt(form.locker_next_seq, 1),
    locker_seq_pad: optInt(form.locker_seq_pad, 1),
  }
}

export function buildTrackingPayload(form: Record<string, unknown>): Record<string, unknown> {
  const lenRaw = Number(form.tracking_number_length)
  const len =
    Number.isFinite(lenRaw) ? Math.min(32, Math.max(4, Math.floor(lenRaw))) : 8
  return {
    tracking_prefix: String(form.tracking_prefix ?? 'MRP'),
    tracking_number_length: len,
    shipment_tracking_format: String(form.shipment_tracking_format ?? '{prefix}-{random}'),
    shipment_tracking_next_seq: optInt(form.shipment_tracking_next_seq, 1),
    shipment_tracking_seq_pad: optInt(form.shipment_tracking_seq_pad, 1),
  }
}

export function buildShipmentInvoicePdfPayload(form: Record<string, unknown>): Record<string, unknown> {
  return {
    shipment_invoice_format: String(form.shipment_invoice_format ?? '{prefix}-{year}-{seq}'),
    shipment_invoice_prefix: String(form.shipment_invoice_prefix ?? 'FAC'),
    shipment_invoice_seq_pad: optInt(form.shipment_invoice_seq_pad, 1),
    shipment_invoice_next_seq: optInt(form.shipment_invoice_next_seq, 1),
    invoice_terms: String(form.invoice_terms ?? ''),
    signing_company: String(form.signing_company ?? ''),
    signing_customer: String(form.signing_customer ?? ''),
    default_company_coverage_amount: optNum(form.default_company_coverage_amount),
  }
}

export function buildExpeditionDefaultsPayload(form: Record<string, unknown>): Record<string, unknown> {
  const vd = String(form.volumetric_divisor ?? '').trim()
  const parsed = vd === '' ? NaN : parseInt(vd, 10)
  const volumetric = Number.isFinite(parsed) && parsed >= 1 ? parsed : null
  return {
    volumetric_divisor: volumetric,
    default_insurance_pct: optNum(form.default_insurance_pct),
    default_customs_duty_pct: optNum(form.default_customs_duty_pct),
    default_tax_pct: optNum(form.default_tax_pct),
  }
}

export function buildFinanceInvoicePayload(form: Record<string, unknown>): Record<string, unknown> {
  return {
    finance_invoice_format: String(form.finance_invoice_format ?? '{prefix}-{seq}'),
    finance_invoice_prefix: String(form.finance_invoice_prefix ?? 'INV'),
    finance_invoice_seq_pad: optInt(form.finance_invoice_seq_pad, 1),
    finance_invoice_next_seq: optInt(form.finance_invoice_next_seq, 1),
  }
}

export function buildPrealertPayload(form: Record<string, unknown>): Record<string, unknown> {
  return {
    prealert_reference_format: String(form.prealert_reference_format ?? '{prefix}-{seq}'),
    prealert_reference_prefix: String(form.prealert_reference_prefix ?? 'ASN'),
    prealert_reference_seq_pad: optInt(form.prealert_reference_seq_pad, 1),
    prealert_next_seq: optInt(form.prealert_next_seq, 1),
  }
}

export function buildPurchaseOrderPayload(form: Record<string, unknown>): Record<string, unknown> {
  return {
    purchase_order_reference_format: String(form.purchase_order_reference_format ?? '{prefix}-{seq}'),
    purchase_order_reference_prefix: String(form.purchase_order_reference_prefix ?? 'PO'),
    purchase_order_reference_seq_pad: optInt(form.purchase_order_reference_seq_pad, 1),
    purchase_order_next_seq: optInt(form.purchase_order_next_seq, 1),
  }
}

export function buildCustomerPackagePayload(form: Record<string, unknown>): Record<string, unknown> {
  return {
    customer_package_reference_format: String(form.customer_package_reference_format ?? '{prefix}-{seq}'),
    customer_package_reference_prefix: String(form.customer_package_reference_prefix ?? 'PKG'),
    customer_package_reference_seq_pad: optInt(form.customer_package_reference_seq_pad, 1),
    customer_package_next_seq: optInt(form.customer_package_next_seq, 1),
  }
}
