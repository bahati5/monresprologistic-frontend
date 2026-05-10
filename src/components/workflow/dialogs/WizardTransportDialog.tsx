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
import { transportCompanyHooks } from '@/hooks/useSettings'
import { userCan } from '@/lib/permissions'
import type { AuthUser } from '@/types'
import { refetchAndPickMaxId } from './wizardDialogUtils'

interface WizardTransportCreateDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  user: AuthUser | null
  onCreated: (id: string) => void
}

export function WizardTransportCreateDialog({
  open,
  onOpenChange,
  user,
  onCreated,
}: WizardTransportCreateDialogProps) {
  if (!userCan(user, 'manage_settings')) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <WizardTransportForm onOpenChange={onOpenChange} onCreated={onCreated} />
      </DialogContent>
    </Dialog>
  )
}

function WizardTransportForm({
  onOpenChange,
  onCreated,
}: {
  onOpenChange: (o: boolean) => void
  onCreated: (id: string) => void
}) {
  const qc = useQueryClient()
  const create = transportCompanyHooks.useCreate()
  const [name, setName] = useState('')

  const submit = () => {
    if (!name.trim()) return
    create.mutate(
      { name: name.trim(), is_active: true } as Record<string, unknown>,
      {
        onSuccess: async () => {
          const id = await refetchAndPickMaxId(qc, 'transportCompanies')
          if (id) onCreated(id)
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nouvelle compagnie de transport</DialogTitle>
        <DialogDescription>POST /api/settings/transport-companies</DialogDescription>
      </DialogHeader>
      <div className="py-2">
        <Label>Nom *</Label>
        <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
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
