import type { RefObject } from 'react'
import { CheckCircle2, CreditCard, Download, FileText, ImageIcon, Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
    <div className="glass neo-raised rounded-xl p-4 space-y-4 border border-[#073763]/10">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-[#073763]/5 rounded-lg">
          <CreditCard size={14} className="text-[#073763]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Étape suivante : paiement</h2>
          <p className="text-[11px] text-muted-foreground">
            Après avoir effectué le paiement, prévenez notre équipe ici.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pay-ack-msg" className="text-xs font-medium">
          Message optionnel (référence, montant…)
        </Label>
        <Textarea
          id="pay-ack-msg"
          rows={2}
          value={ackMessage}
          onChange={(e) => setAckMessage(e.target.value)}
          placeholder="Ex. MPESA ref. ABC123, payé le…"
          disabled={isPending}
          className="min-h-[56px] text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pay-proof-file" className="text-xs font-medium">
          Preuve de paiement
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={12} />
            {proofFile ? 'Changer' : 'Joindre'}
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
          {proofFile && (
            <div className="flex items-center gap-1.5 neo-inset rounded-md px-2 py-1 text-xs">
              {proofFile.type.startsWith('image/') ? (
                <ImageIcon size={12} className="text-muted-foreground" />
              ) : (
                <FileText size={12} className="text-muted-foreground" />
              )}
              <span className="max-w-[150px] truncate">{proofFile.name}</span>
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => {
                  setProofFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              >
                <X size={11} />
              </button>
            </div>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">JPG, PNG, WebP, PDF — max 5 Mo</p>
      </div>

      {existingProofUrl && (
        <div className="flex items-center gap-2 neo-inset rounded-lg px-3 py-2">
          <CheckCircle2 size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs text-foreground">Preuve déjà téléversée</span>
          <a
            href={existingProofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-xs font-medium text-[#073763] hover:underline"
          >
            <Download size={11} />
            Voir
          </a>
        </div>
      )}

      <Button
        type="button"
        size="sm"
        className="w-full sm:w-auto bg-[#073763] hover:bg-[#0b5394] text-white gap-1.5"
        disabled={isPending}
        onClick={() => void onSubmit()}
      >
        {isPending ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            Envoi…
          </>
        ) : (
          "J'ai payé — prévenir l'équipe"
        )}
      </Button>
    </div>
  )
}
