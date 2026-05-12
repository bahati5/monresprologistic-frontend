import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  Bell,
  BellRing,
  CheckCircle2,
  XCircle,
  TimerOff,
  Phone,
  Eye,
  BellOff,
  RotateCw,
  Archive,
  TrendingUp,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { CurrencyIcon } from '@/components/ui/CurrencyIcon'
import { useFormatMoney } from '@/hooks/settings/useBranding'
import {
  useQuoteDashboardMetrics,
  useQuoteDashboardList,
  useProlongQuote,
  useCancelReminders,
} from '@/hooks/useQuoteFollowUp'
import { STATUS_CONFIG, QUOTE_DASHBOARD_TABS } from '@/constants/assistedPurchase'
import type { AssistedPurchaseStatus, QuoteDashboardRow } from '@/types/assistedPurchase'

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Il y a 1 jour'
  return `Il y a ${days} jours`
}

function daysUntil(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = new Date(dateStr).getTime() - Date.now()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days < 0) return 'Expiré'
  if (days === 0) return "Expire aujourd'hui"
  if (days === 1) return 'Expire demain'
  return `Expire dans ${days}j`
}

function statusIcon(status: AssistedPurchaseStatus) {
  switch (status) {
    case 'quote_sent': return <Clock size={14} className="text-blue-500" />
    case 'reminder_1': return <Bell size={14} className="text-amber-500" />
    case 'reminder_2': return <BellRing size={14} className="text-orange-500" />
    case 'awaiting_payment': return <CheckCircle2 size={14} className="text-green-500" />
    case 'expired': return <TimerOff size={14} className="text-gray-400" />
    case 'cancelled': return <XCircle size={14} className="text-red-500" />
    default: return <Clock size={14} className="text-muted-foreground" />
  }
}

function QuoteRowCard({
  quote,
  onProlong,
  onCancelReminders,
  formatMoney,
}: {
  quote: QuoteDashboardRow
  onProlong: (id: number) => void
  onCancelReminders: (id: number) => void
  formatMoney: (amount: number, fractionDigits?: { min?: number; max?: number }) => string
}) {
  const config = STATUS_CONFIG[quote.status] ?? { label: quote.status, hex: '#6b7280' }

  return (
    <div className="rounded-xl border border-border p-4 hover:bg-muted/20 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{quote.reference}</span>
            <span className="text-sm text-muted-foreground">{quote.client_name}</span>
            <span className="text-sm font-medium tabular-nums">{formatMoney(quote.amount)}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {statusIcon(quote.status)}
            <Badge
              style={{ backgroundColor: `${config.hex}15`, color: config.hex, borderColor: `${config.hex}30` }}
              className="text-[10px] border"
            >
              {config.label}
            </Badge>
            {quote.sent_at && (
              <span className="text-[11px] text-muted-foreground">{timeAgo(quote.sent_at)}</span>
            )}
            {quote.expires_at && (
              <span className="text-[11px] text-muted-foreground">{daysUntil(quote.expires_at)}</span>
            )}
          </div>
          {quote.has_call_task && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Phone size={11} className="text-amber-500" />
              <span className="text-[11px] text-amber-600 dark:text-amber-400">
                Tâche ouverte : « appel recommandé »
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
          <Link to={`/purchase-orders/${quote.id}/chiffrage`}>
            <Eye size={12} /> Voir devis
          </Link>
        </Button>
        {(quote.status === 'quote_sent' || quote.status === 'reminder_1' || quote.status === 'reminder_2') && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => onProlong(quote.id)}
            >
              <RotateCw size={12} /> Prolonger
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground"
              onClick={() => onCancelReminders(quote.id)}
            >
              <BellOff size={12} /> Annuler relances
            </Button>
          </>
        )}
        {quote.status === 'expired' && (
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" asChild>
            <Link to={`/purchase-orders/${quote.id}/chiffrage`}>
              <Archive size={12} /> Archiver
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}

export default function QuoteDashboardPage() {
  const { formatMoney } = useFormatMoney()
  const [activeTab, setActiveTab] = useState<string>('all')
  const { data: metrics, isLoading: metricsLoading } = useQuoteDashboardMetrics()
  const { data: quotes, isLoading: listLoading } = useQuoteDashboardList(activeTab)
  const prolongMut = useProlongQuote()
  const cancelMut = useCancelReminders()
  const [prolongDialog, setProlongDialog] = useState<{ id: number; open: boolean }>({ id: 0, open: false })
  const [prolongDays, setProlongDays] = useState('3')

  const handleProlong = (id: number) => {
    setProlongDialog({ id, open: true })
    setProlongDays('3')
  }

  const confirmProlong = () => {
    prolongMut.mutate(
      { id: prolongDialog.id, days: Number(prolongDays) },
      { onSuccess: () => setProlongDialog({ id: 0, open: false }) },
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-linear-to-r from-[#073763] to-[#0b5394] rounded-xl p-8 text-white shadow-sm">
        <h1 className="text-4xl font-light mb-2">Suivi des devis</h1>
        <p className="text-white/80 font-light">
          Suivez les devis en cours, les relances et les réponses clients.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-white dark:bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">Devis ouverts</CardTitle>
            <div className="p-3 bg-[#073763]/5 rounded-xl">
              <BarChart3 className="h-6 w-6 text-[#073763]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-light text-[#073763] mb-2">
              {metricsLoading ? '—' : metrics?.total_open ?? 0}
            </div>
            <p className="text-sm text-gray-500">devis en attente de réponse</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">Valeur en attente</CardTitle>
            <div className="p-3 bg-[#073763]/5 rounded-xl">
              <CurrencyIcon className="h-6 w-6 text-[#073763]" size={24} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-light text-[#073763] mb-2">
              {metricsLoading ? '—' : formatMoney(metrics?.total_value_pending ?? 0)}
            </div>
            <p className="text-sm text-gray-500">en attente de paiement</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">Taux d'acceptation</CardTitle>
            <div className="p-3 bg-[#073763]/5 rounded-xl">
              <TrendingUp className="h-6 w-6 text-[#073763]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-light text-[#073763] mb-2">
              {metricsLoading ? '—' : `${metrics?.acceptance_rate_month ?? 0}%`}
            </div>
            <p className="text-sm text-gray-500">ce mois</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">Par statut</CardTitle>
            <div className="p-3 bg-[#073763]/5 rounded-xl">
              <Clock className="h-6 w-6 text-[#073763]" />
            </div>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="h-16 animate-pulse rounded bg-muted" />
            ) : (
              <div className="space-y-1">
                {Object.entries(metrics?.quotes_by_status ?? {}).map(([status, count]) => {
                  const cfg = STATUS_CONFIG[status as AssistedPurchaseStatus]
                  return (
                    <div key={status} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{cfg?.label ?? status}</span>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUOTE_DASHBOARD_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {listLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-4 animate-pulse">
              <div className="h-5 w-48 rounded bg-muted mb-2" />
              <div className="h-4 w-32 rounded bg-muted" />
            </div>
          ))
        ) : (quotes ?? []).length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Aucun devis dans cette catégorie.</p>
          </div>
        ) : (
          (quotes ?? []).map((q) => (
            <QuoteRowCard
              key={q.id}
              quote={q}
              onProlong={handleProlong}
              onCancelReminders={(id) => cancelMut.mutate(id)}
              formatMoney={formatMoney}
            />
          ))
        )}
      </div>

      <Dialog open={prolongDialog.open} onOpenChange={(o) => setProlongDialog((p) => ({ ...p, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prolonger le devis</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Le compteur d'expiration sera repoussé et les relances reprogrammées.
            </p>
            <div className="space-y-2">
              <Label>Prolonger de (jours)</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={prolongDays}
                onChange={(e) => setProlongDays(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProlongDialog({ id: 0, open: false })}>Annuler</Button>
            <Button onClick={confirmProlong} disabled={prolongMut.isPending}>
              {prolongMut.isPending ? 'En cours…' : 'Prolonger'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
