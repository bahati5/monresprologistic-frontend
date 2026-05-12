import { useState, useEffect } from 'react'
import { Save, Timer, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useQuoteFollowUpSettings, useUpdateQuoteFollowUpSettings } from '@/hooks/useQuoteFollowUp'
import type { QuoteFollowUpSettings } from '@/types/assistedPurchase'

export function QuoteFollowUpSection() {
  const { data: settings, isLoading, dataUpdatedAt } = useQuoteFollowUpSettings()
  const updateMut = useUpdateQuoteFollowUpSettings()

  const [form, setForm] = useState<QuoteFollowUpSettings>({
    quote_validity_days: 7,
    reminder_1_delay_days: 2,
    reminder_2_delay_days: 5,
    auto_reminders_enabled: true,
  })

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings, dataUpdatedAt])

  const set = <K extends keyof QuoteFollowUpSettings>(k: K, v: QuoteFollowUpSettings[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  if (isLoading) {
    return <div className="py-10 text-center text-muted-foreground">Chargement…</div>
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Validité des devis
          </CardTitle>
          <CardDescription>
            Durée pendant laquelle le client peut accepter le devis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-xs">
            <Label>Délai de validité du devis (jours)</Label>
            <Input
              type="number"
              min={1}
              max={90}
              value={form.quote_validity_days}
              onChange={(e) => set('quote_validity_days', Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Le devis expire automatiquement après ce délai sans réponse.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Relances automatiques
              </CardTitle>
              <CardDescription>
                Envoyer des relances par email si le client ne répond pas au devis.
              </CardDescription>
            </div>
            <Switch
              checked={form.auto_reminders_enabled}
              onCheckedChange={(v) => set('auto_reminders_enabled', v)}
            />
          </div>
        </CardHeader>
        {form.auto_reminders_enabled && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Délai avant relance 1 (jours)</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={form.reminder_1_delay_days}
                  onChange={(e) => set('reminder_1_delay_days', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Rappel doux — "Avez-vous consulté votre devis ?"
                </p>
              </div>
              <div className="space-y-2">
                <Label>Délai avant relance 2 (jours)</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={form.reminder_2_delay_days}
                  onChange={(e) => set('reminder_2_delay_days', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Ton plus direct + tâche « appel client recommandé » créée.
                </p>
              </div>
            </div>

            <div className="rounded-lg border p-3 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground mb-2">Aperçu de la timeline :</p>
              <div className="flex items-center gap-1 text-xs">
                <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  J0 : Envoi
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  J+{form.reminder_1_delay_days} : Relance 1
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                  J+{form.reminder_2_delay_days} : Relance 2
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  J+{form.quote_validity_days} : Expiration
                </span>
              </div>
            </div>

            <div className="rounded-lg border p-3 bg-muted/20">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>Règles d'arrêt :</strong> les relances s'arrêtent dès que le client accepte, refuse, ou envoie
                un message dans le fil (pause 48h). Le staff peut aussi désactiver manuellement les relances pour un dossier.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => updateMut.mutate(form)}
          disabled={updateMut.isPending}
          size="lg"
          className="gap-2"
        >
          <Save size={16} />
          {updateMut.isPending ? 'Enregistrement…' : 'Enregistrer les paramètres'}
        </Button>
      </div>
    </div>
  )
}
