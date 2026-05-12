import { useState } from 'react'
import { MessageCircleQuestion, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface QuoteClarificationDialogProps {
  onSend: (payload: { message: string; channels: ('email' | 'sms')[] }) => Promise<void>
  isSending: boolean
  disabled?: boolean
}

export function QuoteClarificationDialog({
  onSend,
  isSending,
  disabled,
}: QuoteClarificationDialogProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState(
    'Nous avons bien reçu votre demande. Merci de nous préciser les informations suivantes pour préparer votre devis :\n\n- ',
  )
  const [channels, setChannels] = useState<{ email: boolean; sms: boolean }>({
    email: true,
    sms: true,
  })

  const selectedChannels: ('email' | 'sms')[] = []
  if (channels.email) selectedChannels.push('email')
  if (channels.sms) selectedChannels.push('sms')

  const canSend = message.trim().length > 10 && selectedChannels.length > 0

  const handleSend = async () => {
    if (!canSend) return
    await onSend({ message: message.trim(), channels: selectedChannels })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          <MessageCircleQuestion size={14} />
          Demander des précisions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircleQuestion size={18} className="text-amber-600" />
            Demande de clarification
          </DialogTitle>
          <DialogDescription>
            Le dossier passera en statut « En attente d'information client ». Le client sera contacté
            automatiquement. Sans réponse après 5 jours, le dossier sera archivé.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Message au client</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="text-sm resize-y min-h-[100px]"
              placeholder="Merci de nous préciser la taille / couleur / variante souhaitée..."
            />
            <p className="text-[10px] text-muted-foreground">
              Ce message sera envoyé tel quel au client par les canaux sélectionnés
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Canaux d'envoi</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={channels.email}
                  onCheckedChange={(v) => setChannels((c) => ({ ...c, email: Boolean(v) }))}
                />
                Email
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={channels.sms}
                  onCheckedChange={(v) => setChannels((c) => ({ ...c, sms: Boolean(v) }))}
                />
                SMS / WhatsApp
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-[11px] text-amber-700">
              <strong>Relance automatique :</strong> si le client ne répond pas sous 48h, une relance sera
              envoyée. Après 5 jours sans réponse, le dossier est archivé avec statut « Abandonné ».
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSend}
            disabled={!canSend || isSending}
            className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Send size={14} />
            {isSending ? 'Envoi...' : 'Envoyer la demande'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
