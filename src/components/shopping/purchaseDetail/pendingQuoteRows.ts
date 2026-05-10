export type PendingQuoteRow = {
  key: string
  label: string
  url: string
  qty: number
  merchant: { logo_url?: string | null; name?: string | null } | undefined
}

export function buildPendingQuoteRows(p: Record<string, unknown>): PendingQuoteRow[] {
  const rawItems = p.items as
    | {
        url?: string
        name?: string
        display_label?: string
        quantity?: number
        merchant?: { logo_url?: string | null; name?: string | null }
      }[]
    | undefined
  if (Array.isArray(rawItems) && rawItems.length > 0) {
    return rawItems.map((it, i) => ({
      key: String(it.url ?? i),
      label:
        (typeof it.display_label === 'string' && it.display_label.trim()) ||
        (typeof it.name === 'string' && it.name.trim()) ||
        'Article',
      url: typeof it.url === 'string' ? it.url : '',
      qty: typeof it.quantity === 'number' ? it.quantity : Number(it.quantity) || 1,
      merchant: it.merchant,
    }))
  }
  return [
    {
      key: 'legacy',
      label:
        typeof p.article_label === 'string' && p.article_label.trim()
          ? p.article_label.trim()
          : 'Article',
      url: String(p.product_url ?? ''),
      qty: typeof p.quantity === 'number' ? p.quantity : Number(p.quantity) || 1,
      merchant: undefined,
    },
  ]
}
