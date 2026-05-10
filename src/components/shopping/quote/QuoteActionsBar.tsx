import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CircleCheck, ExternalLink, Eye, Package, RefreshCw, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { fadeInUp } from '@/lib/animations'
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
        {convertedShipmentId != null ? (
          <motion.div variants={fadeInUp}>
            <Card className="overflow-hidden rounded-2xl border border-indigo-200/80 bg-indigo-50/50 dark:border-indigo-500/25 dark:bg-indigo-500/10 shadow-sm">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                  <Package className="h-4 w-4 shrink-0" aria-hidden />
                  Converti en expédition
                </CardTitle>
                <CardDescription className="text-xs">
                  Cet achat assisté a été converti en dossier d'expédition logistique.
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <Link
                  to={`/shipments/${convertedShipmentId}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:underline"
                >
                  Voir l'expédition #{convertedShipmentId}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}

        {convertToShipmentAction && convertedShipmentId == null ? (
          <motion.div variants={fadeInUp}>
            <Card className="overflow-hidden rounded-2xl border border-blue-300/70 bg-gradient-to-br from-blue-50/90 to-background dark:border-blue-500/35 dark:from-blue-950/40 dark:to-card shadow-md ring-1 ring-blue-500/15">
              <CardHeader className="pb-2 border-b border-blue-200/60 dark:border-blue-500/20 bg-blue-100/40 dark:bg-blue-950/30">
                <CardTitle className="text-base flex items-center gap-2 font-semibold text-blue-900 dark:text-blue-100">
                  <Package className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-300" aria-hidden />
                  Pont vers l'expédition
                </CardTitle>
                <CardDescription className="text-xs text-blue-900/80 dark:text-blue-200/80">
                  Le colis est au hub. Créez le dossier d'expédition pour peser le colis, calculer le fret et facturer le client.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <Button
                  type="button"
                  size="lg"
                  disabled={convertToShipmentAction.isPending}
                  className="h-12 w-full sm:w-auto gap-2 text-base font-semibold bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500 shadow-md"
                  onClick={() => onConfirmConvertOpenChange(true)}
                >
                  <Package className="h-5 w-5 shrink-0" aria-hidden />
                  {convertToShipmentAction.isPending
                    ? 'Conversion en cours…'
                    : '\uD83D\uDCE6 Convertir en Expédition Logistique'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}

        {resendQuoteAction || markPaidAction ? (
          <motion.div variants={fadeInUp} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {resendQuoteAction ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={resendQuoteAction.isPending}
                onClick={() => void resendQuoteAction.onResend()}
              >
                <RefreshCw
                  className={cn('h-4 w-4 shrink-0', resendQuoteAction.isPending && 'animate-spin')}
                  aria-hidden
                />
                {resendQuoteAction.isPending ? 'Envoi…' : 'Renvoyer le devis au client'}
              </Button>
            ) : null}
            {markPaidAction ? (
              <Button
                type="button"
                size="sm"
                className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={markPaidAction.isPending}
                onClick={() => void markPaidAction.onMarkPaid()}
              >
                <CircleCheck className="h-4 w-4 shrink-0" aria-hidden />
                {markPaidAction.isPending ? 'Validation…' : 'Valider le paiement reçu'}
              </Button>
            ) : null}
          </motion.div>
        ) : null}

        {paymentProofUrl ? (
          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-3 rounded-xl border border-amber-200/70 bg-amber-50/50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-950/20">
              <ExternalLink className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
              <span className="text-sm font-medium text-amber-900 dark:text-amber-200">
                Le client a téléversé une preuve de paiement
              </span>
              <a
                href={paymentProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-amber-300/60 bg-white px-3 py-1 text-sm font-semibold text-amber-800 shadow-sm hover:bg-amber-50 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/60"
              >
                Voir la preuve
              </a>
            </div>
          </motion.div>
        ) : null}

        <AlertDialog open={confirmConvertOpen} onOpenChange={onConfirmConvertOpenChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Convertir en expédition logistique ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cela va créer un dossier d'expédition pour peser le colis et facturer le fret.
                L'achat assisté sera marqué comme converti et ne pourra plus être modifié. Continuer ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={convertToShipmentAction?.isPending}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                type="button"
                className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500"
                disabled={convertToShipmentAction?.isPending}
                onClick={() => {
                  onConfirmConvertOpenChange(false)
                  void convertToShipmentAction?.onConvert()
                }}
              >
                {convertToShipmentAction?.isPending ? 'Conversion…' : 'Confirmer la conversion'}
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
      {onRequestEmailPreview ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-12 flex-1 gap-2 text-base font-semibold sm:flex-1"
          disabled={previewLoading || isSending || linesLength === 0}
          onClick={() => void onPreviewEmail()}
        >
          {previewLoading ? (
            <>Préparation…</>
          ) : (
            <>
              <Eye className="h-5 w-5 shrink-0" aria-hidden />
              Aperçu e-mail
            </>
          )}
        </Button>
      ) : null}
      <Button
        type="button"
        size="lg"
        className="h-12 flex-1 gap-2 text-base font-semibold shadow-sm sm:min-w-[200px]"
        disabled={isSending || linesLength === 0}
        onClick={() => void onSubmitQuote()}
      >
        {isSending ? (
          <>Envoi en cours…</>
        ) : (
          <>
            <Send className="h-5 w-5 shrink-0" aria-hidden />
            Envoyer le devis au client
          </>
        )}
      </Button>
    </div>
  )
}
