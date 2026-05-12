import { Check, X, Info } from 'lucide-react'
import type { PurchaseArticle, ActiveQuoteLine } from '@/types/assistedPurchase'

export interface QuoteSendValidationResult {
  canSend: boolean
  allUnavailable: boolean
  errors: string[]
  warnings: string[]
}

export function validateQuoteSend({
  articles,
  activeLines,
  subtotal,
}: {
  articles: PurchaseArticle[]
  activeLines: ActiveQuoteLine[]
  subtotal: number
}): QuoteSendValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const uncheckedArticles = articles.filter((a) => a.availability.status === 'not_checked')
  if (uncheckedArticles.length > 0) {
    errors.push(
      `${uncheckedArticles.length} article${uncheckedArticles.length > 1 ? 's' : ''} non vérifié${uncheckedArticles.length > 1 ? 's' : ''}`,
    )
  }

  const alternativeWithoutNote = articles.filter(
    (a) => a.availability.status === 'available_alternative' && !a.availability.alternative_note.trim(),
  )
  if (alternativeWithoutNote.length > 0) {
    errors.push(
      `${alternativeWithoutNote.length} article${alternativeWithoutNote.length > 1 ? 's' : ''} en alternative sans note explicative`,
    )
  }

  const allUnavailable = articles.length > 0 && articles.every((a) => a.availability.status === 'unavailable')

  if (subtotal <= 0 && !allUnavailable) {
    errors.push('Aucun prix unitaire saisi')
  }

  const pendingScrape = articles.filter((a) => a.scrape_status === 'pending')
  if (pendingScrape.length > 0) {
    warnings.push(
      `${pendingScrape.length} extraction${pendingScrape.length > 1 ? 's' : ''} en cours`,
    )
  }

  const zeroValueLines = activeLines.filter(
    (l) => l.is_mandatory && parseFloat(l.value) === 0 && !l.zero_reason,
  )
  if (zeroValueLines.length > 0) {
    warnings.push(
      `${zeroValueLines.length} ligne${zeroValueLines.length > 1 ? 's' : ''} obligatoire${zeroValueLines.length > 1 ? 's' : ''} à zéro`,
    )
  }

  const failedScrape = articles.filter((a) => a.scrape_status === 'failed')
  if (failedScrape.length > 0) {
    warnings.push(
      `${failedScrape.length} extraction${failedScrape.length > 1 ? 's' : ''} échouée${failedScrape.length > 1 ? 's' : ''} — vérifiez manuellement`,
    )
  }

  return {
    canSend: errors.length === 0,
    allUnavailable,
    errors,
    warnings,
  }
}

interface QuoteSendValidationDisplayProps {
  validation: QuoteSendValidationResult
}

export function QuoteSendValidationDisplay({ validation }: QuoteSendValidationDisplayProps) {
  if (validation.errors.length === 0 && validation.warnings.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600">
        <Check size={12} />
        <span>Prêt à envoyer</span>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {validation.errors.map((err, i) => (
        <div key={`e-${i}`} className="flex items-center gap-1.5 text-xs text-destructive">
          <X size={11} className="shrink-0" />
          <span>{err}</span>
        </div>
      ))}
      {validation.warnings.map((warn, i) => (
        <div key={`w-${i}`} className="flex items-center gap-1.5 text-xs text-amber-600">
          <Info size={11} className="shrink-0" />
          <span>{warn}</span>
        </div>
      ))}
    </div>
  )
}
