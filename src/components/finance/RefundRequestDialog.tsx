import type { UseMutationResult } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DraftStatusIndicator } from '@/components/drafts/DraftStatusIndicator'

type DossierOption = { key: string; label: string }

type RefundRequestDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  lastSavedAt: string | null
  isSaving: boolean
  dossierKey: string
  setDossierKey: (v: string) => void
  dossiersLoading: boolean
  dossierOptions: DossierOption[]
  newAmount: string
  setNewAmount: (v: string) => void
  newCurrency: string
  setNewCurrency: (v: string) => void
  newReason: string
  setNewReason: (v: string) => void
  setNewProof: (f: File | null) => void
  createMutation: UseMutationResult<unknown, unknown, void, unknown>
}

export function RefundRequestDialog({
  open,
  onOpenChange,
  lastSavedAt,
  isSaving,
  dossierKey,
  setDossierKey,
  dossiersLoading,
  dossierOptions,
  newAmount,
  setNewAmount,
  newCurrency,
  setNewCurrency,
  newReason,
  setNewReason,
  setNewProof,
  createMutation,
}: RefundRequestDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button">
          <Plus className="mr-2 h-4 w-4" aria-hidden />
          Nouvelle demande
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Demander un remboursement</DialogTitle>
            <DraftStatusIndicator lastSavedAt={lastSavedAt} isSaving={isSaving} />
          </div>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="space-y-2">
            <Label htmlFor="refund-dossier">Dossier concerné</Label>
            <Select value={dossierKey} onValueChange={setDossierKey} disabled={dossiersLoading}>
              <SelectTrigger id="refund-dossier">
                <SelectValue placeholder={dossiersLoading ? 'Chargement…' : 'Choisir…'} />
              </SelectTrigger>
              <SelectContent>
                {dossierOptions.map((o) => (
                  <SelectItem key={o.key} value={o.key}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!dossiersLoading && dossierOptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucun dossier éligible pour le moment.</p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Montant</Label>
              <Input
                id="refund-amount"
                inputMode="decimal"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-currency">Devise</Label>
              <Select value={newCurrency} onValueChange={setNewCurrency}>
                <SelectTrigger id="refund-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="CDF">CDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="refund-reason">Motif</Label>
            <Textarea
              id="refund-reason"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              rows={4}
              placeholder="Décrivez la situation…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="refund-proof">Justificatif (PDF ou image, optionnel)</Label>
            <Input
              id="refund-proof"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,image/*,application/pdf"
              onChange={(e) => setNewProof(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button
            type="button"
            className="w-full"
            disabled={
              createMutation.isPending ||
              !dossierKey ||
              !newAmount.trim() ||
              !newReason.trim() ||
              dossierOptions.length === 0
            }
            onClick={() => createMutation.mutate()}
          >
            Envoyer la demande
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
