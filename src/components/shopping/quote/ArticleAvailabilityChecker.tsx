import { useState } from 'react'
import {
  ExternalLink,
  Check,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Loader2,
  TriangleAlert,
  RefreshCcw,
  Store,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { MerchantLogoBadge } from '@/components/shopping/MerchantLogoBadge'
import { useFormatMoney } from '@/hooks/settings/useBranding'
import type { PurchaseArticle, ArticleAvailability } from '@/types/assistedPurchase'

interface Props {
  articles: PurchaseArticle[]
  clientNote: string | null
  onAvailabilityChange: (articleId: number, availability: ArticleAvailability) => void
  readOnly?: boolean
  onRetryExtraction?: (articleId: number) => void
  onMarkAllUnavailable?: () => void
}

function statusIcon(status: ArticleAvailability['status']) {
  switch (status) {
    case 'available_exact':
      return <Check size={14} className="text-green-600" />
    case 'available_alternative':
      return <AlertTriangle size={14} className="text-amber-500" />
    case 'unavailable':
      return <XCircle size={14} className="text-red-500" />
    default:
      return <HelpCircle size={14} className="text-muted-foreground" />
  }
}

function statusLabel(status: ArticleAvailability['status']): string {
  switch (status) {
    case 'available_exact': return 'Disponible — variante exacte'
    case 'available_alternative': return 'Disponible — variante alternative'
    case 'unavailable': return 'Indisponible'
    default: return 'Non vérifié'
  }
}

function statusColor(status: ArticleAvailability['status']): string {
  switch (status) {
    case 'available_exact': return 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
    case 'available_alternative': return 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
    case 'unavailable': return 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
    default: return 'bg-muted/30 border-border'
  }
}

function ScrapeStatusBadge({ status, onRetry }: { status: PurchaseArticle['scrape_status']; onRetry?: () => void }) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="text-[10px] gap-1 bg-blue-50 text-blue-700 border-blue-200">
          <Loader2 size={10} className="animate-spin" /> Extraction en cours
        </Badge>
      )
    case 'failed':
      return (
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-[10px] gap-1 bg-red-50 text-red-600 border-red-200">
            <TriangleAlert size={10} /> Extraction échouée
          </Badge>
          {onRetry && (
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onRetry}>
              <RefreshCcw size={10} />
            </Button>
          )}
        </div>
      )
    case 'success':
      return (
        <Badge variant="outline" className="text-[10px] gap-1 bg-green-50 text-green-700 border-green-200">
          <Check size={10} /> Données extraites
        </Badge>
      )
    default:
      return null
  }
}

function ThirdPartySellerAlert({ article }: { article: PurchaseArticle }) {
  const merchantName = article.merchant?.name?.toLowerCase() ?? ''
  const isMarketplace = ['amazon', 'cdiscount', 'ebay', 'aliexpress', 'alibaba'].some(
    (mp) => merchantName.includes(mp),
  )

  if (!isMarketplace) return null

  const hasThirdPartySeller =
    article.product_url.includes('seller=') ||
    article.product_url.includes('sold-by') ||
    article.product_url.includes('marketplace=true') ||
    (article.attributes?.['seller'] && article.attributes['seller'].some(
      (s) => s.toLowerCase() !== merchantName && !s.toLowerCase().includes('officiel'),
    ))

  if (!hasThirdPartySeller) return null

  return (
    <div className="flex items-start gap-1.5 mt-1.5 rounded-md bg-amber-50 border border-amber-200 p-2">
      <Store size={12} className="text-amber-600 mt-0.5 shrink-0" />
      <p className="text-[11px] text-amber-700">
        <span className="font-medium">Vendeur tiers détecté</span> — cet article est vendu par un vendeur tiers
        sur la marketplace. Vérifiez la fiabilité du vendeur et les conditions de livraison.
      </p>
    </div>
  )
}

function ArticleAvailabilityCard({
  article,
  onAvailabilityChange,
  readOnly,
  onRetryExtraction,
}: {
  article: PurchaseArticle
  onAvailabilityChange: (availability: ArticleAvailability) => void
  readOnly?: boolean
  onRetryExtraction?: () => void
}) {
  const { formatMoney } = useFormatMoney()
  const [alternativeNote, setAlternativeNote] = useState(article.availability.alternative_note)
  const currentStatus = article.availability.status

  const setStatus = (status: ArticleAvailability['status']) => {
    onAvailabilityChange({ status, alternative_note: alternativeNote })
  }

  return (
    <div className={`rounded-xl border p-4 transition-colors ${statusColor(currentStatus)}`}>
      <div className="flex items-start gap-3">
        <MerchantLogoBadge
          logoUrl={article.merchant?.logo_url}
          merchantName={article.merchant?.name ?? article.name}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-medium">{article.name}</h3>
            <ScrapeStatusBadge status={article.scrape_status} onRetry={onRetryExtraction} />
            {article.product_url && (
              <Button variant="outline" size="sm" className="h-5 text-[10px] gap-0.5 px-1.5" asChild>
                <a href={article.product_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={10} /> Ouvrir le lien
                </a>
              </Button>
            )}
          </div>

          {article.price_converted != null && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Prix extrait : {article.currency_original && `${article.currency_original} `}
              {article.price_original != null ? article.price_original.toFixed(2) : '—'}
              {article.price_converted != null && ` → ${formatMoney(article.price_converted)}`}
            </p>
          )}

          <ThirdPartySellerAlert article={article} />

          {article.attributes && Object.keys(article.attributes).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {Object.entries(article.attributes).map(([key, values]) => (
                <Badge key={key} variant="outline" className="text-[10px]">
                  {key}: {values.join(', ')}
                </Badge>
              ))}
            </div>
          )}

          {article.preference && (
            <div className="mt-2 rounded-lg border border-border/50 p-2.5 bg-background/50">
              <p className="text-xs font-medium">Préférence principale</p>
              <p className="text-xs text-muted-foreground">{article.preference.primary}</p>
              {article.preference.alternative_declared && article.preference.alternative && (
                <>
                  <p className="text-xs font-medium mt-1.5">Alternative déclarée par le client</p>
                  <p className="text-xs text-muted-foreground">{article.preference.alternative}</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {!readOnly && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium">Disponibilité vérifiée par le staff</p>
          <div className="space-y-1.5">
            {(['not_checked', 'available_exact', 'available_alternative', 'unavailable'] as const).map(
              (status) => (
                <label
                  key={status}
                  className="flex items-center gap-2 text-xs cursor-pointer hover:bg-background/50 rounded-md p-1.5 transition-colors"
                >
                  <input
                    type="radio"
                    name={`availability-${article.id}`}
                    checked={currentStatus === status}
                    onChange={() => setStatus(status)}
                    className="accent-[#073763]"
                  />
                  {statusIcon(status)}
                  <span>{statusLabel(status)}</span>
                </label>
              ),
            )}
          </div>

          {currentStatus === 'available_alternative' && (
            <div className="space-y-1.5 mt-2">
              <Textarea
                value={alternativeNote}
                onChange={(e) => {
                  setAlternativeNote(e.target.value)
                  onAvailabilityChange({ status: currentStatus, alternative_note: e.target.value })
                }}
                placeholder="Disponible en noir (blanc indisponible)"
                rows={2}
                className="text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Cette note sera visible dans le devis PDF envoyé au client.
              </p>
            </div>
          )}
        </div>
      )}

      {readOnly && (
        <div className="mt-2 flex items-center gap-1.5">
          {statusIcon(currentStatus)}
          <span className="text-xs font-medium">{statusLabel(currentStatus)}</span>
        </div>
      )}
    </div>
  )
}

export function ArticleAvailabilityChecker({
  articles,
  clientNote,
  onAvailabilityChange,
  readOnly,
  onRetryExtraction,
  onMarkAllUnavailable,
}: Props) {
  const allChecked = articles.every((a) => a.availability.status !== 'not_checked')
  const allUnavailable = articles.length > 0 && articles.every((a) => a.availability.status === 'unavailable')
  const hasPendingScrape = articles.some((a) => a.scrape_status === 'pending')
  const uncheckedCount = articles.filter((a) => a.availability.status === 'not_checked').length

  return (
    <div className="space-y-4">
      <div className="glass neo-raised rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold">Articles demandés — vérification</h2>
            {!allChecked && !readOnly && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {uncheckedCount} article{uncheckedCount > 1 ? 's' : ''} à vérifier avant envoi
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasPendingScrape && (
              <Badge variant="outline" className="text-[10px] gap-1 bg-blue-50 text-blue-700 border-blue-200">
                <Loader2 size={10} className="animate-spin" /> Extraction en cours
              </Badge>
            )}
            {!allChecked && !readOnly && (
              <Badge variant="destructive" className="text-[10px]">
                <AlertTriangle size={10} className="mr-0.5" />
                Vérification requise
              </Badge>
            )}
            {allChecked && !readOnly && (
              <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                <Check size={10} className="mr-0.5" />
                Tous vérifiés
              </Badge>
            )}
          </div>
        </div>

        {clientNote && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-3">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Note du client</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 whitespace-pre-wrap">{clientNote}</p>
          </div>
        )}

        <div className="space-y-3">
          {articles.map((article) => (
            <ArticleAvailabilityCard
              key={article.id}
              article={article}
              onAvailabilityChange={(av) => onAvailabilityChange(article.id, av)}
              readOnly={readOnly}
              onRetryExtraction={onRetryExtraction ? () => onRetryExtraction(article.id) : undefined}
            />
          ))}
        </div>

        {allUnavailable && !readOnly && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 space-y-2">
            <p className="text-xs font-medium text-red-700 dark:text-red-300">
              Tous les articles sont indisponibles. L'envoi du devis sera remplacé par une notification
              d'indisponibilité au client.
            </p>
            {onMarkAllUnavailable && (
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs"
                onClick={onMarkAllUnavailable}
              >
                <XCircle size={12} className="mr-1" />
                Notifier indisponibilité totale
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
