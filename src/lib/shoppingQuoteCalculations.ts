export function parsePositiveNumber(raw: string): number {
  const n = Number(String(raw).replace(',', '.'))
  if (!Number.isFinite(n) || n < 0) return 0
  return n
}

export function parsePercentage(raw: string): number {
  const n = Number(String(raw).replace(',', '.'))
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(n, 100)
}

export function computeBankFeeAmount(subtotal: number, serviceFee: number, bankFeePercentage: number): number {
  const base = subtotal + serviceFee
  return base > 0 ? Math.round(base * bankFeePercentage) / 100 : 0
}

export function computeQuoteTotal(subtotal: number, serviceFee: number, bankFeeAmount: number): number {
  return subtotal + serviceFee + bankFeeAmount
}
