import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Mail, Pencil, Save, Loader2, Eye, X } from 'lucide-react'
import api from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface QuoteEmailTemplate {
  id: number
  event: string
  subject: string
  body: string
  is_active: boolean
  variables: string[]
}

const QUOTE_EMAIL_EVENTS: Record<string, { label: string; description: string }> = {
  quote_sent: {
    label: 'Envoi du devis',
    description: 'Email envoyé au client quand un nouveau devis est prêt',
  },
  quote_reminder_1: {
    label: 'Relance 1',
    description: 'Première relance automatique après délai configuré',
  },
  quote_reminder_2: {
    label: 'Relance 2',
    description: 'Deuxième relance automatique (dernière chance)',
  },
  quote_expired: {
    label: 'Expiration',
    description: 'Notification au client quand le devis est expiré',
  },
  quote_accepted_confirmation: {
    label: 'Confirmation d\'acceptation',
    description: 'Confirmation envoyée après acceptation du devis',
  },
  quote_unavailable: {
    label: 'Indisponibilité totale',
    description: 'Email quand tous les articles sont indisponibles',
  },
}

/** Variables souvent disponibles selon l’événement (fusionnées avec celles renvoyées par l’API). Syntaxe serveur : {{nom_variable}} */
const EXTRA_VARIABLES_BY_EVENT: Record<string, string[]> = {
  quote_sent: [
    'quote_reference',
    'purchase_id',
    'client_name',
    'client_first_name',
    'client_email',
    'total_formatted',
    'quote_total',
    'total_amount',
    'currency',
    'currency_symbol',
    'total_secondary',
    'secondary_currency',
    'quote_link',
    'response_url',
    'payment_url',
    'validity_days',
    'expiry_date',
    'expires_at',
    'company_phone',
    'company_name',
    'site_name',
    'site_email',
    'company_email',
    'estimated_delivery',
    'staff_message',
    'payment_methods_note',
    'payment_instructions',
    'lines_subtotal_formatted',
    'service_fee_formatted',
    'bank_fee_formatted',
    'bank_fee_percentage',
    'accent_color',
    'logo_url',
    'articles_summary',
  ],
}

function mergedTemplateVariables(template: QuoteEmailTemplate): string[] {
  const fromApi = template.variables ?? []
  const extra = EXTRA_VARIABLES_BY_EVENT[template.event] ?? []
  return [...new Set([...extra, ...fromApi])]
}

function varToken(name: string): string {
  return `{{${name}}}`
}

function TemplateCard({
  template,
  onEdit,
  onPreview,
  onToggle,
  isToggling,
}: {
  template: QuoteEmailTemplate
  onEdit: () => void
  onPreview: () => void
  onToggle: () => void
  isToggling: boolean
}) {
  const eventConfig = QUOTE_EMAIL_EVENTS[template.event]

  return (
    <div className="rounded-xl border p-4 bg-background hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-[#073763] shrink-0" />
            <h3 className="text-sm font-medium">{eventConfig?.label ?? template.event}</h3>
            <Badge
              variant={template.is_active ? 'default' : 'secondary'}
              className="text-[10px]"
            >
              {template.is_active ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 ml-5">
            {eventConfig?.description ?? ''}
          </p>
          <p className="text-xs text-muted-foreground mt-1 ml-5 truncate">
            Objet : <span className="text-foreground">{template.subject}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={template.is_active}
            onCheckedChange={onToggle}
            disabled={isToggling}
            aria-label={`Activer ${eventConfig?.label ?? template.event}`}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onPreview}
            title="Aperçu du design"
          >
            <Eye size={13} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Pencil size={13} />
          </Button>
        </div>
      </div>
      {mergedTemplateVariables(template).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 ml-5">
          {mergedTemplateVariables(template).map((v) => (
            <Badge key={v} variant="outline" className="text-[10px] font-mono">
              {varToken(v)}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function PreviewEmailDialog({
  template,
  open,
  onOpenChange,
}: {
  template: QuoteEmailTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewSubject, setPreviewSubject] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchPreview = useCallback(async (tpl: QuoteEmailTemplate) => {
    setLoading(true)
    try {
      const res = await api.post<{ html: string; subject: string }>(
        `/api/settings/quote-email-templates/${tpl.id}/preview`,
        { subject: tpl.subject, body: tpl.body },
      )
      setPreviewHtml(res.data.html)
      setPreviewSubject(res.data.subject)
    } catch {
      setPreviewHtml(
        '<div style="padding:32px;text-align:center;color:#dc2626;">Impossible de charger l\'aperçu.</div>',
      )
      setPreviewSubject('')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && template) {
      fetchPreview(template)
    }
    if (!open) {
      setPreviewHtml('')
      setPreviewSubject('')
    }
  }, [open, template?.id, template?.body, template?.subject])

  useEffect(() => {
    if (previewHtml && iframeRef.current) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(previewHtml)
        doc.close()
      }
    }
  }, [previewHtml])

  if (!template) return null

  const eventConfig = QUOTE_EMAIL_EVENTS[template.event]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[780px] max-h-[90vh] p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b bg-muted/30">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Eye size={16} className="text-[#073763] shrink-0" />
              <span className="text-sm font-semibold">
                Aperçu du design — {eventConfig?.label ?? template.event}
              </span>
            </div>
            {previewSubject && (
              <p className="text-xs text-muted-foreground truncate">
                Objet : <span className="text-foreground font-medium">{previewSubject}</span>
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Rendu généré côté serveur, proche du message reçu par le client.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => onOpenChange(false)}
          >
            <X size={14} />
          </Button>
        </div>

        <div className="flex-1 overflow-auto" style={{ height: 'calc(90vh - 88px)' }}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Chargement de l'aperçu…</span>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              title="Aperçu e-mail"
              className="w-full border-0"
              style={{ height: '100%', minHeight: '500px' }}
              sandbox="allow-same-origin"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EditTemplateDialog({
  template,
  open,
  onOpenChange,
  onSave,
  isSaving,
}: {
  template: QuoteEmailTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: { subject: string; body: string }) => void
  isSaving: boolean
}) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [showInlinePreview, setShowInlinePreview] = useState(false)
  const [inlinePreviewHtml, setInlinePreviewHtml] = useState('')
  const [inlinePreviewSubject, setInlinePreviewSubject] = useState('')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const previewIframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (open && template) {
      setSubject(template.subject)
      setBody(template.body)
      setShowInlinePreview(false)
      setInlinePreviewHtml('')
    }
  }, [open, template?.id, template?.subject, template?.body])

  useEffect(() => {
    if (inlinePreviewHtml && previewIframeRef.current) {
      const doc = previewIframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(inlinePreviewHtml)
        doc.close()
      }
    }
  }, [inlinePreviewHtml])

  const handlePreviewToggle = async () => {
    if (showInlinePreview) {
      setShowInlinePreview(false)
      return
    }
    if (!template) return
    setLoadingPreview(true)
    try {
      const res = await api.post<{ html: string; subject: string }>(
        `/api/settings/quote-email-templates/${template.id}/preview`,
        { subject, body },
      )
      setInlinePreviewHtml(res.data.html)
      setInlinePreviewSubject(res.data.subject)
      setShowInlinePreview(true)
    } catch {
      setInlinePreviewHtml(
        '<div style="padding:32px;text-align:center;color:#dc2626;">Impossible de charger l\'aperçu.</div>',
      )
      setShowInlinePreview(true)
    } finally {
      setLoadingPreview(false)
    }
  }

  if (!template) return null

  const eventConfig = QUOTE_EMAIL_EVENTS[template.event]
  const variables = mergedTemplateVariables(template)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[820px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail size={16} className="text-[#073763]" />
            {eventConfig?.label ?? template.event}
          </DialogTitle>
        </DialogHeader>

        {showInlinePreview ? (
          <div className="space-y-3 py-2">
            {inlinePreviewSubject && (
              <div className="rounded-lg border bg-muted/30 px-4 py-2">
                <p className="text-xs text-muted-foreground">
                  Objet : <span className="text-foreground font-medium">{inlinePreviewSubject}</span>
                </p>
              </div>
            )}
            <div className="rounded-lg border overflow-hidden" style={{ height: '480px' }}>
              {loadingPreview ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <iframe
                  ref={previewIframeRef}
                  title="Aperçu e-mail"
                  className="w-full border-0"
                  style={{ height: '100%' }}
                  sandbox="allow-same-origin"
                />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Rendu généré côté serveur avec des données fictives.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Objet de l'email</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Votre devis {{quote_reference}} — {{site_name}}"
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Corps du message (HTML possible)</Label>
              <p className="text-[10px] text-muted-foreground leading-snug">
                Vous pouvez utiliser du HTML pour la mise en forme (par ex.{' '}
                <code className="text-[10px]">&lt;p&gt;</code>,{' '}
                <code className="text-[10px]">&lt;strong&gt;</code>,{' '}
                <code className="text-[10px]">&lt;a href=&quot;...&quot;&gt;</code>
                ). Les variables doivent être écrites en <strong>double accolades</strong> :{' '}
                <code className="text-[10px]">{varToken('client_first_name')}</code>.
              </p>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={16}
                className="text-xs font-mono resize-y min-h-[240px]"
                placeholder={'<p>Bonjour ' + varToken('client_first_name') + ',</p>'}
              />
            </div>

            {variables.length > 0 && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium mb-1.5">Variables (clic = insertion dans le corps)</p>
                <div className="flex flex-wrap gap-1.5">
                  {variables.map((v) => (
                    <Badge
                      key={v}
                      variant="outline"
                      className="text-[10px] font-mono cursor-pointer hover:bg-accent"
                      onClick={() => {
                        setBody((b) => b + varToken(v))
                      }}
                    >
                      {varToken(v)}
                    </Badge>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Copiez-collez aussi dans l&apos;objet si besoin ; même syntaxe{' '}
                  <code className="text-[10px]">{varToken('quote_reference')}</code>.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handlePreviewToggle}
            disabled={loadingPreview}
            className="gap-1.5"
          >
            {loadingPreview ? (
              <Loader2 size={14} className="animate-spin" />
            ) : showInlinePreview ? (
              <Pencil size={14} />
            ) : (
              <Eye size={14} />
            )}
            {showInlinePreview ? 'Éditer' : 'Aperçu'}
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => onSave({ subject, body })}
            disabled={isSaving || !subject.trim() || !body.trim()}
            className="bg-[#073763] hover:bg-[#0b5394] gap-1.5"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function QuoteEmailTemplatesSection() {
  const queryClient = useQueryClient()
  const [editTemplate, setEditTemplate] = useState<QuoteEmailTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<QuoteEmailTemplate | null>(null)

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['settings', 'quote-email-templates'],
    queryFn: () =>
      api
        .get<{ templates: QuoteEmailTemplate[] }>('/api/settings/quote-email-templates')
        .then((r) => r.data.templates),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { id: number; subject?: string; body?: string; is_active?: boolean }) =>
      api.patch(`/api/settings/quote-email-templates/${payload.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'quote-email-templates'] })
    },
  })

  const handleSave = (data: { subject: string; body: string }) => {
    if (!editTemplate) return
    updateMutation.mutate(
      { id: editTemplate.id, subject: data.subject, body: data.body },
      { onSuccess: () => setEditTemplate(null) },
    )
  }

  const handleToggle = (template: QuoteEmailTemplate) => {
    updateMutation.mutate({ id: template.id, is_active: !template.is_active })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Templates email devis</h3>
          <p className="text-[11px] text-muted-foreground">
            Personnalisez les emails envoyés automatiquement dans le cycle du devis
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onEdit={() => setEditTemplate(template)}
            onPreview={() => setPreviewTemplate(template)}
            onToggle={() => handleToggle(template)}
            isToggling={updateMutation.isPending}
          />
        ))}
      </div>

      {templates.length === 0 && (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <Mail size={24} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Aucun template configuré.
            Les templates par défaut seront créés automatiquement lors du premier envoi de devis.
          </p>
        </div>
      )}

      <EditTemplateDialog
        template={editTemplate}
        open={!!editTemplate}
        onOpenChange={(open) => { if (!open) setEditTemplate(null) }}
        onSave={handleSave}
        isSaving={updateMutation.isPending}
      />

      <PreviewEmailDialog
        template={previewTemplate}
        open={!!previewTemplate}
        onOpenChange={(open) => { if (!open) setPreviewTemplate(null) }}
      />
    </div>
  )
}
