import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { packagingTypeHooks } from '@/hooks/useSettings'
import { userCan } from '@/lib/permissions'
import type { AuthUser } from '@/types'
import { refetchAndPickMaxId } from './wizardDialogUtils'

interface WizardPackagingCreateDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  user: AuthUser | null
  onCreated: (id: string) => void
}

export function WizardPackagingCreateDialog({
  open,
  onOpenChange,
  user,
  onCreated,
}: WizardPackagingCreateDialogProps) {
  if (!userCan(user, 'manage_settings')) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <WizardPackagingForm onOpenChange={onOpenChange} onCreated={onCreated} />
      </DialogContent>
    </Dialog>
  )
}

function WizardPackagingForm({
  onOpenChange,
  onCreated,
}: {
  onOpenChange: (o: boolean) => void
  onCreated: (id: string) => void
}) {
  const qc = useQueryClient()
  const create = packagingTypeHooks.useCreate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [billable, setBillable] = useState(false)
  const [unitPrice, setUnitPrice] = useState('0')

  const submit = () => {
    if (!name.trim()) return
    create.mutate(
      {
        name: name.trim(),
        description: description.trim() || null,
        is_active: true,
        is_billable: billable,
        unit_price: billable ? Number(unitPrice) || 0 : 0,
      } as Record<string, unknown>,
      {
        onSuccess: async () => {
          const id = await refetchAndPickMaxId(qc, 'packagingTypes')
          if (id) onCreated(id)
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nouvel emballage</DialogTitle>
        <DialogDescription>POST /api/settings/packaging-types</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 py-2">
        <div className="space-y-1.5">
          <Label>Nom *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="wb" checked={billable} onCheckedChange={setBillable} />
          <Label htmlFor="wb">Facturable</Label>
        </div>
        {billable && (
          <div className="space-y-1.5">
            <Label>Prix unitaire</Label>
            <Input type="number" min={0} step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button onClick={submit} disabled={create.isPending || !name.trim()}>
          {create.isPending ? '…' : 'Créer'}
        </Button>
      </DialogFooter>
    </>
  )
}
