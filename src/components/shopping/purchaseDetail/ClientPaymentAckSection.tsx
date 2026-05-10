import type { RefObject } from 'react'
import { CheckCircle2, Download, FileText, ImageIcon, Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ClientPaymentAckSectionProps {
  ackMessage: string
  setAckMessage: (v: string) => void
  proofFile: File | null
  setProofFile: (f: File | null) => void
  fileInputRef: RefObject<HTMLInputElement | null>
  existingProofUrl: string | null
  isPending: boolean
  onSubmit: () => void
}

export function ClientPaymentAckSection({
  ackMessage,
  setAckMessage,
  proofFile,
  setProofFile,
  fileInputRef,
  existingProofUrl,
  isPending,
  onSubmit,
}: ClientPaymentAckSectionProps) {
  return (
    <Card className="border-primary/25 bg-gradient-to-br from-card to-primary/[0.06] shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Étape suivante : paiement</CardTitle>
        <CardDescription>
          Après avoir effectué le virement ou le paiement mobile selon les indications ci-dessus, vous pouvez nous
          prévenir ici. Notre équipe vérifiera la réception puis validera votre dossier.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pay-ack-msg">Message optionnel (référence de transaction, montant, etc.)</Label>
          <Textarea
            id="pay-ack-msg"
            rows={3}
            value={ackMessage}
            onChange={(e) => setAckMessage(e.target.value)}
            placeholder="Ex. MPESA ref. ABC123, payé le…"
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pay-proof-file">Preuve de paiement (capture d'écran ou PDF)</Label>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" aria-hidden />
              {proofFile ? 'Changer le fichier' : 'Joindre un fichier'}
            </Button>
            <input
              ref={fileInputRef}
              id="pay-proof-file"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null
                if (f && f.size > 5 * 1024 * 1024) {
                  toast.error('Le fichier ne doit pas dépasser 5 Mo.')
                  e.target.value = ''
                  return
                }
                setProofFile(f)
              }}
            />
            {proofFile ? (
              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-1.5 text-sm">
                {proofFile.type.startsWith('image/') ? (
                  <ImageIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                )}
                <span className="max-w-[200px] truncate">{proofFile.name}</span>
                <button
                  type="button"
                  className="ml-1 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    setProofFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">Formats acceptés : JPG, PNG, WebP, PDF — max 5 Mo</p>
        </div>

        {existingProofUrl ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200/60 bg-emerald-50/50 px-4 py-2.5 dark:border-emerald-500/20 dark:bg-emerald-950/20">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <span className="text-sm text-emerald-800 dark:text-emerald-200">Preuve déjà téléversée</span>
            <a
              href={existingProofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              Télécharger
            </a>
          </div>
        ) : null}

        <Button
          type="button"
          size="lg"
          className="w-full sm:w-auto"
          disabled={isPending}
          onClick={() => void onSubmit()}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Envoi…
            </>
          ) : (
            'J’ai effectué le paiement — prévenir l’équipe'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
