import { useState } from 'react'
import { Plus, Pencil, Trash2, Users, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { useCurrencySymbol } from '@/hooks/settings/useBranding'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { SettingsCard } from '../SettingsCard'
import { CrudSheet } from '../CrudSheet'
import { useQuoteTemplates, useCreateQuoteTemplate, useUpdateQuoteTemplate, useDeleteQuoteTemplate } from '@/hooks/useQuoteTemplates'
import { useQuoteLineTemplates } from '@/hooks/useQuoteLineTemplates'
import type { QuoteTemplate, QuoteTemplateFormData } from '@/types/assistedPurchase'

function emptyForm(lineTemplates: { id: number }[]): QuoteTemplateFormData {
  return {
    name: '',
    description: '',
    is_shared: true,
    lines: lineTemplates.map((lt) => ({
      quote_line_template_id: lt.id,
      included: false,
      custom_value: '',
    })),
  }
}

function toForm(t: QuoteTemplate, lineTemplates: { id: number }[]): QuoteTemplateFormData {
  const includedIds = new Set(t.lines.map((l) => l.quote_line_template_id))
  return {
    name: t.name,
    description: t.description ?? '',
    is_shared: t.is_shared,
    lines: lineTemplates.map((lt) => {
      const existing = t.lines.find((l) => l.quote_line_template_id === lt.id)
      return {
        quote_line_template_id: lt.id,
        included: includedIds.has(lt.id),
        custom_value: existing?.custom_value != null ? String(existing.custom_value) : '',
      }
    }),
  }
}

export function QuoteTemplatesSection() {
  const { data: templates, isLoading } = useQuoteTemplates()
  const { data: lineTemplates } = useQuoteLineTemplates()
  const currencySymbol = useCurrencySymbol()
  const createMut = useCreateQuoteTemplate()
  const updateMut = useUpdateQuoteTemplate()
  const deleteMut = useDeleteQuoteTemplate()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<QuoteTemplate | null>(null)
  const [form, setForm] = useState<QuoteTemplateFormData>(() => emptyForm(lineTemplates ?? []))

  const activeLTs = (lineTemplates ?? []).filter((lt) => lt.is_active).sort((a, b) => a.display_order - b.display_order)

  const handleCreate = () => {
    setEditing(null)
    setForm(emptyForm(activeLTs))
    setSheetOpen(true)
  }

  const handleEdit = (t: QuoteTemplate) => {
    setEditing(t)
    setForm(toForm(t, activeLTs))
    setSheetOpen(true)
  }

  const handleSubmit = () => {
    const payload: QuoteTemplateFormData = {
      ...form,
      lines: form.lines.filter((l) => l.included),
    }
    if (editing) {
      updateMut.mutate(
        { id: editing.id, data: payload },
        { onSuccess: () => setSheetOpen(false) },
      )
    } else {
      createMut.mutate(payload, { onSuccess: () => setSheetOpen(false) })
    }
  }

  const toggleLine = (ltId: number, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((l) =>
        l.quote_line_template_id === ltId ? { ...l, included: checked } : l,
      ),
    }))
  }

  const setLineValue = (ltId: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((l) =>
        l.quote_line_template_id === ltId ? { ...l, custom_value: value } : l,
      ),
    }))
  }

  return (
    <>
      <SettingsCard
        title="Templates de devis"
        icon={Plus}
        badge={`${(templates ?? []).length}`}
        isLoading={isLoading}
        actions={
          <Button size="sm" onClick={handleCreate} className="gap-1.5">
            <Plus size={14} />
            Nouveau template
          </Button>
        }
      >
        <p className="text-xs text-muted-foreground mb-4">
          Combinaisons prédéfinies de lignes pour ne pas reconstruire la même sélection à chaque devis.
        </p>

        <div className="space-y-2">
          {(templates ?? []).map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t.name}</span>
                  {t.is_shared && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Users size={10} /> Partagé
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t.lines.map((l) => l.template_name ?? `Ligne #${l.quote_line_template_id}`).join(' · ')}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Utilisé {t.usage_count} fois
                  {t.created_by_name ? ` · Créé par ${t.created_by_name}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(t)}>
                  <Pencil size={14} />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 size={14} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer ce template ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Les anciens devis qui utilisaient ce template ne seront pas affectés.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMut.mutate(t.id)}>
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {(!templates || templates.length === 0) && !isLoading && (
            <p className="text-center text-muted-foreground py-6 text-sm">
              Aucun template de devis. Créez votre premier template.
            </p>
          )}
        </div>
      </SettingsCard>

      <CrudSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? 'Modifier le template' : 'Nouveau template de devis'}
        onSubmit={handleSubmit}
        isLoading={createMut.isPending || updateMut.isPending}
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Nom du template *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Avec livraison domicile"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Pour les clients qui veulent la livraison"
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <Label>Lignes incluses</Label>
            <p className="text-[11px] text-muted-foreground">
              Cochez pour inclure, ajustez la valeur si besoin.
            </p>

            {activeLTs.map((lt) => {
              const formLine = form.lines.find((l) => l.quote_line_template_id === lt.id)
              const isIncluded = formLine?.included ?? false
              const customVal = formLine?.custom_value ?? ''

              return (
                <div key={lt.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                  <Checkbox
                    checked={isIncluded}
                    onCheckedChange={(v) => toggleLine(lt.id, !!v)}
                    disabled={lt.is_mandatory}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{lt.name}</span>
                      {lt.is_mandatory && <Lock size={11} className="text-muted-foreground" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {lt.type === 'percentage'
                        ? `${lt.default_value ?? 0}%`
                        : lt.type === 'fixed_amount'
                          ? `${currencySymbol}${lt.default_value ?? 0}`
                          : 'Manuel'}
                    </p>
                  </div>
                  {isIncluded && lt.type !== 'manual' && (
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={customVal}
                      onChange={(e) => setLineValue(lt.id, e.target.value)}
                      placeholder={String(lt.default_value ?? '')}
                      className="h-7 w-20 text-right text-sm"
                    />
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Partager avec toute l'agence</Label>
              <p className="text-[11px] text-muted-foreground">Visible par tous les collaborateurs</p>
            </div>
            <Switch
              checked={form.is_shared}
              onCheckedChange={(v) => setForm((p) => ({ ...p, is_shared: v }))}
            />
          </div>
        </div>
      </CrudSheet>
    </>
  )
}
