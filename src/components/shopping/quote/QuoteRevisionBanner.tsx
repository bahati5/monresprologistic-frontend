import { useState } from 'react'
import { History, GitBranch, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface QuoteRevision {
  version: number
  created_at: string
  reason: string | null
  total: number
  currency: string
  created_by_name: string | null
}

interface QuoteRevisionBannerProps {
  currentVersion: number
  revisions: QuoteRevision[]
  canCreateRevision: boolean
  onCreateRevision: (reason: string) => Promise<void>
  isCreating: boolean
  money: (n: number) => string
}

export function QuoteRevisionBanner({
  currentVersion,
  revisions,
  canCreateRevision,
  onCreateRevision,
  isCreating,
  money,
}: QuoteRevisionBannerProps) {
  const [showHistory, setShowHistory] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reason, setReason] = useState('')

  const handleCreate = async () => {
    await onCreateRevision(reason)
    setReason('')
    setDialogOpen(false)
  }

  if (currentVersion <= 1 && revisions.length === 0) return null

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-800 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch size={14} className="text-purple-600" />
          <span className="text-xs font-medium text-purple-700">
            Version {currentVersion} du devis
          </span>
          {currentVersion > 1 && (
            <Badge variant="outline" className="text-[10px] border-purple-300 text-purple-600">
              Révisé
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {revisions.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] text-purple-600 gap-1"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History size={12} />
              Historique
              {showHistory ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </Button>
          )}
          {canCreateRevision && currentVersion >= 3 && (
            <Badge variant="outline" className="text-[10px] border-purple-300 text-purple-600">
              Limite atteinte (max 3)
            </Badge>
          )}
          {canCreateRevision && currentVersion < 3 && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-6 text-[11px] gap-1 border-purple-300">
                  <GitBranch size={11} /> Créer v{currentVersion + 1}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle version</DialogTitle>
                  <DialogDescription>
                    La version actuelle ({currentVersion}) sera archivée. Vous pourrez modifier les montants
                    de la nouvelle version avant de l'envoyer au client.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Raison de la révision</Label>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Prix mis à jour suite à changement fournisseur..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={isCreating || !reason.trim()}
                    className="bg-[#073763] hover:bg-[#0b5394]"
                  >
                    {isCreating ? 'Création...' : `Créer v${currentVersion + 1}`}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {showHistory && (
        <div className="border-t border-purple-200 pt-2 mt-2 space-y-1.5">
          {revisions.map((rev) => (
            <div
              key={rev.version}
              className={`flex items-center justify-between text-xs p-1.5 rounded-md ${
                rev.version === currentVersion
                  ? 'bg-purple-100 dark:bg-purple-900/30'
                  : 'hover:bg-purple-100/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-purple-300 px-1.5">
                  v{rev.version}
                </Badge>
                <span className="text-muted-foreground">
                  {new Date(rev.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {rev.created_by_name && (
                  <span className="text-muted-foreground">par {rev.created_by_name}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {rev.reason && (
                  <span className="text-muted-foreground truncate max-w-[150px]">{rev.reason}</span>
                )}
                <span className="font-medium tabular-nums">{money(rev.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
