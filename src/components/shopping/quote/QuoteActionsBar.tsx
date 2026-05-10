import { Link } from 'react-router-dom'
import { ArrowRight, CircleCheck, ExternalLink, Eye, Package, RefreshCw, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import type { AdminShoppingQuotePayload, AdminShoppingQuoteViewProps } from '@/types/shopping'

type QuoteActionsBarAfterClientProps = {
  group: 'afterClient'
  convertedShipmentId?: number | null
  convertToShipmentAction?: {
    onConvert: () => void | Promise<void>
    isPending: boolean
  } | null
  confirmConvertOpen: boolean
  onConfirmConvertOpenChange: (open: boolean) => void
  resendQuoteAction?: {
    onResend: () => void | Promise<void>
    isPending: boolean
  } | null
  markPaidAction?: {
    onMarkPaid: () => void | Promise<void>
    isPending: boolean
  } | null
  paymentProofUrl?: string | null
}

type QuoteActionsBarAfterFinancialProps = {
  group: 'afterFinancial'
  canEdit: boolean
  linesLength: number
  isSending: boolean
  previewLoading: boolean
  onSendQuote?: (payload: AdminShoppingQuotePayload) => void | Promise<void>
  onRequestEmailPreview?: AdminShoppingQuoteViewProps['onRequestEmailPreview']
  onPreviewEmail: () => void
  onSubmitQuote: () => void
}

export type QuoteActionsBarProps = QuoteActionsBarAfterClientProps | QuoteActionsBarAfterFinancialProps

export function QuoteActionsBar(props: QuoteActionsBarProps) {
  if (props.group === 'afterClient') {
    const {
      convertedShipmentId,
      convertToShipmentAction,
      confirmConvertOpen,
      onConfirmConvertOpenChange,
      resendQuoteAction,
      markPaidAction,
      paymentProofUrl,
    } = props

    return (
      <>
        <div className="flex flex-wrap items-center gap-1.5">
          {convertedShipmentId != null && (
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1" asChild>
              <Link to={`/shipments/${convertedShipmentId}`}>
                <Package size={12} />
                Expédition #{convertedShipmentId}
                <ArrowRight size={11} />
              </Link>
            </Button>
          )}

          {convertToShipmentAction && convertedShipmentId == null && (
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs gap-1 bg-[#073763] hover:bg-[#0b5394] text-white"
              disabled={convertToShipmentAction.isPending}
              onClick={() => onConfirmConvertOpenChange(true)}
            >
              <Package size={12} />
              {convertToShipmentAction.isPending ? 'Conversion…' : 'Convertir en expédition'}
            </Button>
          )}

          {resendQuoteAction && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              disabled={resendQuoteAction.isPending}
              onClick={() => void resendQuoteAction.onResend()}
            >
              <RefreshCw className={cn('h-3 w-3', resendQuoteAction.isPending && 'animate-spin')} />
              {resendQuoteAction.isPending ? 'Envoi…' : 'Renvoyer le devis'}
            </Button>
          )}

          {markPaidAction && (
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={markPaidAction.isPending}
              onClick={() => void markPaidAction.onMarkPaid()}
            >
              <CircleCheck size={12} />
              {markPaidAction.isPending ? 'Validation…' : 'Valider paiement'}
            </Button>
          )}

          {paymentProofUrl && (
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
              <a href={paymentProofUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={12} />
                Preuve de paiement
              </a>
            </Button>
          )}
        </div>

        <AlertDialog open={confirmConvertOpen} onOpenChange={onConfirmConvertOpenChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Convertir en expédition logistique ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cela va créer un dossier d'expédition pour peser le colis et facturer le fret.
                L'achat assisté sera marqué comme converti et ne pourra plus être modifié.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={convertToShipmentAction?.isPending}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                type="button"
                className="bg-[#073763] text-white hover:bg-[#0b5394]"
                disabled={convertToShipmentAction?.isPending}
                onClick={() => {
                  onConfirmConvertOpenChange(false)
                  void convertToShipmentAction?.onConvert()
                }}
              >
                {convertToShipmentAction?.isPending ? 'Conversion…' : 'Confirmer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  const {
    canEdit,
    linesLength,
    isSending,
    previewLoading,
    onSendQuote,
    onRequestEmailPreview,
    onPreviewEmail,
    onSubmitQuote,
  } = props

  if (!(onSendQuote && canEdit)) {
    return null
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {onRequestEmailPreview && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={previewLoading || isSending || linesLength === 0}
          onClick={() => void onPreviewEmail()}
        >
          {previewLoading ? 'Préparation…' : (
            <>
              <Eye size={14} />
              Aperçu e-mail
            </>
          )}
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        className="gap-1.5 bg-[#073763] hover:bg-[#0b5394] text-white"
        disabled={isSending || linesLength === 0}
        onClick={() => void onSubmitQuote()}
      >
        {isSending ? 'Envoi en cours…' : (
          <>
            <Send size={14} />
            Envoyer le devis
          </>
        )}
      </Button>
    </div>
  )
}
