import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Loader2, ExternalLink, Code } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/apiError'

function IntegrationCard({
  title,
  description,
  badge,
  fields,
  selects,
  settingPrefix,
  testEndpoint,
}: {
  title: string
  description: string
  badge?: string
  fields: { key: string; label: string; type?: string; placeholder?: string }[]
  selects?: { key: string; label: string; options: { value: string; label: string }[] }[]
  settingPrefix: string
  testEndpoint?: string
}) {
  const queryClient = useQueryClient()
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const { data: settings } = useQuery({
    queryKey: ['settings', 'app'],
    queryFn: () => api.get('/api/settings/app').then(r => ({ app: r.data.settings ?? {} })),
  })

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, string | boolean>) =>
      api.put('/api/settings/app', data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'app'] })
      toast.success('Paramètres enregistrés.')
    },
    onError: () => toast.error('Erreur lors de l\'enregistrement.'),
  })

  const appSettings = settings?.app ?? {}
  const [form, setForm] = useState<Record<string, string>>({})

  const getValue = (key: string) => {
    if (form[key] !== undefined) return form[key]
    return appSettings[key] ?? ''
  }

  const handleSave = () => {
    saveMutation.mutate(form)
  }

  const handleTest = async () => {
    if (!testEndpoint) return
    setTesting(true)
    setTestResult(null)
    try {
      const { data } = await api.post(testEndpoint)
      setTestResult({ success: data.success ?? true, message: data.message ?? 'Connexion réussie.' })
    } catch (err: unknown) {
      setTestResult({ success: false, message: getApiErrorMessage(err, 'Connexion échouée.') })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {badge && <Badge variant="outline" className="text-xs">{badge}</Badge>}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={!!getValue(`${settingPrefix}_enabled`)}
            onCheckedChange={checked => setForm(f => ({ ...f, [`${settingPrefix}_enabled`]: checked ? '1' : '0' }))}
          />
          <Label>Activer l'intégration</Label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map(field => (
            <div key={field.key} className="space-y-1.5">
              <Label>{field.label}</Label>
              <Input
                type={field.type ?? 'text'}
                placeholder={field.placeholder}
                value={getValue(field.key)}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        {selects && selects.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {selects.map(sel => (
              <div key={sel.key} className="space-y-1.5">
                <Label>{sel.label}</Label>
                <Select
                  value={(getValue(sel.key) !== '' ? getValue(sel.key) : null) ?? sel.options[0]?.value ?? ''}
                  onValueChange={v => setForm(f => ({ ...f, [sel.key]: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir…" />
                  </SelectTrigger>
                  <SelectContent>
                    {sel.options.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            Enregistrer
          </Button>
          {testEndpoint && (
            <Button size="sm" variant="outline" onClick={handleTest} disabled={testing}>
              {testing ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Tester la connexion
            </Button>
          )}
          {testResult && (
            <div className={`flex items-center gap-1 text-xs ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {testResult.success ? <CheckCircle size={12} /> : <XCircle size={12} />}
              {testResult.message}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function IntegrationsTab() {
  const apiBase = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Intégrations tierces</h2>
        <p className="text-sm text-muted-foreground">
          Connectez Monrespro Logistic à vos outils métier.
        </p>
      </div>

      {/* §15 — Freshsales */}
      <IntegrationCard
        title="Freshsales CRM"
        description="§15 — Synchronise contacts, deals et tickets SAV automatiquement."
        badge="P0"
        settingPrefix="freshsales"
        fields={[
          { key: 'freshsales_url', label: 'URL Freshsales', placeholder: 'https://monentreprise.freshsales.io' },
          { key: 'freshsales_api_key', label: 'Clé API', type: 'password', placeholder: 'Token token=...' },
        ]}
      />

      {/* §16 — Odoo */}
      <IntegrationCard
        title="Odoo ERP"
        description="§16 — Synchronise les factures et remboursements vers Odoo."
        badge="P0"
        settingPrefix="odoo"
        fields={[
          { key: 'odoo_url', label: 'URL Odoo', placeholder: 'https://odoo.monentreprise.com' },
          { key: 'odoo_db', label: 'Base de données', placeholder: 'ma-db-odoo' },
          { key: 'odoo_username', label: 'Utilisateur', placeholder: 'admin' },
          { key: 'odoo_password', label: 'Mot de passe', type: 'password' },
        ]}
        selects={[
          {
            key: 'odoo_invoice_sync_trigger',
            label: 'Export facture client vers Odoo',
            options: [
              { value: 'on_delivered', label: 'Dès la livraison de l’expédition' },
              { value: 'on_invoice_accounting', label: 'À la comptabilisation (payée / envoyée / partielle)' },
            ],
          },
        ]}
      />

      {/* §15 — FlexPay */}
      <IntegrationCard
        title="FlexPay (Mobile Money)"
        description="§15 — Paiements Mobile Money (M-Pesa, Orange Money, Airtel Money) via FlexPay."
        settingPrefix="flexpay"
        fields={[
          { key: 'flexpay_url', label: 'URL API', placeholder: 'https://backend.flexpay.cd/api/rest/v1' },
          { key: 'flexpay_api_key', label: 'Clé API', type: 'password' },
          { key: 'flexpay_merchant_code', label: 'Code marchand' },
        ]}
      />

      {/* §17 — Widget WordPress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Widget WordPress</CardTitle>
            <Badge variant="outline" className="text-xs">§17</Badge>
          </div>
          <CardDescription>
            Intégrez le widget de suivi de colis sur n'importe quel site WordPress.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 space-y-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <Code size={14} />Intégration HTML (n'importe quel site)
            </p>
            <pre className="text-xs bg-background border rounded p-3 overflow-x-auto">
{`<div data-monrespro-tracking></div>
<script>
  window.MonresproConfig = { apiUrl: '${apiBase}/api' };
</script>
<script src="${apiBase}/widget/tracking.js"></script>`}
            </pre>
          </div>
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">Shortcode WordPress</p>
            <pre className="text-xs bg-background border rounded p-3">
{`[monrespro_tracking api_url="${apiBase}/api"]`}
            </pre>
            <p className="text-xs text-muted-foreground">
              Ajoutez ce shortcode dans votre fichier <code>functions.php</code> :
            </p>
            <pre className="text-xs bg-background border rounded p-3 overflow-x-auto">
{`add_shortcode('monrespro_tracking', function($atts) {
  $atts = shortcode_atts(['api_url' => '${apiBase}/api'], $atts);
  return '<div data-monrespro-tracking></div>
    <script>window.MonresproConfig={apiUrl:"' . esc_js($atts['api_url']) . '"}</script>
    <script src="${apiBase}/widget/tracking.js"></script>';
});`}
            </pre>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={`${apiBase}/widget/tracking.js`} target="_blank" rel="noreferrer">
              <ExternalLink size={12} className="mr-1.5" />Télécharger le script JS
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
