import { motion } from 'framer-motion'
import { AlertCircle, ShoppingBag } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fadeInUp } from '@/lib/animations'

export interface QuoteMarkOrderedDialogProps {
  statusCode: string
  orderedSupplierTracking?: string | null
  markOrderedAction?: {
    onSubmit: (supplierTrackingNumber: string | null) => void | Promise<void>
    isSubmitting: boolean
  } | null
  supplierTrackingInput: string
  onSupplierTrackingChange: (value: string) => void
  confirmOrderWithoutTracking: boolean
  onConfirmOrderWithoutTrackingChange: (open: boolean) => void
  onMarkOrderedClick: () => void
  onSubmitMarkOrdered: () => void | Promise<void>
}

export function QuoteMarkOrderedDialog({
  statusCode,
  orderedSupplierTracking,
  markOrderedAction,
  supplierTrackingInput,
  onSupplierTrackingChange,
  confirmOrderWithoutTracking,
  onConfirmOrderWithoutTrackingChange,
  onMarkOrderedClick,
  onSubmitMarkOrdered,
}: QuoteMarkOrderedDialogProps) {
  return (
    <>
      {statusCode === 'ordered' &&
      orderedSupplierTracking != null &&
      String(orderedSupplierTracking).trim() !== '' ? (
        <Card className="overflow-hidden rounded-2xl border border-violet-200/80 bg-violet-50/50 dark:border-violet-500/25 dark:bg-violet-500/10 shadow-sm">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-violet-900 dark:text-violet-200">
              <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden />
              Suivi fournisseur enregistré
            </CardTitle>
            <CardDescription className="text-xs">
              Ce numéro servira à l’arrivée du colis au hub (scan / rapprochement).
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 pt-0">
            <p className="font-mono text-sm font-semibold tracking-tight text-violet-950 dark:text-violet-100 break-all">
              {String(orderedSupplierTracking).trim()}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {statusCode === 'paid' && markOrderedAction ? (
        <motion.div variants={fadeInUp}>
          <Card className="overflow-hidden rounded-2xl border border-violet-300/70 bg-gradient-to-br from-violet-50/90 to-background dark:border-violet-500/35 dark:from-violet-950/40 dark:to-card shadow-md ring-1 ring-violet-500/15">
            <CardHeader className="pb-2 border-b border-violet-200/60 dark:border-violet-500/20 bg-violet-100/40 dark:bg-violet-950/30">
              <CardTitle className="text-base flex items-center gap-2 font-semibold text-violet-900 dark:text-violet-100">
                <ShoppingBag className="h-5 w-5 shrink-0 text-violet-600 dark:text-violet-300" aria-hidden />
                Action : passer la commande fournisseur
              </CardTitle>
              <CardDescription className="text-xs text-violet-900/80 dark:text-violet-200/80">
                Le paiement client est validé. Ouvrez les liens marchands, finalisez l’achat avec la carte
                entreprise, puis renseignez le numéro de suivi indiqué par le vendeur (Amazon Logistics,
                Colissimo, etc.).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <Alert variant="warning" className="border-amber-300/80 bg-amber-50/90 dark:bg-amber-950/25">
                <AlertCircle className="h-4 w-4" aria-hidden />
                <AlertTitle className="text-sm">Indispensable pour le hub</AlertTitle>
                <AlertDescription>
                  Sans ce numéro, le magasinier ne pourra pas rattacher physiquement le colis à ce dossier à
                  la réception. Saisissez-le dès qu’il est disponible sur le site marchand ou dans l’e-mail de
                  confirmation.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="supplier-tracking" className="text-sm font-medium">
                  Numéro de suivi fournisseur
                  <span className="text-muted-foreground font-normal"> (ex. tracking Amazon)</span>
                </Label>
                <Input
                  id="supplier-tracking"
                  className="h-10 font-mono text-sm"
                  placeholder="Ex. 1Z999AA10123456784, TBA1234567890…"
                  value={supplierTrackingInput}
                  onChange={(e) => onSupplierTrackingChange(e.target.value)}
                  disabled={markOrderedAction.isSubmitting}
                  autoComplete="off"
                />
              </div>
              <Button
                type="button"
                size="lg"
                disabled={markOrderedAction.isSubmitting}
                className="h-12 w-full sm:w-auto gap-2 text-base font-semibold bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-500 shadow-md"
                onClick={() => void onMarkOrderedClick()}
              >
                <ShoppingBag className="h-5 w-5 shrink-0" aria-hidden />
                {markOrderedAction.isSubmitting ? 'Enregistrement…' : 'Marquer comme commandé'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      <AlertDialog open={confirmOrderWithoutTracking} onOpenChange={onConfirmOrderWithoutTrackingChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Continuer sans numéro de suivi&nbsp;?</AlertDialogTitle>
            <AlertDialogDescription>
              Il est fortement recommandé de renseigner le suivi fournisseur maintenant pour faciliter la
              réception au hub. Vous pourrez compléter plus tard seulement si votre processus interne le permet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={markOrderedAction?.isSubmitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              className="bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-500"
              disabled={markOrderedAction?.isSubmitting}
              onClick={() => {
                onConfirmOrderWithoutTrackingChange(false)
                void onSubmitMarkOrdered()
              }}
            >
              Confirmer sans suivi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
