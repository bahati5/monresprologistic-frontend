import { useState } from 'react'
import { AlertTriangle, Ban, RefreshCw, Replace, Timer } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Resolution = 'wait_restock' | 'propose_alternative' | 'partial_refund' | 'full_refund'

interface ArticleOption {
  id: number
  label: string
}

interface ItemUnavailableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  articles: ArticleOption[]
  isPending: boolean
  onSubmit: (data: {
    item_id: number
    resolution: Resolution
    restock_date?: string | null
    alternative_description?: string | null
    staff_note?: string | null
  }) => void | Promise<void>
}

export function ItemUnavailableDialog({
  open,
  onOpenChange,
  articles,
  isPending,
  onSubmit,
}: ItemUnavailableDialogProps) {
  const [selectedItem, setSelectedItem] = useState<number>(articles[0]?.id ?? 0)
  const [resolution, setResolution] = useState<Resolution>('wait_restock')
  const [restockDate, setRestockDate] = useState('')
  const [alternativeDesc, setAlternativeDesc] = useState('')
  const [staffNote, setStaffNote] = useState('')

  const handleSubmit = () => {
    void onSubmit({
      item_id: selectedItem,
      resolution,
      restock_date: resolution === 'wait_restock' && restockDate ? restockDate : null,
      alternative_description:
        resolution === 'propose_alternative' && alternativeDesc.trim()
          ? alternativeDesc.trim()
          : null,
      staff_note: staffNote.trim() || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Signaler un article indisponible
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {articles.length > 1 && (
            <div className="space-y-1.5">
              <Label>Article concerné</Label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={selectedItem}
                onChange={(e) => setSelectedItem(Number(e.target.value))}
                disabled={isPending}
              >
                {articles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2" role="radiogroup" aria-label="Résolution proposée au client">
            <Label>Résolution proposée au client</Label>
            <div className="space-y-2">
              {(
                [
                  {
                    value: 'wait_restock' as const,
                    id: 'r-wait',
                    icon: <Timer size={14} className="text-blue-500" />,
                    title: 'Attendre le réapprovisionnement',
                    desc: 'Le client attend que le produit revienne en stock.',
                  },
                  {
                    value: 'propose_alternative' as const,
                    id: 'r-alt',
                    icon: <Replace size={14} className="text-purple-500" />,
                    title: 'Proposer une alternative',
                    desc: 'Un produit similaire est disponible.',
                  },
                  {
                    value: 'partial_refund' as const,
                    id: 'r-partial',
                    icon: <RefreshCw size={14} className="text-orange-500" />,
                    title: 'Remboursement partiel',
                    desc: "Retirer cet article et rembourser le montant correspondant.",
                  },
                  {
                    value: 'full_refund' as const,
                    id: 'r-full',
                    icon: <Ban size={14} className="text-red-500" />,
                    title: 'Remboursement intégral',
                    desc: 'Annuler la commande et rembourser intégralement.',
                  },
                ] as const
              ).map((opt) => (
                <div
                  key={opt.value}
                  className="flex items-start gap-2 rounded-md border p-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                >
                  <input
                    type="radio"
                    id={opt.id}
                    name="resolution-unavail"
                    value={opt.value}
                    checked={resolution === opt.value}
                    onChange={() => setResolution(opt.value)}
                    disabled={isPending}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#073763]"
                  />
                  <div className="flex-1 min-w-0">
                    <label htmlFor={opt.id} className="flex items-center gap-1.5 font-medium cursor-pointer">
                      {opt.icon}
                      {opt.title}
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {resolution === 'wait_restock' && (
            <div className="space-y-1.5">
              <Label htmlFor="restock-date">Date estimée de réapprovisionnement</Label>
              <Input
                id="restock-date"
                type="date"
                value={restockDate}
                onChange={(e) => setRestockDate(e.target.value)}
                disabled={isPending}
              />
            </div>
          )}

          {resolution === 'propose_alternative' && (
            <div className="space-y-1.5">
              <Label htmlFor="alt-desc">Description de l'alternative</Label>
              <Textarea
                id="alt-desc"
                rows={2}
                className="text-sm resize-y min-h-[52px]"
                value={alternativeDesc}
                onChange={(e) => setAlternativeDesc(e.target.value)}
                placeholder="Ex. Même modèle en couleur noire disponible..."
                disabled={isPending}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="staff-note-unavail">Note interne (optionnel)</Label>
            <Textarea
              id="staff-note-unavail"
              rows={2}
              className="text-sm resize-y min-h-[52px]"
              value={staffNote}
              onChange={(e) => setStaffNote(e.target.value)}
              placeholder="Contexte supplémentaire..."
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button
            type="button"
            className="bg-amber-600 hover:bg-amber-700 text-white"
            disabled={isPending || !selectedItem}
            onClick={handleSubmit}
          >
            {isPending ? 'Envoi...' : 'Signaler et notifier le client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface PriceChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  articles: ArticleOption[]
  isPending: boolean
  onSubmit: (data: {
    reason: string
    items: { id: number; new_price: number }[]
  }) => void | Promise<void>
}

export function PriceChangeDialog({
  open,
  onOpenChange,
  articles,
  isPending,
  onSubmit,
}: PriceChangeDialogProps) {
  const [reason, setReason] = useState('')
  const [itemPrices, setItemPrices] = useState<Record<number, string>>({})

  const handleSubmit = () => {
    if (reason.trim().length < 10) return

    const items = Object.entries(itemPrices)
      .filter(([, v]) => v.trim() !== '')
      .map(([id, price]) => ({
        id: Number(id),
        new_price: parseFloat(price.replace(',', '.')) || 0,
      }))
      .filter((i) => i.new_price > 0)

    if (items.length === 0) return

    void onSubmit({ reason: reason.trim(), items })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-500" />
            Changement de prix fournisseur
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground text-xs">
            Le prix a changé chez le fournisseur après l'acceptation du devis.
            Un nouveau devis sera généré et le client devra re-accepter.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="price-reason">Justification du changement *</Label>
            <Textarea
              id="price-reason"
              rows={2}
              className="text-sm resize-y min-h-[52px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex. Le prix Amazon a augmenté de 15% suite à une rupture de stock temporaire..."
              disabled={isPending}
            />
            {reason.trim().length > 0 && reason.trim().length < 10 && (
              <p className="text-xs text-destructive">Minimum 10 caractères requis.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Nouveaux prix par article</Label>
            <div className="space-y-2">
              {articles.map((article) => (
                <div key={article.id} className="flex items-center gap-2">
                  <span className="flex-1 text-xs truncate">{article.label}</span>
                  <Input
                    className="w-28 text-right"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={itemPrices[article.id] ?? ''}
                    onChange={(e) =>
                      setItemPrices((prev) => ({ ...prev, [article.id]: e.target.value }))
                    }
                    disabled={isPending}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={
              isPending ||
              reason.trim().length < 10 ||
              Object.values(itemPrices).filter((v) => v.trim() !== '').length === 0
            }
            onClick={handleSubmit}
          >
            {isPending ? 'Envoi...' : 'Créer la révision de prix'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
