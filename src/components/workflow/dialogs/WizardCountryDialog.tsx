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
import { useCreateCountry } from '@/hooks/useSettings'
import { userCan } from '@/lib/permissions'
import type { AuthUser } from '@/types'
import { refetchAndPickCountryByCode } from './wizardDialogUtils'

interface WizardCountryCreateDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  user: AuthUser | null
  onCreated: (id: string) => void
}

export function WizardCountryCreateDialog({
  open,
  onOpenChange,
  user,
  onCreated,
}: WizardCountryCreateDialogProps) {
  if (!userCan(user, 'manage_settings')) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <WizardCountryForm onOpenChange={onOpenChange} onCreated={onCreated} />
      </DialogContent>
    </Dialog>
  )
}

function WizardCountryForm({
  onOpenChange,
  onCreated,
}: {
  onOpenChange: (o: boolean) => void
  onCreated: (id: string) => void
}) {
  const qc = useQueryClient()
  const create = useCreateCountry()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  const submit = () => {
    const c = code.trim().toUpperCase()
    if (!name.trim() || c.length < 2) return
    create.mutate(
      { name: name.trim(), code: c, iso2: c.slice(0, 2) },
      {
        onSuccess: async () => {
          const id = await refetchAndPickCountryByCode(qc, c)
          if (id) onCreated(id)
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nouveau pays</DialogTitle>
        <DialogDescription>Même API que Paramètres / localisations.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 py-2">
        <div className="space-y-1.5">
          <Label>Nom *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Code ISO (2–3 car.) *</Label>
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={3} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button onClick={submit} disabled={create.isPending || !name.trim() || code.trim().length < 2}>
          {create.isPending ? '…' : 'Créer'}
        </Button>
      </DialogFooter>
    </>
  )
}
