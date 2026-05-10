import { motion } from 'framer-motion'
import { Package, Building, Tag } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { settingsInnerTabsContent, settingsInnerTabsList, settingsInnerTabsTrigger } from './innerTabStyles'
import { ShippingModesSection } from './shipping/ShippingModesSection'
import { CrudList } from './shipping/ShippingCrudSection'

export default function ShippingTab() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Transport & Logistique</h2>
        <p className="text-sm text-muted-foreground">Modes, emballages, transporteurs et catégories (lignes & tarifs : Tarifs & extras)</p>
      </motion.div>

      <Tabs defaultValue="modes" className="w-full">
        <TabsList className={`${settingsInnerTabsList} flex flex-wrap gap-1 h-auto min-h-10 py-1`}>
          <TabsTrigger value="modes" className={settingsInnerTabsTrigger}>
            Modes d&apos;expédition
          </TabsTrigger>
          <TabsTrigger value="packaging" className={settingsInnerTabsTrigger}>
            Emballages
          </TabsTrigger>
          <TabsTrigger value="delivery" className={settingsInnerTabsTrigger}>
            Transporteurs
          </TabsTrigger>
          <TabsTrigger value="categories" className={settingsInnerTabsTrigger}>
            Catégories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modes" className={settingsInnerTabsContent}>
          <ShippingModesSection />
        </TabsContent>

        <TabsContent value="packaging" className={settingsInnerTabsContent}>
          <CrudList
            title="Types d'emballage"
            icon={Package}
            entityType="packaging_type"
            initialCreateDefaults={{ is_billable: false, unit_price: 0 }}
            extraFields={[
              { key: 'description', label: 'Description', type: 'textarea' },
              { key: 'is_billable', label: "Facturable (prix × quantité totale d'articles)", type: 'switch' },
              { key: 'unit_price', label: 'Prix unitaire', type: 'number', step: '0.01' },
            ]}
          />
        </TabsContent>

        <TabsContent value="delivery" className={settingsInnerTabsContent}>
          <CrudList
            title="Transporteurs"
            icon={Building}
            entityType="transport_company"
            extraFields={[
              { key: 'contact_name', label: 'Contact (nom)' },
              { key: 'contact_email', label: 'E-mail' },
              { key: 'contact_phone', label: 'Téléphone' },
            ]}
          />
        </TabsContent>

        <TabsContent value="categories" className={settingsInnerTabsContent}>
          <CrudList
            title="Categories d'articles"
            icon={Tag}
            entityType="article_category"
            extraFields={[{ key: 'description', label: 'Description', type: 'textarea' }]}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
