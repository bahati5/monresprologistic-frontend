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
import { shippingModeHooks } from '@/hooks/useSettings'
import { userCan } from '@/lib/permissions'
import { toast } from 'sonner'
import type { AuthUser } from '@/types'
import { CREATE_OPTIONS_KEY, deliveryOptionsForMode } from './wizardDialogUtils'

interface WizardDeliveryTimeCreateDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  user: AuthUser | null
  shippingModeId: string
  selectedMode: Record<string, unknown> | undefined
  initialLabel?: string
  onCreated: (label: string) => void
}

export function WizardDeliveryTimeCreateDialog({
  open,
  onOpenChange,
  user,
  shippingModeId,
  selectedMode,
  initialLabel,
  onCreated,
}: WizardDeliveryTimeCreateDialogProps) {
  if (!userCan(user, 'manage_settings')) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!z-[200] sm:max-w-md">
        <WizardDeliveryTimeForm
          onOpenChange={onOpenChange}
          shippingModeId={shippingModeId}
          selectedMode={selectedMode}
          initialLabel={initialLabel}
          onCreated={onCreated}
        />
      </DialogContent>
    </Dialog>
  )
}

function WizardDeliveryTimeForm({
  onOpenChange,
  shippingModeId,
  selectedMode,
  initialLabel,
  onCreated,
}: {
  onOpenChange: (o: boolean) => void
  shippingModeId: string
  selectedMode: Record<string, unknown> | undefined
  initialLabel?: string
  onCreated: (label: string) => void
}) {
  const qc = useQueryClient()
  const updateMode = shippingModeHooks.useUpdate()
  const [label, setLabel] = useState(initialLabel?.trim() ?? '')

  const submit = () => {
    const mid = Number(shippingModeId)
    if (!mid) {
      toast.error(
        "Choisissez d'abord un mode d'expédition (étape Logistique ou tarif de ligne).",
      )
      return
    }
    if (!label.trim()) return
    if (!selectedMode) {
      toast.error(
        'Mode introuvable. Rechargez la page ou resélectionnez un mode / tarif.',
      )
      return
    }

    const existing = deliveryOptionsForMode(selectedMode)
    const next = [...existing, label.trim()]
    const desc = selectedMode.description
    const vd = selectedMode.volumetric_divisor ?? selectedMode.volumetricDivisor
    const vol =
      vd != null && vd !== ''
        ? (() => {
            const n = parseInt(String(vd), 10)
            return Number.isFinite(n) && n >= 1 ? n : null
          })()
        : null
    const dpt = String(selectedMode.default_pricing_type ?? selectedMode.defaultPricingType ?? '').trim()
    const default_pricing_type =
      dpt === 'per_kg' || dpt === 'per_volume' || dpt === 'flat' ? dpt : null

    const payload = {
      name: String(selectedMode.name ?? ''),
      description: desc == null || desc === '' ? null : String(desc),
      is_active: selectedMode.is_active !== false,
      sort_order: Number(selectedMode.sort_order) || 0,
      volumetric_divisor: vol,
      default_pricing_type,
      delivery_options: next,
    }

    updateMode.mutate(
      { id: mid, data: payload as Record<string, unknown> },
      {
        onSuccess: async () => {
          await qc.refetchQueries({ queryKey: [...CREATE_OPTIONS_KEY] })
          await qc.invalidateQueries({ queryKey: ['settings', 'shipping_modes'] })
          onCreated(label.trim())
          onOpenChange(false)
        },
      },
    )
  }

  const pending = updateMode.isPending

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nouveau libellé de délai</DialogTitle>
        <DialogDescription>
          Ajouté à la liste des délais du mode (comme dans Paramètres → Transport).
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 py-2">
        <div className="space-y-1.5">
          <Label>Libellé *</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ex. 3–5 jours ouvrés" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button onClick={submit} disabled={pending || !label.trim() || !shippingModeId}>
          {pending ? '…' : 'Ajouter'}
        </Button>
      </DialogFooter>
    </>
  )
}
