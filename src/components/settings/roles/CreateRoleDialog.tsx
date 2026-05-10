import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import type { UseMutationResult } from '@tanstack/react-query'

interface CreateRoleDialogProps {
  newRoleName: string
  onNewRoleNameChange: (v: string) => void
  createRoleMut: UseMutationResult<unknown, unknown, string>
}

export function CreateRoleDialog({ newRoleName, onNewRoleNameChange, createRoleMut }: CreateRoleDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mt-2">
          <Plus className="h-4 w-4 mr-1" /> Nouveau rôle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Créer un rôle</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <Label>Nom du rôle (snake_case)</Label>
          <Input value={newRoleName} onChange={e => onNewRoleNameChange(e.target.value)} placeholder="ex: warehouse_manager" />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Annuler</Button>
          </DialogClose>
          <Button onClick={() => createRoleMut.mutate(newRoleName)} disabled={!newRoleName || createRoleMut.isPending}>
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
