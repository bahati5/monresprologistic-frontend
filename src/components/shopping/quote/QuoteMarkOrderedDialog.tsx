import { motion } from 'framer-motion'
import { AlertCircle, ShoppingBag, Truck } from 'lucide-react'

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
      {/* Suivi fournisseur déjà enregistré */}
      {statusCode === 'ordered' &&
      orderedSupplierTracking != null &&
      String(orderedSupplierTracking).trim() !== '' && (
        <div className="neo-inset rounded-lg px-3 py-2 mt-3 flex items-center gap-2">
          <Truck size={13} className="text-[#073763] shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Suivi fournisseur</p>
            <p className="font-mono text-xs font-semibold text-foreground break-all">
              {String(orderedSupplierTracking).trim()}
            </p>
          </div>
        </div>
      )}

      {/* Action: passer la commande fournisseur */}
      {statusCode === 'paid' && markOrderedAction && (
        <motion.div variants={fadeInUp} className="mt-3">
          <div className="glass neo-raised-sm rounded-xl p-4 space-y-3 border border-violet-200/40 dark:border-violet-500/20">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-violet-100 dark:bg-violet-900/40 rounded-lg">
                <ShoppingBag size={14} className="text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Commande fournisseur</h3>
                <p className="text-[11px] text-muted-foreground">
                  Paiement validé — ouvrez les liens, finalisez l'achat, puis renseignez le suivi.
                </p>
              </div>
            </div>

            <div className="neo-inset rounded-lg px-3 py-2 flex items-start gap-2">
              <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground">
                Sans numéro de suivi, le hub ne pourra pas rattacher le colis à ce dossier.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="supplier-tracking" className="text-xs font-medium">
                N° suivi fournisseur
              </Label>
              <Input
                id="supplier-tracking"
                className="h-8 font-mono text-sm"
                placeholder="Ex. TBA1234567890…"
                value={supplierTrackingInput}
                onChange={(e) => onSupplierTrackingChange(e.target.value)}
                disabled={markOrderedAction.isSubmitting}
                autoComplete="off"
              />
            </div>

            <Button
              type="button"
              size="sm"
              disabled={markOrderedAction.isSubmitting}
              className="gap-1.5 bg-violet-600 text-white hover:bg-violet-700"
              onClick={() => void onMarkOrderedClick()}
            >
              <ShoppingBag size={13} />
              {markOrderedAction.isSubmitting ? 'Enregistrement…' : 'Marquer comme commandé'}
            </Button>
          </div>
        </motion.div>
      )}

      <AlertDialog open={confirmOrderWithoutTracking} onOpenChange={onConfirmOrderWithoutTrackingChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Continuer sans numéro de suivi ?</AlertDialogTitle>
            <AlertDialogDescription>
              Il est fortement recommandé de renseigner le suivi fournisseur maintenant pour faciliter
              la réception au hub.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={markOrderedAction?.isSubmitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              className="bg-violet-600 text-white hover:bg-violet-700"
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
