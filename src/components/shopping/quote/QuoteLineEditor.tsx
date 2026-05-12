import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Lock, X, Plus, AlertTriangle, Edit2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useCurrencySymbol } from '@/hooks/settings/useBranding'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useActiveQuoteLineTemplates } from '@/hooks/useQuoteLineTemplates'
import { useQuoteTemplates } from '@/hooks/useQuoteTemplates'
import { useQuoteCurrencySettings } from '@/hooks/useQuoteCurrencySettings'
import {
  calculateQuote,
  loadInitialLines,
  getAvailableLines,
  templateToActiveLine,
  createOneTimeLine,
  mapServerQuoteLinesToActiveLines,
} from '@/lib/quoteLineEngine'
import type { ServerQuoteConfigurationLine } from '@/lib/assistedPurchaseQuote'
import type {
  ActiveQuoteLine,
  QuoteLineTemplate,
  OneTimeLineData,
  QuoteLineCalculationBase,
} from '@/types/assistedPurchase'

interface QuoteLineEditorProps {
  productPrice: number
  currency: string
  onTotalChange?: (total: number, totalSecondary: number | null) => void
  onLinesChange?: (lines: ActiveQuoteLine[]) => void
  readOnly?: boolean
  /** false tant que la restauration du brouillon n'est pas terminée (évite d'écraser avec les templates). */
  readyToInit?: boolean
  /** Lignes dynamiques restaurées depuis session / API — prioritaire sur loadInitialLines */
  prefillLines?: ActiveQuoteLine[] | null
  /** Lignes du dernier devis envoyé (snapshot) — utilisé si pas de prefill brouillon */
  serverConfigurationLines?: ServerQuoteConfigurationLine[] | null
}

function formatMoney(n: number, currency: string): string {
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

function OneTimeLineDialog({
  open,
  onOpenChange,
  onAdd,
  nextOrder,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (data: OneTimeLineData) => void
  nextOrder: number
}) {
  const [form, setForm] = useState<OneTimeLineData>({
    label: '',
    type: 'fixed_amount',
    value: '',
    calculation_base: null,
    is_visible_to_client: true,
  })

  const handleSubmit = () => {
    if (!form.label.trim() || !form.value) return
    onAdd(form)
    setForm({ label: '', type: 'fixed_amount', value: '', calculation_base: null, is_visible_to_client: true })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ligne ponctuelle pour ce devis uniquement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Libellé</Label>
            <Input
              value={form.label}
              onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
              placeholder="Frais de stockage hub temporaire"
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-3">
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  checked={form.type === 'fixed_amount'}
                  onChange={() => setForm((p) => ({ ...p, type: 'fixed_amount', calculation_base: null }))}
                  className="accent-[#073763]"
                />
                Montant fixe
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  checked={form.type === 'percentage'}
                  onChange={() => setForm((p) => ({ ...p, type: 'percentage', calculation_base: 'product_price' }))}
                  className="accent-[#073763]"
                />
                Pourcentage %
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{form.type === 'percentage' ? 'Pourcentage' : 'Montant'}</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={form.value}
              onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
              placeholder="0"
            />
          </div>
          {form.type === 'percentage' && (
            <div className="space-y-2">
              <Label>Base de calcul</Label>
              <Select
                value={form.calculation_base ?? 'product_price'}
                onValueChange={(v) => setForm((p) => ({ ...p, calculation_base: v as QuoteLineCalculationBase }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="product_price">Prix produit</SelectItem>
                  <SelectItem value="subtotal_after_commission">Sous-total après commission</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label>Visible par le client</Label>
            <Switch
              checked={form.is_visible_to_client}
              onCheckedChange={(v) => setForm((p) => ({ ...p, is_visible_to_client: v }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={!form.label.trim() || !form.value}>
            Ajouter au devis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ZeroReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  lineName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
  lineName: string
}) {
  const [reason, setReason] = useState('')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mettre « {lineName} » à zéro</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Cette ligne obligatoire est mise à zéro de manière exceptionnelle. Veuillez indiquer le motif.
          </p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Client VIP — remise accordée"
            rows={2}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => { onConfirm(reason); onOpenChange(false) }} disabled={!reason.trim()}>
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function QuoteLineEditor({
  productPrice,
  currency,
  onTotalChange,
  onLinesChange,
  readOnly = false,
  readyToInit = true,
  prefillLines = null,
  serverConfigurationLines = null,
}: QuoteLineEditorProps) {
  const { data: allTemplates } = useActiveQuoteLineTemplates()
  const { data: quoteTemplates } = useQuoteTemplates()
  const { data: currencySettings } = useQuoteCurrencySettings()
  const currencySymbol = useCurrencySymbol()

  const [activeLines, setActiveLines] = useState<ActiveQuoteLine[]>([])
  const initDoneRef = useRef(false)
  const activeLinesRef = useRef<ActiveQuoteLine[]>([])
  const [showAddDropdown, setShowAddDropdown] = useState(false)
  const [oneTimeOpen, setOneTimeOpen] = useState(false)
  const [zeroDialogOpen, setZeroDialogOpen] = useState(false)
  const [zeroLineId, setZeroLineId] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

  activeLinesRef.current = activeLines

  /** Sans cet effet, les lignes chargées depuis les templates ne sont jamais remontées au parent :
   * l'envoi du devis part alors sur /quote (legacy) au lieu de /quote-dynamic → e-mail incorrect. */
  useEffect(() => {
    if (!readyToInit || !allTemplates || initDoneRef.current) {
      return
    }
    initDoneRef.current = true
    const initial: ActiveQuoteLine[] =
      prefillLines && prefillLines.length > 0
        ? prefillLines
        : serverConfigurationLines && serverConfigurationLines.length > 0
          ? mapServerQuoteLinesToActiveLines(serverConfigurationLines, allTemplates)
          : loadInitialLines(allTemplates)
    activeLinesRef.current = initial
    setActiveLines(initial)
    onLinesChange?.(initial)
    const calc = calculateQuote(initial, productPrice, currencySettings ?? null)
    onTotalChange?.(calc.total_primary, calc.total_secondary)
  }, [
    readyToInit,
    allTemplates,
    prefillLines,
    serverConfigurationLines,
    productPrice,
    currencySettings,
    onLinesChange,
    onTotalChange,
  ])

  /** Recalcule le total côté parent quand le sous-total articles change sans toucher aux lignes dynamiques. */
  useEffect(() => {
    if (!initDoneRef.current || activeLinesRef.current.length === 0) {
      return
    }
    const calc = calculateQuote(activeLinesRef.current, productPrice, currencySettings ?? null)
    onTotalChange?.(calc.total_primary, calc.total_secondary)
  }, [productPrice, currencySettings, onTotalChange])

  const calculation = useMemo(() => {
    return calculateQuote(activeLines, productPrice, currencySettings ?? null)
  }, [activeLines, productPrice, currencySettings])

  const availableLines = useMemo(() => {
    return getAvailableLines(allTemplates ?? [], activeLines)
  }, [allTemplates, activeLines])

  const updateLines = useCallback(
    (newLines: ActiveQuoteLine[]) => {
      setActiveLines(newLines)
      onLinesChange?.(newLines)
      const calc = calculateQuote(newLines, productPrice, currencySettings ?? null)
      onTotalChange?.(calc.total_primary, calc.total_secondary)
    },
    [productPrice, currencySettings, onLinesChange, onTotalChange],
  )

  const handleAddLine = (template: QuoteLineTemplate) => {
    const existing = activeLines.find((l) => l.internal_code === template.internal_code)
    if (existing) return
    const newLine = templateToActiveLine(template, { display_order: activeLines.length + 1 })
    updateLines([...activeLines, newLine])
    setShowAddDropdown(false)
  }

  const handleRemoveLine = (lineId: string) => {
    updateLines(activeLines.filter((l) => l.id !== lineId))
  }

  const handleValueChange = (lineId: string, value: string) => {
    updateLines(
      activeLines.map((l) => {
        if (l.id !== lineId) return l
        const isModified = l.original_value != null && String(l.original_value) !== value
        return { ...l, value, is_modified: isModified }
      }),
    )
  }

  const handleZeroMandatory = (lineId: string) => {
    setZeroLineId(lineId)
    setZeroDialogOpen(true)
  }

  const confirmZero = (reason: string) => {
    if (!zeroLineId) return
    updateLines(
      activeLines.map((l) =>
        l.id === zeroLineId ? { ...l, value: '0', is_modified: true, zero_reason: reason } : l,
      ),
    )
    setZeroLineId(null)
  }

  const handleAddOneTimeLine = (data: OneTimeLineData) => {
    const line = createOneTimeLine(
      data.label,
      data.type,
      data.value,
      data.calculation_base,
      data.is_visible_to_client,
      activeLines.length + 1,
    )
    updateLines([...activeLines, line])
  }

  const handleApplyTemplate = () => {
    const tplId = Number(selectedTemplateId)
    const tpl = (quoteTemplates ?? []).find((t) => t.id === tplId)
    if (!tpl || !allTemplates) return

    const mandatoryLines = activeLines.filter((l) => l.is_mandatory)
    const newLines: ActiveQuoteLine[] = [...mandatoryLines]

    for (const tplLine of tpl.lines) {
      const template = allTemplates.find((t) => t.id === tplLine.quote_line_template_id)
      if (!template) continue
      if (mandatoryLines.some((m) => m.internal_code === template.internal_code)) continue
      newLines.push(
        templateToActiveLine(template, {
          display_order: newLines.length + 1,
          value: tplLine.custom_value != null ? String(tplLine.custom_value) : String(template.default_value ?? ''),
        }),
      )
    }

    updateLines(newLines)
    setSelectedTemplateId('')
  }

  const zeroLine = zeroLineId ? activeLines.find((l) => l.id === zeroLineId) : null

  return (
    <div className="space-y-4">
      <div className="glass neo-raised rounded-xl p-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">Lignes du devis</h2>

        <div className="space-y-2">
          {activeLines.map((line) => {
            const calcLine = calculation.lines.find((cl) => cl.code === line.internal_code)
            const amount = calcLine?.calculated_amount ?? 0

            return (
              <div
                key={line.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/20 transition-colors"
              >
                {line.is_mandatory ? (
                  <Lock size={14} className="text-muted-foreground shrink-0" />
                ) : (
                  <div className="w-3.5" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">{line.name}</span>
                    {line.is_modified && (
                      <Badge variant="outline" className="text-[9px] px-1">
                        <Edit2 size={8} className="mr-0.5" /> modifié
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {line.type === 'percentage' && calcLine?.base_amount != null
                      ? `${formatMoney(calcLine.base_amount, currency)} × ${line.value}%`
                      : line.type === 'fixed_amount'
                        ? 'Montant fixe'
                        : line.type === 'manual'
                          ? 'Saisie manuelle'
                          : ''}
                    {line.is_modified && line.original_value != null && (
                      <span className="ml-1 text-muted-foreground/60">
                        (défaut : {line.original_value})
                      </span>
                    )}
                  </p>
                </div>

                {!readOnly && (
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={line.value}
                    onChange={(e) => {
                      const val = e.target.value
                      if (line.is_mandatory && (val === '0' || val === '')) {
                        handleZeroMandatory(line.id)
                        return
                      }
                      handleValueChange(line.id, val)
                    }}
                    className="h-7 w-20 text-right text-sm tabular-nums"
                  />
                )}

                <span className="text-sm font-semibold tabular-nums min-w-[80px] text-right">
                  {formatMoney(amount, currency)}
                </span>

                {!readOnly && !line.is_mandatory && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-destructive/60 hover:text-destructive"
                    onClick={() => handleRemoveLine(line.id)}
                  >
                    <X size={14} />
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        {calculation.warnings.length > 0 && (
          <div className="mt-3 space-y-1">
            {calculation.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {!readOnly && (
          <div className="mt-4 space-y-3">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setShowAddDropdown(!showAddDropdown)}
                disabled={availableLines.length === 0}
              >
                <Plus size={14} />
                Ajouter une ligne
                <ChevronDown size={12} />
              </Button>
              {showAddDropdown && availableLines.length > 0 && (
                <div className="absolute z-20 mt-1 w-80 rounded-lg border bg-popover p-1 shadow-lg">
                  {availableLines.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      className="w-full flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                      onClick={() => handleAddLine(tpl)}
                    >
                      <span>{tpl.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {tpl.type === 'percentage'
                          ? `${tpl.default_value ?? 0}%`
                          : tpl.type === 'fixed_amount'
                            ? `${currencySymbol}${tpl.default_value ?? 0}`
                            : 'Manuel'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
              onClick={() => setOneTimeOpen(true)}
            >
              + Créer une ligne ponctuelle pour ce devis uniquement
            </button>

            {(quoteTemplates ?? []).length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                <Label className="text-xs whitespace-nowrap">Template</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue placeholder="Choisir un template…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(quoteTemplates ?? []).map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={handleApplyTemplate}
                  disabled={!selectedTemplateId}
                >
                  Appliquer
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="glass neo-raised rounded-xl p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Prix produits</span>
            <span className="font-semibold tabular-nums">{formatMoney(productPrice, currency)}</span>
          </div>
          {calculation.lines.map((cl) => (
            <div key={cl.code} className="flex justify-between text-xs">
              <span className="text-muted-foreground">+ {cl.name}</span>
              <span className="font-medium tabular-nums">{formatMoney(cl.calculated_amount, currency)}</span>
            </div>
          ))}
          <div className="h-px bg-border/60 my-1" />
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-lg font-bold tabular-nums text-[#073763]">
              {formatMoney(calculation.total_primary, currency)}
            </span>
          </div>
          {calculation.total_secondary != null && currencySettings && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>≈ {currencySettings.secondary_currency}</span>
              <span className="tabular-nums">
                {calculation.total_secondary.toLocaleString('fr-FR')} {currencySettings.secondary_currency}
              </span>
            </div>
          )}
        </div>
      </div>

      <OneTimeLineDialog open={oneTimeOpen} onOpenChange={setOneTimeOpen} onAdd={handleAddOneTimeLine} nextOrder={activeLines.length + 1} />
      <ZeroReasonDialog
        open={zeroDialogOpen}
        onOpenChange={setZeroDialogOpen}
        onConfirm={confirmZero}
        lineName={zeroLine?.name ?? ''}
      />
    </div>
  )
}
