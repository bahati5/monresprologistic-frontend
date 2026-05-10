import { Loader2 } from 'lucide-react'
import type { PublicBranding } from '@/types/settings'
import api from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resolveMoneySymbol } from '@/lib/formatCurrency'
import { toast } from 'sonner'

interface CheckoutCompanyCoverageCardProps {
  shipmentId: number | undefined
  companyCoverageDraft: string
  setCompanyCoverageDraft: (v: string) => void
  savingCoverage: boolean
  setSavingCoverage: (v: boolean) => void
  branding: PublicBranding | undefined
  onInvoiceOptionsSaved?: () => void
}

export function CheckoutCompanyCoverageCard({
  shipmentId,
  companyCoverageDraft,
  setCompanyCoverageDraft,
  savingCoverage,
  setSavingCoverage,
  branding,
  onInvoiceOptionsSaved,
}: CheckoutCompanyCoverageCardProps) {
  const saveCompanyCoverage = async (resetToDefault: boolean) => {
    if (!shipmentId) {
      toast.error('Expédition introuvable')
      return
    }
    setSavingCoverage(true)
    try {
      const payload =
        resetToDefault
          ? { company_coverage_amount: null }
          : (() => {
              const t = companyCoverageDraft.trim()
              if (t === '') return { company_coverage_amount: null }
              const n = Number(t)
              if (Number.isNaN(n) || n < 0) {
                throw new Error('Montant de prise en charge invalide')
              }
              return { company_coverage_amount: n }
            })()
      await api.patch(`/api/shipments/${shipmentId}/invoice-options`, payload)
      toast.success(resetToDefault ? 'Prise en charge : défaut des paramètres' : 'Prise en charge enregistrée pour la facture')
      onInvoiceOptionsSaved?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’enregistrement'
      toast.error(msg)
    } finally {
      setSavingCoverage(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Prise en charge entreprise (facture PDF)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Montant indicatif affiché sur la facture à côté de la valeur déclarée par le client. Laisser vide pour
          utiliser le défaut défini dans Paramètres → Général → Factures expéditions.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5 min-w-[200px]">
            <Label htmlFor="checkout-company-coverage">
              Montant (
              {resolveMoneySymbol(
                branding ?? { currency: 'EUR', currency_symbol: '' },
              )}
              )
            </Label>
            <Input
              id="checkout-company-coverage"
              type="number"
              min={0}
              step="0.01"
              placeholder="Défaut paramètres"
              value={companyCoverageDraft}
              onChange={(e) => setCompanyCoverageDraft(e.target.value)}
              disabled={!shipmentId || savingCoverage}
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!shipmentId || savingCoverage}
            onClick={() => void saveCompanyCoverage(false)}
          >
            {savingCoverage ? <Loader2 size={14} className="animate-spin" /> : null}
            Enregistrer
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!shipmentId || savingCoverage}
            onClick={() => {
              setCompanyCoverageDraft('')
              void saveCompanyCoverage(true)
            }}
          >
            Réinitialiser
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
