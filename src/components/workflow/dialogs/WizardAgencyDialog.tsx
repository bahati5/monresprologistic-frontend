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
import { agencyHooks } from '@/hooks/useSettings'
import { suggestAgencyCodeFromName } from '@/lib/agencyCodeSuggest'
import { userCan } from '@/lib/permissions'
import type { AuthUser } from '@/types'
import { refetchAndPickMaxId } from './wizardDialogUtils'

interface WizardAgencyCreateDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  user: AuthUser | null
  onCreated: (id: string) => void
}

export function WizardAgencyCreateDialog({
  open,
  onOpenChange,
  user,
  onCreated,
}: WizardAgencyCreateDialogProps) {
  if (!userCan(user, 'manage_agencies')) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <WizardAgencyForm onOpenChange={onOpenChange} onCreated={onCreated} />
      </DialogContent>
    </Dialog>
  )
}

function WizardAgencyForm({
  onOpenChange,
  onCreated,
}: {
  onOpenChange: (o: boolean) => void
  onCreated: (id: string) => void
}) {
  const qc = useQueryClient()
  const create = agencyHooks.useCreate()
  const [name, setName] = useState('')

  const submit = () => {
    if (!name.trim()) return
    const code = suggestAgencyCodeFromName(name.trim()) || 'HUB'
    create.mutate(
      {
        name: name.trim(),
        code,
      } as Record<string, unknown>,
      {
        onSuccess: async () => {
          const id = await refetchAndPickMaxId(qc, 'agencies')
          if (id) onCreated(id)
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nouvelle agence</DialogTitle>
        <DialogDescription>POST /api/settings/agencies</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 py-2">
        <p className="text-xs text-muted-foreground">
          Code attribué automatiquement ; la devise est celle des paramètres généraux.
        </p>
        <div className="space-y-1.5">
          <Label>Nom *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
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
