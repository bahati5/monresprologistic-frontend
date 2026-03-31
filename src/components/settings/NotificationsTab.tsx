import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  notificationTemplateHooks,
  useSmtpConfig, useUpdateSmtpConfig,
  useTwilioConfig, useUpdateTwilioConfig,
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
import type { NotificationTemplate } from '@/types/settings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { settingsInnerTabsContent, settingsInnerTabsList, settingsInnerTabsTrigger } from './innerTabStyles'

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
  const [form, setForm] = useState<Record<string, any>>({ channel: 'email', is_active: true })
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const openCreate = () => { setEditItem(null); setForm({ channel: 'email', is_active: true }); setOpen(true) }
  const openEdit = (t: NotificationTemplate) => { setEditItem(t); setForm({ ...t }); setOpen(true) }

  const handleSubmit = () => {
    if (editItem) {
      update.mutate({ id: editItem.id, data: form }, { onSuccess: () => setOpen(false) })
    } else {
      create.mutate(form as any, { onSuccess: () => setOpen(false) })
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
          <div className="space-y-2"><Label>Evenement</Label><Input value={form.event || ''} onChange={e => set('event', e.target.value)} placeholder="shipment_status_changed" /></div>
          <div className="space-y-2">
            <Label>Canal</Label>
            <Select value={form.channel || 'email'} onValueChange={v => set('channel', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.channel === 'email' && <div className="space-y-2"><Label>Sujet</Label><Input value={form.subject || ''} onChange={e => set('subject', e.target.value)} /></div>}
          <div className="space-y-2"><Label>Corps du message</Label><Textarea value={form.body || ''} onChange={e => set('body', e.target.value)} rows={8} placeholder="Bonjour {client_name}, votre expedition {tracking_number}..." /></div>
          <div className="flex items-center justify-between"><Label>Actif</Label><Switch checked={form.is_active !== false} onCheckedChange={v => set('is_active', v)} /></div>
          {form.variables?.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Variables disponibles:</Label>
              <div className="flex flex-wrap gap-1">{form.variables.map((v: string) => <Badge key={v} variant="secondary" className="text-xs">{`{${v}}`}</Badge>)}</div>
            </div>
          )}
        </div>
      </CrudSheet>
    </>
  )
}

function SmtpCard() {
  const { data: smtp, isLoading } = useSmtpConfig()
  const update = useUpdateSmtpConfig()
  const [form, setForm] = useState<Record<string, any>>({})
  useEffect(() => { if (smtp) setForm(smtp) }, [smtp])
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  return (
    <SettingsCard title="Configuration SMTP (Email)" icon={Mail} isLoading={isLoading}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Serveur SMTP</Label><Input value={form.host || ''} onChange={e => set('host', e.target.value)} placeholder="smtp.example.com" /></div>
          <div className="space-y-2"><Label>Port</Label><Input type="number" value={form.port ?? ''} onChange={e => set('port', Number(e.target.value))} placeholder="587" /></div>
          <div className="space-y-2">
            <Label>Chiffrement</Label>
            <Select value={form.encryption || 'tls'} onValueChange={v => set('encryption', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tls">TLS</SelectItem>
                <SelectItem value="ssl">SSL</SelectItem>
                <SelectItem value="none">Aucun</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Utilisateur</Label><Input value={form.username || ''} onChange={e => set('username', e.target.value)} /></div>
          <div className="space-y-2"><Label>Mot de passe</Label><Input type="password" value={form.password || ''} onChange={e => set('password', e.target.value)} /></div>
          <div className="space-y-2"><Label>Email d'envoi</Label><Input type="email" value={form.from_email || ''} onChange={e => set('from_email', e.target.value)} /></div>
          <div className="space-y-2"><Label>Nom d'envoi</Label><Input value={form.from_name || ''} onChange={e => set('from_name', e.target.value)} /></div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => update.mutate(form)} disabled={update.isPending}>
            {update.isPending ? 'Enregistrement...' : 'Enregistrer SMTP'}
          </Button>
        </div>
      </div>
    </SettingsCard>
  )
}

function TwilioCard() {
  const { data: twilio, isLoading } = useTwilioConfig()
  const update = useUpdateTwilioConfig()
  const [form, setForm] = useState<Record<string, any>>({})
  useEffect(() => { if (twilio) setForm(twilio) }, [twilio])
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  return (
    <SettingsCard title="Configuration Twilio (SMS & WhatsApp)" icon={MessageSquare} isLoading={isLoading}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Account SID</Label><Input value={form.account_sid || ''} onChange={e => set('account_sid', e.target.value)} placeholder="ACxxxxxxx" /></div>
          <div className="space-y-2"><Label>Auth Token</Label><Input type="password" value={form.auth_token || ''} onChange={e => set('auth_token', e.target.value)} /></div>
          <div className="space-y-2"><Label>Numero SMS</Label><Input value={form.from_number || ''} onChange={e => set('from_number', e.target.value)} placeholder="+32..." /></div>
          <div className="space-y-2"><Label>Numero WhatsApp</Label><Input value={form.whatsapp_number || ''} onChange={e => set('whatsapp_number', e.target.value)} placeholder="+32..." /></div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2"><Switch checked={!!form.is_active} onCheckedChange={v => set('is_active', v)} /><Label>SMS actif</Label></div>
          <div className="flex items-center gap-2"><Switch checked={!!form.whatsapp_active} onCheckedChange={v => set('whatsapp_active', v)} /><Label>WhatsApp actif</Label></div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => update.mutate(form)} disabled={update.isPending}>
            {update.isPending ? 'Enregistrement...' : 'Enregistrer Twilio'}
          </Button>
        </div>
      </div>
    </SettingsCard>
  )
}
