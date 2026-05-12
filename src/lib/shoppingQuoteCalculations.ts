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
