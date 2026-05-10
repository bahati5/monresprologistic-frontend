import type { Dispatch, SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { UseMutationResult } from '@tanstack/react-query'

type RegroupementPickerItem = {
  id: number
  batch_number: string
  shipments?: unknown[]
}

interface BulkRegroupementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: Set<number>
  setSelectedIds: Dispatch<SetStateAction<Set<number>>>
  regroupePickerLoading: boolean
  regroupementChoices: RegroupementPickerItem[]
  attachBulk: UseMutationResult<
    unknown,
    Error,
    { regroupementId: number; shipmentIds: number[] }
  >
  createRegroupement: UseMutationResult<unknown, Error, { shipment_ids: number[] }>
  handleCreateLotFromSelection: () => void
}

export function BulkRegroupementDialog({
  open,
  onOpenChange,
  selectedIds,
  setSelectedIds,
  regroupePickerLoading,
  regroupementChoices,
  attachBulk,
  createRegroupement,
  handleCreateLotFromSelection,
}: BulkRegroupementDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter à un lot existant</DialogTitle>
          <DialogDescription>
            Les {selectedIds.size} expédition(s) sélectionnée(s) seront rattachées au lot choisi.
          </DialogDescription>
        </DialogHeader>
        {regroupePickerLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Chargement…</p>
        ) : regroupementChoices.length === 0 ? (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Aucun lot ouvert pour l’instant. Utilisez « Nouveau lot » depuis la liste pour en créer un sans quitter cette page.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[min(50vh,360px)] pr-2">
            <ul className="space-y-2">
              {regroupementChoices.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium truncate">{r.batch_number}</p>
                    <p className="text-xs text-muted-foreground">{r.shipments?.length ?? 0} colis</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={attachBulk.isPending}
                    onClick={() => {
                      attachBulk.mutate(
                        { regroupementId: r.id, shipmentIds: [...selectedIds] },
                        {
                          onSuccess: () => {
                            onOpenChange(false)
                            setSelectedIds(new Set())
                          },
                        },
                      )
                    }}
                  >
                    Utiliser ce lot
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => {
              onOpenChange(false)
              handleCreateLotFromSelection()
            }}
            disabled={createRegroupement.isPending || selectedIds.size < 1}
          >
            Créer un nouveau lot plutôt
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
