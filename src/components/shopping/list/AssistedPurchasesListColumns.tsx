import type { ReactNode } from 'react'
import { displayLocalized } from '@/lib/localizedString'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { MerchantLogoBadge } from '@/components/shopping/MerchantLogoBadge'
import { primaryMerchantFromRow } from './assistedPurchasesListConstants'

export function getAssistedPurchasesListColumns(isStaff: boolean): {
  key: string
  label: string
  render?: (r: Record<string, unknown>) => ReactNode
}[] {
  return [
    { key: 'id', label: '#' },
    ...(isStaff
      ? [
          {
            key: 'user',
            label: 'Client',
            render: (r: Record<string, unknown>) => {
              const u = r.user as { name?: string } | undefined
              return displayLocalized(u?.name) || '—'
            },
          },
        ]
      : []),
    {
      key: 'article_label',
      label: 'Article',
      render: (r) => {
        const merchant = primaryMerchantFromRow(r)
        const items = r.items as { name?: string; display_label?: string }[] | undefined
        let text = '—'
        if (items && items.length > 0) {
          const row0 = items[0]
          const first =
            (typeof row0?.display_label === 'string' && row0.display_label.trim()) ||
            (typeof row0?.name === 'string' && row0.name.trim()) ||
            ''
          if (items.length > 1) {
            text = first ? `${first} (+${items.length - 1})` : `${items.length} articles`
          } else {
            text = first || (typeof r.article_label === 'string' && r.article_label.trim()) || '—'
          }
        } else if (typeof r.article_label === 'string' && r.article_label.trim()) {
          text = r.article_label.trim()
        }
        return (
          <div className="flex min-w-0 items-start gap-3">
            <div className="shrink-0 self-start">
              <MerchantLogoBadge
                size="lg"
                logoUrl={merchant?.logo_url}
                merchantName={merchant?.name}
              />
            </div>
            <span className="min-w-0 flex-1 font-medium leading-snug">{text}</span>
          </div>
        )
      },
    },
    {
      key: 'product_url',
      label: 'Lien',
      render: (r) => {
        const items = r.items as { url?: string }[] | undefined
        const u = items?.[0]?.url ? String(items[0].url) : String(r.product_url ?? '')
        if (!u) return '—'
        return u.length > 56 ? `${u.slice(0, 56)}…` : u
      },
    },
    {
      key: 'quantity',
      label: 'Qté',
      render: (r): ReactNode => {
        const items = r.items as { quantity?: number }[] | undefined
        if (items?.length) {
          return items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)
        }
        const q = r.quantity
        if (typeof q === 'number' && Number.isFinite(q)) return q
        if (typeof q === 'string' && q !== '') return q
        return '—'
      },
    },
    {
      key: 'status',
      label: 'Statut',
      render: (r) => {
        const label = displayLocalized((r.status_label as string) ?? r.status)
        const tone = typeof r.status_color === 'string' ? r.status_color.trim() : ''
        if (tone) {
          return (
            <Badge className={cn('text-xs font-semibold border-0', tone)}>{label}</Badge>
          )
        }
        return label
      },
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (r) => new Date(r.created_at as string).toLocaleDateString('fr-FR'),
    },
  ]
}
