import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import GenericListPage from '@/pages/GenericListPage'
import { useAuthStore } from '@/stores/authStore'
import { usePublicBranding } from '@/hooks/useSettings'
import { displayLocalized } from '@/lib/localizedString'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MerchantLogoBadge } from '@/components/shopping/MerchantLogoBadge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type RowMerchant = { name?: string; logo_url?: string | null }

function primaryMerchantFromRow(r: Record<string, unknown>): RowMerchant | null {
  const items = r.items as { merchant?: Record<string, unknown> | null }[] | undefined
  const raw = items?.[0]?.merchant
  if (!raw || typeof raw !== 'object') return null
  const logo = raw.logo_url
  return {
    name: typeof raw.name === 'string' ? raw.name : undefined,
    logo_url: logo != null && String(logo).trim() !== '' ? String(logo).trim() : null,
  }
}

/** Valeurs alignées sur App\Enums\AssistedPurchaseStatus */
const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'pending_quote', label: 'En cours de chiffrage' },
  { value: 'awaiting_payment', label: 'Devis disponible' },
  { value: 'paid', label: 'Paiement validé' },
  { value: 'ordered', label: 'Acheté chez le fournisseur' },
  { value: 'arrived_at_hub', label: "Colis reçu à l'entrepôt" },
  { value: 'converted_to_shipment', label: 'Converti en expédition' },
  { value: 'cancelled', label: 'Annulé' },
]

export default function AssistedPurchasesListPage() {
  const { user } = useAuthStore()
  const { data: branding } = usePublicBranding()
  const [searchParams, setSearchParams] = useSearchParams()

  const [activeTab, setActiveTab] = useState<'active' | 'history'>(() => {
    const t = searchParams.get('tab')
    return t === 'history' ? 'history' : 'active'
  })

  const isStaff = Boolean(
    user?.roles?.some((r) => ['super_admin', 'agency_admin', 'operator'].includes(r)),
  )

  const patchQuery = useCallback(
    (patches: Record<string, string>) => {
      const next = new URLSearchParams(searchParams)
      for (const [k, raw] of Object.entries(patches)) {
        if (raw === '' || raw == null) next.delete(k)
        else next.set(k, raw)
      }
      if (!('page' in patches)) next.set('page', '1')
      setSearchParams(next)
    },
    [searchParams, setSearchParams],
  )

  const resetFilters = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    ;['status', 'date_from', 'date_to', 'client_search', 'user_id', 'merchant_id', 'search', 'page'].forEach(
      (k) => next.delete(k),
    )
    setSearchParams(next)
  }, [searchParams, setSearchParams])

  const merchantIdParam = searchParams.get('merchant_id') || ''
  const merchantIdApi =
    merchantIdParam !== '' && Number.isFinite(Number(merchantIdParam)) ? merchantIdParam : undefined

  const extraApiParams = useMemo(
    () => ({
      status: searchParams.get('status') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      client_search: isStaff ? searchParams.get('client_search') || undefined : undefined,
      merchant_id: merchantIdApi,
      tab: activeTab,
    }),
    [searchParams, isStaff, merchantIdApi, activeTab],
  )

  const { data: merchantsRes } = useQuery({
    queryKey: ['merchants', 'active-list'],
    queryFn: () =>
      api.get<{ merchants: { id: number; name: string }[] }>('/api/merchants').then((r) => r.data),
    staleTime: 60_000,
  })
  const merchantsList = merchantsRes?.merchants ?? []

  const statusValue = searchParams.get('status') || 'all'
  const merchantKnown =
    merchantIdParam === '' ||
    merchantsList.some((m) => String(m.id) === merchantIdParam)
  const siteFilterValue = merchantKnown ? merchantIdParam || 'all' : merchantIdParam
  const clientSearchParam = searchParams.get('client_search') || ''
  const [clientDraft, setClientDraft] = useState(clientSearchParam)
  useEffect(() => {
    setClientDraft(clientSearchParam)
  }, [clientSearchParam])

  const applyClientFilter = useCallback(() => {
    const t = clientDraft.trim()
    patchQuery({ client_search: t, page: '1' })
  }, [clientDraft, patchQuery])

  const dateFrom = searchParams.get('date_from') || ''
  const dateTo = searchParams.get('date_to') || ''

  const columns: {
    key: string
    label: string
    render?: (r: Record<string, unknown>) => ReactNode
  }[] = [
    { key: 'id', label: '#' },
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
      key: 'created_at',
      label: 'Date',
      render: (r) => new Date(r.created_at as string).toLocaleDateString('fr-FR'),
    },
  ]

  const filtersSlot = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full min-w-[200px] max-w-xs space-y-1.5">
          <Label htmlFor="filter-status" className="text-xs">
            Statut
          </Label>
          <Select
            value={statusValue}
            onValueChange={(v) => {
              patchQuery({ status: v === 'all' ? '' : v, page: '1' })
            }}
          >
            <SelectTrigger id="filter-status" className="h-9">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {STATUS_FILTER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full min-w-[200px] max-w-xs space-y-1.5">
          <Label htmlFor="filter-site" className="text-xs">
            Site / marchand
          </Label>
          <Select
            value={siteFilterValue}
            onValueChange={(v) => {
              patchQuery({ merchant_id: v === 'all' ? '' : v, page: '1' })
            }}
          >
            <SelectTrigger id="filter-site" className="h-9">
              <SelectValue placeholder="Tous les sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les sites</SelectItem>
              {!merchantKnown && merchantIdParam ? (
                <SelectItem value={merchantIdParam}>Marchand (id {merchantIdParam})</SelectItem>
              ) : null}
              {merchantsList.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isStaff ? (
          <div className="w-full min-w-[200px] max-w-sm flex-1 space-y-1.5">
            <Label htmlFor="filter-client" className="text-xs">
              Client (nom ou e-mail)
            </Label>
            <Input
              id="filter-client"
              placeholder="Saisir puis Entrée ou quitter le champ…"
              value={clientDraft}
              onChange={(e) => setClientDraft(e.target.value)}
              onBlur={applyClientFilter}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyClientFilter()
              }}
            />
          </div>
        ) : null}

        <div className="w-full min-w-[140px] max-w-[180px] space-y-1.5">
          <Label htmlFor="filter-from" className="text-xs">
            Date du
          </Label>
          <Input
            id="filter-from"
            type="date"
            value={dateFrom}
            onChange={(e) => patchQuery({ date_from: e.target.value, page: '1' })}
          />
        </div>

        <div className="w-full min-w-[140px] max-w-[180px] space-y-1.5">
          <Label htmlFor="filter-to" className="text-xs">
            au
          </Label>
          <Input
            id="filter-to"
            type="date"
            value={dateTo}
            onChange={(e) => patchQuery({ date_to: e.target.value, page: '1' })}
          />
        </div>

        <Button type="button" variant="outline" size="sm" className="mb-0.5" onClick={resetFilters}>
          Réinitialiser les filtres
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          const next = v as 'active' | 'history'
          setActiveTab(next)
          const sp = new URLSearchParams(searchParams)
          sp.set('tab', next)
          sp.set('page', '1')
          setSearchParams(sp)
        }}
      >
        <TabsList>
          <TabsTrigger value="active">En cours</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>
      </Tabs>

      <GenericListPage
        title="Shopping Assisté"
        apiPath="/api/assisted-purchases"
        dataKey="purchases"
        columns={columns}
        createPath="/shopping-assiste/nouveau"
        createLabel="Nouvelle demande"
        logoUrl={branding?.logo_url ?? null}
        logoAlt={branding?.site_name ? `${branding.site_name} — logo` : 'Logo'}
        extraApiParams={extraApiParams}
        filtersSlot={filtersSlot}
        detailPath={(row: Record<string, unknown>) =>
          isStaff ? `/purchase-orders/${row.id}/chiffrage` : `/purchase-orders/${row.id}`
        }
      />
    </div>
  )
}
