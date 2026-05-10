import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  notificationTemplateHooks,
  useSmtpConfig, useUpdateSmtpConfig, useTestSmtpConfig,
  useTwilioConfig, useUpdateTwilioConfig, useTestTwilioConfig,
} from '@/hooks/useSettings'
import { SettingsCard } from './SettingsCard'
import { CrudSheet } from './CrudSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bell, Mail, MessageSquare, Plus, Pencil } from 'lucide-react'
import type { NotificationTemplate, SmtpConfig, TwilioConfig } from '@/types/settings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { settingsInnerTabsContent, settingsInnerTabsList, settingsInnerTabsTrigger } from './innerTabStyles'

type NotificationTemplateForm = Partial<Omit<NotificationTemplate, 'id'>> & { id?: number }

export default function NotificationsTab() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Notifications</h2>
        <p className="text-sm text-muted-foreground">Templates, configuration SMTP et Twilio</p>
      </motion.div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className={settingsInnerTabsList}>
          <TabsTrigger value="templates" className={settingsInnerTabsTrigger}>Templates</TabsTrigger>
          <TabsTrigger value="smtp" className={settingsInnerTabsTrigger}>SMTP</TabsTrigger>
          <TabsTrigger value="twilio" className={settingsInnerTabsTrigger}>Twilio</TabsTrigger>
        </TabsList>
        <TabsContent value="templates" className={settingsInnerTabsContent}>
          <TemplatesCard />
        </TabsContent>
        <TabsContent value="smtp" className={settingsInnerTabsContent}>
          <SmtpCard />
        </TabsContent>
        <TabsContent value="twilio" className={settingsInnerTabsContent}>
          <TwilioCard />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TemplatesCard() {
  const { data: templates, isLoading } = notificationTemplateHooks.useList()
  const create = notificationTemplateHooks.useCreate()
  const update = notificationTemplateHooks.useUpdate()
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<NotificationTemplate | null>(null)
  const [form, setForm] = useState<NotificationTemplateForm>({ channel: 'email', is_active: true })
  const setField = (k: keyof NotificationTemplateForm, v: NotificationTemplateForm[keyof NotificationTemplateForm]) =>
    setForm((p) => ({ ...p, [k]: v }))

  const openCreate = () => {
    setEditItem(null)
    setForm({ channel: 'email', is_active: true })
    setOpen(true)
  }
  const openEdit = (t: NotificationTemplate) => {
    setEditItem(t)
    setForm({ ...t })
    setOpen(true)
  }

  const handleSubmit = () => {
    if (editItem) {
      update.mutate({ id: editItem.id, data: form }, { onSuccess: () => setOpen(false) })
    } else {
      create.mutate(form, { onSuccess: () => setOpen(false) })
    }
  }

  const channelLabel: Record<string, string> = { email: 'Email', sms: 'SMS', whatsapp: 'WhatsApp' }

  return (
    <>
      <SettingsCard title="Templates de notification" icon={Bell} badge={`${templates?.length ?? 0}`} isLoading={isLoading}
        actions={<Button size="sm" onClick={openCreate}><Plus size={14} className="mr-1" />Ajouter</Button>}>
        <div className="space-y-2">
          {templates?.map((t: NotificationTemplate) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors">
              <div>
                <p className="font-medium text-sm">{t.event}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{channelLabel[t.channel] || t.channel}</Badge>
                  {t.subject && <span className="text-xs text-muted-foreground">{t.subject}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={t.is_active ? 'default' : 'secondary'} className="text-xs">{t.is_active ? 'Actif' : 'Inactif'}</Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil size={14} /></Button>
              </div>
            </div>
          ))}
          {(!templates || templates.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">Aucun template</p>}
        </div>
      </SettingsCard>

      <CrudSheet open={open} onOpenChange={setOpen} title={editItem ? 'Modifier le template' : 'Nouveau template'} onSubmit={handleSubmit} isLoading={create.isPending || update.isPending}>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Evenement</Label><Input value={form.event || ''} onChange={e => setField('event', e.target.value)} placeholder="shipment_status_changed" /></div>
          <div className="space-y-2">
            <Label>Canal</Label>
            <Select value={form.channel || 'email'} onValueChange={v => setField('channel', v as NotificationTemplate['channel'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.channel === 'email' && <div className="space-y-2"><Label>Sujet</Label><Input value={form.subject || ''} onChange={e => setField('subject', e.target.value)} /></div>}
          <div className="space-y-2"><Label>Corps du message</Label><Textarea value={form.body || ''} onChange={e => setField('body', e.target.value)} rows={8} placeholder="Bonjour {client_name}, votre expedition {tracking_number}..." /></div>
          <div className="flex items-center justify-between"><Label>Actif</Label><Switch checked={form.is_active !== false} onCheckedChange={v => setField('is_active', v)} /></div>
          {((form.variables?.length) ?? 0) > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Variables disponibles:</Label>
              <div className="flex flex-wrap gap-1">{(form.variables ?? []).map((v: string) => <Badge key={v} variant="secondary" className="text-xs">{`{${v}}`}</Badge>)}</div>
            </div>
          )}
        </div>
      </CrudSheet>
    </>
  )
}

function SmtpCardForm({ initialSmtp }: { initialSmtp: SmtpConfig }) {
  const update = useUpdateSmtpConfig()
  const testSmtp = useTestSmtpConfig()
  const [form, setForm] = useState<Partial<SmtpConfig>>(() => ({ ...initialSmtp }))
  const [testTo, setTestTo] = useState('')
  const set = (k: keyof SmtpConfig, v: string | number) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Serveur SMTP</Label><Input value={form.host || ''} onChange={e => set('host', e.target.value)} placeholder="smtp.example.com" /></div>
          <div className="space-y-2"><Label>Port</Label><Input type="number" value={form.port ?? ''} onChange={e => set('port', Number(e.target.value))} placeholder="587" /></div>
          <div className="space-y-2">
            <Label>Chiffrement</Label>
            <Select value={form.encryption || 'tls'} onValueChange={v => set('encryption', v as SmtpConfig['encryption'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tls">TLS</SelectItem>
                <SelectItem value="ssl">SSL</SelectItem>
                <SelectItem value="none">Aucun</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Utilisateur</Label><Input value={form.username || ''} onChange={e => set('username', e.target.value)} /></div>
          <div className="space-y-2"><Label>Mot de passe</Label><Input type="password" value={form.password || ''} onChange={e => set('password', e.target.value)} placeholder="Laisser vide pour ne pas modifier" /></div>
          <div className="space-y-2"><Label>Email d'envoi</Label><Input type="email" value={form.from_email || ''} onChange={e => set('from_email', e.target.value)} /></div>
          <div className="space-y-2"><Label>Nom d'envoi</Label><Input value={form.from_name || ''} onChange={e => set('from_name', e.target.value)} /></div>
        </div>
        <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
          <p className="text-sm text-muted-foreground">Enregistrez la configuration, puis testez l’envoi avec une adresse réelle.</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="smtp-test-to">E-mail de test (destinataire)</Label>
              <Input id="smtp-test-to" type="email" value={testTo} onChange={e => setTestTo(e.target.value)} placeholder="vous@exemple.com" />
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={testSmtp.isPending || !testTo.trim()}
              onClick={() => testSmtp.mutate(testTo.trim())}
            >
              {testSmtp.isPending ? 'Envoi...' : 'Envoyer un e-mail de test'}
            </Button>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => update.mutate(form as SmtpConfig)} disabled={update.isPending}>
            {update.isPending ? 'Enregistrement...' : 'Enregistrer SMTP'}
          </Button>
        </div>
    </div>
  )
}

function SmtpCard() {
  const { data: smtp, isLoading, dataUpdatedAt } = useSmtpConfig()
  return (
    <SettingsCard title="Configuration SMTP (Email)" icon={Mail} isLoading={isLoading}>
      {smtp ? <SmtpCardForm key={dataUpdatedAt} initialSmtp={smtp} /> : null}
    </SettingsCard>
  )
}

function TwilioCardForm({ initialTwilio }: { initialTwilio: TwilioConfig }) {
  const update = useUpdateTwilioConfig()
  const testTwilio = useTestTwilioConfig()
  const [form, setForm] = useState<Partial<TwilioConfig>>(() => ({ ...initialTwilio }))
  const [testTo, setTestTo] = useState('')
  const [testChannel, setTestChannel] = useState<'sms' | 'whatsapp'>('sms')
  const set = <K extends keyof TwilioConfig>(k: K, v: TwilioConfig[K]) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Account SID</Label><Input value={form.account_sid || ''} onChange={e => set('account_sid', e.target.value)} placeholder="ACxxxxxxx" /></div>
          <div className="space-y-2"><Label>Auth Token</Label><Input type="password" value={form.auth_token || ''} onChange={e => set('auth_token', e.target.value)} placeholder="Laisser vide pour ne pas modifier" /></div>
          <div className="space-y-2"><Label>Numero SMS</Label><Input value={form.from_number || ''} onChange={e => set('from_number', e.target.value)} placeholder="+32..." /></div>
          <div className="space-y-2"><Label>Numero WhatsApp</Label><Input value={form.whatsapp_number || ''} onChange={e => set('whatsapp_number', e.target.value)} placeholder="+32..." /></div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2"><Switch checked={!!form.is_active} onCheckedChange={v => set('is_active', v)} /><Label>SMS actif</Label></div>
          <div className="flex items-center gap-2"><Switch checked={!!form.whatsapp_active} onCheckedChange={v => set('whatsapp_active', v)} /><Label>WhatsApp actif</Label></div>
        </div>
        <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
          <p className="text-sm text-muted-foreground">Après enregistrement : vérifiez les identifiants sans envoyer de message, ou envoyez un SMS / WhatsApp de test (coût Twilio possible).</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={testTwilio.isPending}
              onClick={() => testTwilio.mutate({})}
            >
              {testTwilio.isPending ? 'Vérification...' : 'Vérifier les identifiants Twilio'}
            </Button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-2 flex-1">
              <Label>Canal de test</Label>
              <Select value={testChannel} onValueChange={v => setTestChannel(v as 'sms' | 'whatsapp')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-[2] min-w-[12rem]">
              <Label htmlFor="twilio-test-to">Destinataire (E.164, ex. +32470123456)</Label>
              <Input id="twilio-test-to" value={testTo} onChange={e => setTestTo(e.target.value)} placeholder="+32..." />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={testTwilio.isPending || !testTo.trim()}
              onClick={() => testTwilio.mutate({ to: testTo.trim(), channel: testChannel })}
            >
              {testTwilio.isPending ? 'Envoi...' : 'Envoyer un message de test'}
            </Button>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => update.mutate(form as TwilioConfig)} disabled={update.isPending}>
            {update.isPending ? 'Enregistrement...' : 'Enregistrer Twilio'}
          </Button>
        </div>
    </div>
  )
}

function TwilioCard() {
  const { data: twilio, isLoading, dataUpdatedAt } = useTwilioConfig()
  return (
    <SettingsCard title="Configuration Twilio (SMS & WhatsApp)" icon={MessageSquare} isLoading={isLoading}>
      {twilio ? <TwilioCardForm key={dataUpdatedAt} initialTwilio={twilio} /> : null}
    </SettingsCard>
  )
}
