import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDocumentTemplates, useUpdateDocumentTemplates } from '@/hooks/useSettings'
import { SettingsCard } from './SettingsCard'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Save } from 'lucide-react'
import { displayLocalized } from '@/lib/localizedString'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { settingsInnerTabsContent, settingsInnerTabsList, settingsInnerTabsTrigger } from './innerTabStyles'

export default function DocumentsTab() {
  const { data: templates, isLoading } = useDocumentTemplates()
  const update = useUpdateDocumentTemplates()
  const [form, setForm] = useState<Record<string, any>>({})

  useEffect(() => { if (templates) setForm(templates) }, [templates])

  const handleSave = () => update.mutate(form)

  const templateList = Array.isArray(form?.templates) ? form.templates : []

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>

  const tabValue = (idx: number) => `doc-${idx}`

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Templates de documents</h2>
        <p className="text-sm text-muted-foreground">Factures, etiquettes, rapports de suivi</p>
      </motion.div>

      {templateList.length > 0 ? (
        <Tabs defaultValue={tabValue(0)} className="w-full">
          <TabsList className={settingsInnerTabsList}>
            {templateList.map((tpl: any, idx: number) => (
              <TabsTrigger key={tpl.id ?? idx} value={tabValue(idx)} className={settingsInnerTabsTrigger}>
                <span className="max-w-[140px] truncate sm:max-w-[200px]">
                  {displayLocalized(tpl.name, String(tpl.type || `Template ${idx + 1}`))}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          {templateList.map((tpl: any, idx: number) => (
            <TabsContent key={tpl.id ?? idx} value={tabValue(idx)} className={settingsInnerTabsContent}>
              <SettingsCard
                title={displayLocalized(tpl.name, String(tpl.type || ''))}
                icon={FileText}
                description={`Type: ${tpl.type}`}
              >
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Contenu du template (HTML)</Label>
                    <Textarea
                      value={tpl.content || ''}
                      onChange={e => {
                        const updated = [...templateList]
                        updated[idx] = { ...tpl, content: e.target.value }
                        setForm(prev => ({ ...prev, templates: updated }))
                      }}
                      rows={12}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              </SettingsCard>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <SettingsCard title="Aucun template" icon={FileText}>
          <p className="text-sm text-muted-foreground text-center py-4">
            Les templates de documents seront generes automatiquement ou peuvent etre configures ici.
          </p>
        </SettingsCard>
      )}

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave} disabled={update.isPending}>
          <Save size={16} className="mr-2" />
          {update.isPending ? 'Enregistrement...' : 'Enregistrer les templates'}
        </Button>
      </div>
    </div>
  )
}
