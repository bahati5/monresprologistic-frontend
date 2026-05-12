import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { CrudSheet } from '../CrudSheet'
import {
  useCreateQuoteLineTemplate,
  useUpdateQuoteLineTemplate,
} from '@/hooks/useQuoteLineTemplates'
import type { QuoteLineTemplate, QuoteLineTemplateFormData, QuoteLineBehavior, QuoteLineType, QuoteLineCalculationBase, QuoteLineAppliesTo } from '@/types/assistedPurchase'
import { EMPTY_QUOTE_LINE_FORM } from '@/constants/assistedPurchase'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTemplate: QuoteLineTemplate | null
}

function toFormData(t: QuoteLineTemplate | null): QuoteLineTemplateFormData {
  if (!t) return { ...EMPTY_QUOTE_LINE_FORM }
  return {
    name: t.name,
    internal_code: t.internal_code,
    description: t.description ?? '',
    type: t.type,
    calculation_base: t.calculation_base,
    default_value: t.default_value != null ? String(t.default_value) : '',
    behavior: t.behavior ?? (t.is_mandatory ? 'mandatory' : 'optional'),
    is_visible_to_client: t.is_visible_to_client,
    is_active: t.is_active,
    applies_to: t.applies_to,
  }
}

export function QuoteLineFormSheet({ open, onOpenChange, editingTemplate }: Props) {
  const create = useCreateQuoteLineTemplate()
  const update = useUpdateQuoteLineTemplate()
  const isEdit = editingTemplate !== null

  const [form, setForm] = useState<QuoteLineTemplateFormData>(() => toFormData(editingTemplate))

  useEffect(() => {
    setForm(toFormData(editingTemplate))
  }, [editingTemplate])

  const set = <K extends keyof QuoteLineTemplateFormData>(k: K, v: QuoteLineTemplateFormData[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const handleSubmit = () => {
    if (isEdit && editingTemplate) {
      update.mutate(
        { id: editingTemplate.id, data: form },
        { onSuccess: () => onOpenChange(false) },
      )
    } else {
      create.mutate(form, { onSuccess: () => onOpenChange(false) })
    }
  }

  const showPercentageFields = form.type === 'percentage'
  const showFixedFields = form.type === 'fixed_amount'

  return (
    <CrudSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Modifier une ligne de devis' : 'Nouvelle ligne de devis'}
      onSubmit={handleSubmit}
      isLoading={create.isPending || update.isPending}
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Nom de la ligne *</Label>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Commission Monrespro"
          />
          <p className="text-[11px] text-muted-foreground">Ce nom apparaît sur le devis PDF client.</p>
        </div>

        {!isEdit && (
          <div className="space-y-2">
            <Label>Code interne *</Label>
            <Input
              value={form.internal_code}
              onChange={(e) => set('internal_code', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
              placeholder="COMMISSION"
            />
            <p className="text-[11px] text-muted-foreground">Identifiant unique, non modifiable après création.</p>
          </div>
        )}

        <div className="space-y-2">
          <Label>Description (optionnelle)</Label>
          <Textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Frais de service pour achat et gestion de commande"
            rows={2}
          />
          <p className="text-[11px] text-muted-foreground">Texte explicatif visible sous le nom sur le devis.</p>
        </div>

        <div className="space-y-2">
          <Label>Type de calcul *</Label>
          <Select value={form.type} onValueChange={(v) => set('type', v as QuoteLineType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Pourcentage (%)</SelectItem>
              <SelectItem value="fixed_amount">Montant fixe ($)</SelectItem>
              <SelectItem value="manual">Saisie manuelle à chaque devis</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showPercentageFields && (
          <>
            <div className="space-y-2">
              <Label>Valeur par défaut (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={form.default_value}
                  onChange={(e) => set('default_value', e.target.value)}
                  placeholder="10"
                  className="max-w-[120px]"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Modifiable à chaque devis.</p>
            </div>
            <div className="space-y-2">
              <Label>Base de calcul *</Label>
              <Select
                value={form.calculation_base ?? 'product_price'}
                onValueChange={(v) => set('calculation_base', v as QuoteLineCalculationBase)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="product_price">
                    Sur le prix des produits uniquement
                  </SelectItem>
                  <SelectItem value="subtotal_after_commission">
                    Sur le sous-total après commission
                  </SelectItem>
                </SelectContent>
              </Select>
              {form.calculation_base === 'product_price' && (
                <p className="text-[11px] text-muted-foreground">Ex : produits à $200 → ligne = $20</p>
              )}
              {form.calculation_base === 'subtotal_after_commission' && (
                <p className="text-[11px] text-muted-foreground">
                  Ex : produits $200 + commission $20 = $220 → % appliqué sur $220
                </p>
              )}
            </div>
          </>
        )}

        {showFixedFields && (
          <div className="space-y-2">
            <Label>Montant par défaut ($)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.default_value}
                onChange={(e) => set('default_value', e.target.value)}
                placeholder="85.00"
                className="max-w-[150px]"
              />
              <span className="text-sm text-muted-foreground">$</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Modifiable à chaque devis.</p>
          </div>
        )}

        {form.type === 'manual' && (
          <p className="text-xs text-muted-foreground border rounded-lg p-3 bg-muted/30">
            Le staff saisit le montant lors de l'édition du devis. Aucune valeur par défaut.
          </p>
        )}

        <div className="h-px bg-border" />

        <div className="space-y-2">
          <Label>Comportement sur le devis</Label>
          <Select value={form.behavior} onValueChange={(v) => set('behavior', v as QuoteLineBehavior)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mandatory">
                Obligatoire — incluse automatiquement sur tous les devis
              </SelectItem>
              <SelectItem value="optional">
                Optionnelle — le staff la sélectionne si besoin
              </SelectItem>
              <SelectItem value="optional_included">
                Optionnelle — incluse par défaut mais retirable
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Visible par le client</Label>
            <p className="text-[11px] text-muted-foreground">Apparaît sur le PDF devis client</p>
          </div>
          <Switch
            checked={form.is_visible_to_client}
            onCheckedChange={(v) => set('is_visible_to_client', v)}
          />
        </div>

        <div className="space-y-2">
          <Label>S'applique à</Label>
          <Select value={form.applies_to} onValueChange={(v) => set('applies_to', v as QuoteLineAppliesTo)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les devis</SelectItem>
              <SelectItem value="assisted_purchase">Achats assistés uniquement</SelectItem>
              <SelectItem value="shipment">Expéditions uniquement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Statut</Label>
            <p className="text-[11px] text-muted-foreground">
              Désactivée = n'apparaît plus dans la sélection
            </p>
          </div>
          <Switch
            checked={form.is_active}
            onCheckedChange={(v) => set('is_active', v)}
          />
        </div>
      </div>
    </CrudSheet>
  )
}
