import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import CommentThread from '@/components/comments/CommentThread'
import { cn } from '@/lib/utils'
import type { Refund } from '@/types/refund'
import { REFUND_STATUS_COLORS, downloadRefundRequestProof } from '@/types/refund'

type RefundDetailPanelProps = {
  detailLoading: boolean
  detailData: (Refund & Record<string, unknown>) | undefined
}

export function RefundDetailPanel({ detailLoading, detailData }: RefundDetailPanelProps) {
  if (detailLoading || !detailData) {
    return <div className="flex justify-center py-10 text-muted-foreground text-sm">Chargement…</div>
  }

  return (
    <ScrollArea className="max-h-[min(70vh,520px)] pr-3">
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold text-base">{detailData.reference_code}</p>
            <Badge className={cn('mt-2', REFUND_STATUS_COLORS[detailData.status] ?? 'bg-gray-100 text-gray-800')}>
              {detailData.status_label}
            </Badge>
          </div>
          <p>
            <span className="text-muted-foreground">Montant : </span>
            <span className="font-semibold tabular-nums">
              {Number(detailData.amount).toFixed(2)} {detailData.currency}
            </span>
          </p>
          {detailData.client ? (
            <p>
              <span className="text-muted-foreground">Client : </span>
              {detailData.client.name}
            </p>
          ) : null}
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Motif</p>
            <p className="whitespace-pre-wrap">{detailData.reason}</p>
          </div>
          {detailData.rejection_reason ? (
            <p className="text-destructive">
              <span className="font-medium">Rejet : </span>
              {detailData.rejection_reason}
            </p>
          ) : null}
          {detailData.has_request_proof ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => void downloadRefundRequestProof(detailData.id)}
            >
              <Download className="h-4 w-4" aria-hidden />
              Télécharger le justificatif (demande)
            </Button>
          ) : null}
          <div className="grid gap-1 text-xs text-muted-foreground border-t pt-3">
            <p>Créé : {new Date(detailData.created_at).toLocaleString('fr-FR')}</p>
            {detailData.reviewed_at ? (
              <p>Examiné : {new Date(detailData.reviewed_at).toLocaleString('fr-FR')}</p>
            ) : null}
            {detailData.processed_at ? (
              <p>Traité : {new Date(detailData.processed_at).toLocaleString('fr-FR')}</p>
            ) : null}
            {detailData.completed_at ? (
              <p>Terminé : {new Date(detailData.completed_at).toLocaleString('fr-FR')}</p>
            ) : null}
          </div>
          <div className="border-t pt-4">
            <CommentThread commentableType="refund" commentableId={detailData.id} />
          </div>
        </div>
      </ScrollArea>
  )
}
