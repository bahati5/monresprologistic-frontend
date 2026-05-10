import type { UseMutationResult } from '@tanstack/react-query'
import { Loader2, Layers } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { labelForRegroupementStatus } from '@/lib/shipmentDetailWorkflow'
import { SHIPMENT_STATUS_FILTER_OPTIONS } from '@/types/shipment'
import type { RegroupementsIndexData } from '@/hooks/useOperations'

type RegroupementRow = NonNullable<RegroupementsIndexData['regroupements']>[number]

export interface ShipmentDetailRegroupementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shipmentId: string | undefined
  regroupementRows: RegroupementRow[]
  consPickerLoading: boolean
  createRegroupement: UseMutationResult<unknown, Error, { shipment_ids: number[] }, unknown>
  attachToRegroupement: UseMutationResult<unknown, Error, { regroupementId: number; shipmentId: number }, unknown>
}

export function ShipmentDetailRegroupementDialog({
  open,
  onOpenChange,
  shipmentId,
  regroupementRows,
  consPickerLoading,
  createRegroupement,
  attachToRegroupement,
}: ShipmentDetailRegroupementDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Regrouper cette expédition</DialogTitle>
          <DialogDescription>
            Créez un nouveau lot ou ajoutez ce colis à un lot déjà ouvert. Aucune navigation vers la page
            Regroupements n’est nécessaire.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-1">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <p className="text-sm font-medium">Nouveau lot</p>
            <p className="text-xs text-muted-foreground">
              Un numéro de lot (ex. LOT-2604-001) sera généré automatiquement.
            </p>
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={createRegroupement.isPending || !shipmentId}
              onClick={() => {
                createRegroupement.mutate(
                  { shipment_ids: [Number(shipmentId)] },
                  { onSuccess: () => onOpenChange(false) },
                )
              }}
            >
              {createRegroupement.isPending ? 'Création…' : 'Créer un nouveau lot avec cette expédition'}
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden />
            <p className="relative mx-auto w-fit bg-background px-2 text-xs text-muted-foreground text-center">
              Ou ajouter à un lot existant
            </p>
          </div>
          {consPickerLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : regroupementRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun autre lot pour l’instant — utilisez « Nouveau lot » ci-dessus.
            </p>
          ) : (
            <ScrollArea className="h-[min(55vh,420px)] pr-3">
              <div className="space-y-3">
                {regroupementRows.map((c) => (
                  <Card key={c.id} className="border-border/80">
                    <CardHeader className="space-y-0 py-3 px-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="text-base font-mono tracking-tight">{c.batch_number}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            {labelForRegroupementStatus(c.status, SHIPMENT_STATUS_FILTER_OPTIONS)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="shrink-0"
                          disabled={attachToRegroupement.isPending || !shipmentId}
                          onClick={() => {
                            attachToRegroupement.mutate(
                              { regroupementId: c.id, shipmentId: Number(shipmentId) },
                              { onSuccess: () => onOpenChange(false) },
                            )
                          }}
                        >
                          Placer ici
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-0">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Colis dans ce regroupement ({c.shipments?.length ?? 0})
                      </p>
                      {(c.shipments?.length ?? 0) === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Aucun colis (regroupement vide)</p>
                      ) : (
                        <ul className="space-y-1.5 text-sm">
                          {(c.shipments ?? []).map(
                            (sh: {
                              id: number
                              public_tracking?: string | null
                              recipient_name?: string | null
                              recipient_profile?: { full_name?: string | null }
                            }) => (
                              <li
                                key={sh.id}
                                className="flex flex-wrap gap-x-2 gap-y-0.5 border-l-2 border-muted pl-2 py-0.5"
                              >
                                <span className="font-mono text-xs">{sh.public_tracking || `#${sh.id}`}</span>
                                <span className="text-muted-foreground truncate max-w-[220px]">
                                  {sh.recipient_name ?? sh.recipient_profile?.full_name ?? '—'}
                                </span>
                              </li>
                            ),
                          )}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export interface ShipmentDetailRegroupementOpenButtonProps {
  onOpen: () => void
}

export function ShipmentDetailRegroupementOpenButton({ onOpen }: ShipmentDetailRegroupementOpenButtonProps) {
  return (
    <Button variant="outline" size="sm" onClick={onOpen}>
      <Layers size={14} className="mr-1.5" />
      Regrouper
    </Button>
  )
}
