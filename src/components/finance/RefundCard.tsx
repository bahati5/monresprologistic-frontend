import type { UseMutationResult } from '@tanstack/react-query'
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { Refund } from '@/types/refund'
import { REFUND_STATUS_COLORS } from '@/types/refund'

type RejectVars = { id: number; rejection_reason: string }

type RefundCardProps = {
  refund: Refund
  isClient: boolean | undefined
  onOpenDetail: (id: number) => void
  rejectId: number | null
  setRejectId: (id: number | null) => void
  rejectReason: string
  setRejectReason: (v: string) => void
  approveMutation: UseMutationResult<unknown, unknown, number, unknown>
  rejectMutation: UseMutationResult<unknown, unknown, RejectVars, unknown>
  processMutation: UseMutationResult<unknown, unknown, number, unknown>
  completeMutation: UseMutationResult<unknown, unknown, number, unknown>
}

export function RefundCard({
  refund,
  isClient,
  onOpenDetail,
  rejectId,
  setRejectId,
  rejectReason,
  setRejectReason,
  approveMutation,
  rejectMutation,
  processMutation,
  completeMutation,
}: RefundCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{refund.reference_code}</span>
              <Badge className={REFUND_STATUS_COLORS[refund.status] ?? 'bg-gray-100 text-gray-800'}>{refund.status_label}</Badge>
            </div>
            {refund.client && <p className="text-sm text-muted-foreground">Client : {refund.client.name}</p>}
            <p className="text-sm line-clamp-2">{refund.reason}</p>
            {refund.rejection_reason && <p className="text-sm text-destructive">Rejeté : {refund.rejection_reason}</p>}
            <p className="text-xs text-muted-foreground">{new Date(refund.created_at).toLocaleDateString('fr-FR')}</p>
            <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => onOpenDetail(refund.id)}>
              Voir détail et commentaires
            </Button>
          </div>
          <div className="space-y-2 text-right">
            <p className="text-lg font-bold tabular-nums">
              {Number(refund.amount).toFixed(2)} {refund.currency}
            </p>
            {!isClient && (
              <div className="flex flex-wrap justify-end gap-1">
                {(refund.status === 'requested' || refund.status === 'under_review') && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => approveMutation.mutate(refund.id)}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle className="mr-1 h-3 w-3" /> Approuver
                    </Button>
                    <Dialog
                      open={rejectId === refund.id}
                      onOpenChange={(open) => {
                        if (!open) setRejectId(null)
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => setRejectId(refund.id)}
                        >
                          <XCircle className="mr-1 h-3 w-3" /> Rejeter
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Motif du rejet</DialogTitle>
                        </DialogHeader>
                        <Textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Expliquez…"
                        />
                        <Button
                          onClick={() => rejectMutation.mutate({ id: refund.id, rejection_reason: rejectReason })}
                          disabled={!rejectReason.trim()}
                        >
                          Confirmer le rejet
                        </Button>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
                {refund.status === 'approved' && (
                  <Button size="sm" onClick={() => processMutation.mutate(refund.id)} disabled={processMutation.isPending}>
                    <ArrowRight className="mr-1 h-3 w-3" /> Traiter
                  </Button>
                )}
                {refund.status === 'processed' && (
                  <Button
                    size="sm"
                    onClick={() => completeMutation.mutate(refund.id)}
                    disabled={completeMutation.isPending}
                  >
                    <CheckCircle className="mr-1 h-3 w-3" /> Terminer
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}