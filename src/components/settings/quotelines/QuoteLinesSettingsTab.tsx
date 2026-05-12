import { lazy, Suspense, useState } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { settingsInnerTabsContent, settingsInnerTabsList, settingsInnerTabsTrigger } from '../innerTabStyles'
import { QuoteLineTemplatesSection } from './QuoteLineTemplatesSection'
import { QuoteTemplatesSection } from './QuoteTemplatesSection'
import { QuoteFollowUpSection } from './QuoteFollowUpSection'

const QuoteEmailTemplatesSection = lazy(() => import('./QuoteEmailTemplatesSection'))
const QuoteTemplateAuditLog = lazy(() => import('./QuoteTemplateAuditLog'))

function TabLoader() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

export default function QuoteLinesSettingsTab() {
  const [activeTab, setActiveTab] = useState('lines')

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight mb-1 text-foreground">Devis — achat assisté</h2>
        <p className="text-sm text-muted-foreground">
          Lignes de frais, templates de combinaisons et paramètres de relance.
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={settingsInnerTabsList}>
          <TabsTrigger value="lines" className={settingsInnerTabsTrigger}>
            Lignes de frais
          </TabsTrigger>
          <TabsTrigger value="templates" className={settingsInnerTabsTrigger}>
            Templates
          </TabsTrigger>
          <TabsTrigger value="followup" className={settingsInnerTabsTrigger}>
            Relances
          </TabsTrigger>
          <TabsTrigger value="emails" className={settingsInnerTabsTrigger}>
            Emails
          </TabsTrigger>
          <TabsTrigger value="audit" className={settingsInnerTabsTrigger}>
            Historique
          </TabsTrigger>
        </TabsList>
        <TabsContent value="lines" className={settingsInnerTabsContent}>
          <QuoteLineTemplatesSection />
        </TabsContent>
        <TabsContent value="templates" className={settingsInnerTabsContent}>
          <QuoteTemplatesSection />
        </TabsContent>
        <TabsContent value="followup" className={settingsInnerTabsContent}>
          <QuoteFollowUpSection />
        </TabsContent>
        <TabsContent value="emails" className={settingsInnerTabsContent}>
          <Suspense fallback={<TabLoader />}>
            <QuoteEmailTemplatesSection />
          </Suspense>
        </TabsContent>
        <TabsContent value="audit" className={settingsInnerTabsContent}>
          <Suspense fallback={<TabLoader />}>
            <QuoteTemplateAuditLog />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
