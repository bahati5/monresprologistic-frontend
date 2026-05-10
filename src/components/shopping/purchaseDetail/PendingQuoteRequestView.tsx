import { ArrowLeft, Clock, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MerchantLogoBadge } from '@/components/shopping/MerchantLogoBadge'
import type { PendingQuoteRow } from '@/components/shopping/purchaseDetail/pendingQuoteRows'

interface PendingQuoteRequestViewProps {
  rows: PendingQuoteRow[]
  onBack: () => void
}

export function PendingQuoteRequestView({ rows, onBack }: PendingQuoteRequestViewProps) {
  return (
    <div className="space-y-4">
      <div className="glass neo-raised rounded-xl px-5 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onBack}>
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Votre demande</h1>
        </div>
      </div>

      <div className="neo-inset rounded-xl px-4 py-3 flex items-start gap-3">
        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-lg shrink-0 mt-0.5">
          <Clock size={14} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Chiffrage en cours</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Notre équipe établit votre devis à partir des liens et quantités fournis.
            Vous recevrez un e-mail dès qu'il sera disponible.
          </p>
        </div>
      </div>

      <div className="glass neo-raised rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Articles demandés</h2>
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex items-start gap-3 neo-inset rounded-lg p-3"
            >
              <MerchantLogoBadge
                size="lg"
                logoUrl={row.merchant?.logo_url}
                merchantName={row.merchant?.name}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug">{row.label}</p>
                <p className="text-xs text-muted-foreground">Quantité : {row.qty}</p>
              </div>
              {row.url && (
                <Button variant="outline" size="sm" className="h-6 text-[11px] gap-1 px-2 shrink-0" asChild>
                  <a href={row.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={11} />
                    Lien
                  </a>
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
