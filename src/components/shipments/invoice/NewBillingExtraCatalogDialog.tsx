import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

const emptyNewExtraForm = () => ({
  label: '',
  calculation_description: '',
  type: 'percentage' as 'percentage' | 'fixed',
  value: '',
})

export function NewBillingExtraCatalogDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const qc = useQueryClient()
  const [newExtraForm, setNewExtraForm] = useState(emptyNewExtraForm)

  const createCatalogExtra = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/api/finance/billing-extras', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'billing-extras-catalog'] })
      qc.invalidateQueries({ queryKey: ['settings', 'billing_extras'] })
      toast.success('Extra créé')
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message || 'Erreur'),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) setNewExtraForm(emptyNewExtraForm())
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel extra (catalogue)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Libellé</Label>
            <Input
              value={newExtraForm.label}
              onChange={(e) => setNewExtraForm((p) => ({ ...p, label: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Mode de calcul</Label>
            <Textarea
              rows={2}
              value={newExtraForm.calculation_description}
              onChange={(e) => setNewExtraForm((p) => ({ ...p, calculation_description: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select
              value={newExtraForm.type}
              onValueChange={(v) => setNewExtraForm((p) => ({ ...p, type: v as typeof p.type }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Pourcentage</SelectItem>
                <SelectItem value="fixed">Fixe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Valeur</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={newExtraForm.value}
              onChange={(e) => setNewExtraForm((p) => ({ ...p, value: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            type="button"
            disabled={createCatalogExtra.isPending || !newExtraForm.label.trim()}
            onClick={() => {
              const v = Number(newExtraForm.value) || 0
              createCatalogExtra.mutate(
                {
                  label: newExtraForm.label.trim(),
                  calculation_description: newExtraForm.calculation_description.trim() || null,
                  type: newExtraForm.type,
                  value: v,
                  is_active: true,
                } as Record<string, unknown>,
                {
                  onSuccess: () => {
                    onOpenChange(false)
                    setNewExtraForm(emptyNewExtraForm())
                  },
                },
              )
            }}
          >
            {createCatalogExtra.isPending ? 'Création…' : 'Créer dans le catalogue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
