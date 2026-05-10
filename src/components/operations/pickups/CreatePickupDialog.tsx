import { DraftStatusIndicator } from '@/components/drafts/DraftStatusIndicator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { displayLocalized } from '@/lib/localizedString'

interface CreatePickupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: Record<string, unknown>
  setField: (k: string, v: unknown) => void
  clientList: { id: number; name?: string | null }[]
  pickupSavedAt: string | null
  pickupSaving: boolean
  onCreate: () => void
  createPending: boolean
}

export function CreatePickupDialog({
  open,
  onOpenChange,
  form,
  setField,
  clientList,
  pickupSavedAt,
  pickupSaving,
  onCreate,
  createPending,
}: CreatePickupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Nouveau ramassage</DialogTitle>
            <DraftStatusIndicator lastSavedAt={pickupSavedAt} isSaving={pickupSaving} />
          </div>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={String(form.client_id || '')} onValueChange={v => setField('client_id', Number(v))}>
              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
              <SelectContent>{clientList.map((c) => <SelectItem key={c.id} value={String(c.id)}>{displayLocalized(c.name)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Adresse de collecte</Label>
            <Input value={String(form.address || '')} onChange={e => setField('address', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Ville</Label><Input value={String(form.city || '')} onChange={e => setField('city', e.target.value)} /></div>
            <div className="space-y-2"><Label>Date prevue</Label><Input type="date" value={String(form.scheduled_at || '')} onChange={e => setField('scheduled_at', e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Notes</Label><Textarea value={String(form.notes || '')} onChange={e => setField('notes', e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={onCreate} disabled={createPending}>{createPending ? 'Creation...' : 'Creer'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
