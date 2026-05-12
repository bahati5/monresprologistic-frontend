import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import {
  Settings,
  Building2,
  Truck,
  Banknote,
  CreditCard,
  Bell,
  ShoppingBag,
  FileText,
  Coins,
  Plug,
  AlertTriangle,
  GitBranch,
  Calculator,
} from 'lucide-react'
import {
  GeneralTab, AgenciesTab, ShippingTab, PricingTab,
  PaymentsTab, NotificationsTab, MerchantSettings, ReferenceSettingsTab,
  ExchangeRatesTab,
  SyncErrorsTab,
  WorkflowsTab,
  QuoteLinesSettingsTab,
} from '@/components/settings'
import IntegrationsTab from '@/components/settings/IntegrationsTab'

type TabValue =
  | 'general'
  | 'agencies'
  | 'shipping'
  | 'pricing'
  | 'quote-lines'
  | 'workflows'
  | 'payments'
  | 'notifications'
  | 'references'
  | 'merchants'
  | 'exchange-rates'
  | 'integrations'
  | 'sync-errors'

const tabs: { value: TabValue; label: string; icon: typeof Settings; description: string }[] = [
  { value: 'general',       label: 'Général',           icon: Settings,   description: 'Identité, devise, langue' },
  { value: 'agencies',      label: 'Agences', icon: Building2,  description: 'Structure multi-agences' },
  { value: 'shipping',      label: 'Transport',         icon: Truck,      description: 'Modes, emballages, transporteurs' },
  { value: 'pricing',       label: 'Tarifs & extras',   icon: Banknote, description: 'Lignes et extras de facturation' },
  { value: 'quote-lines',    label: 'Devis',             icon: Calculator, description: 'Lignes, templates, devises et relances' },
  { value: 'exchange-rates', label: 'Devises', icon: Coins, description: 'Taux de change, historique et convertisseur' },
  { value: 'payments',      label: 'Paiements',         icon: CreditCard, description: 'Méthodes et passerelles' },
  { value: 'notifications', label: 'Notifications',     icon: Bell,       description: 'Modèles, SMTP, Twilio' },
  {
    value: 'references',
    label: 'Nomenclature',
    icon: FileText,
    description: 'Casier, suivi, factures, formats de numérotation et compteurs',
  },
  { value: 'merchants',     label: 'Marchands',         icon: ShoppingBag, description: 'Shopping assisté, logos & domaines' },
  { value: 'integrations',  label: 'Intégrations',      icon: Plug,       description: 'Freshsales, Odoo, FlexPay, WordPress' },
  { value: 'sync-errors',   label: 'Erreurs sync',      icon: AlertTriangle, description: 'Odoo, Freshsales — retry et résolution' },
  { value: 'workflows',     label: 'Workflows',       icon: GitBranch,    description: 'Délais, seuils et validations métier' },
]

function tabFromSearchParams(searchParams: URLSearchParams): TabValue | null {
  const t = searchParams.get('tab')
  if (t === 'sync-errors' || t === 'integrations' || t === 'workflows' || t === 'quote-lines') {
    return t
  }
  return null
}

export default function SettingsHub() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlTab = tabFromSearchParams(searchParams)
  const [manualTab, setManualTab] = useState<TabValue | null>(null)
  const activeTab = urlTab ?? manualTab ?? 'general'

  const selectTab = (value: TabValue) => {
    setManualTab(value)
    if (searchParams.has('tab')) {
      const next = new URLSearchParams(searchParams)
      next.delete('tab')
      setSearchParams(next, { replace: true })
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'general':       return <GeneralTab />
      case 'agencies':      return <AgenciesTab />
      case 'shipping':      return <ShippingTab />
      case 'pricing':       return <PricingTab />
      case 'quote-lines':   return <QuoteLinesSettingsTab />
      case 'exchange-rates': return <ExchangeRatesTab />
      case 'payments':      return <PaymentsTab />
      case 'notifications': return <NotificationsTab />
      case 'references':    return <ReferenceSettingsTab />
      case 'merchants':     return <MerchantSettings />
      case 'integrations':  return <IntegrationsTab />
      case 'sync-errors':   return <SyncErrorsTab />
      case 'workflows':     return <WorkflowsTab />
      default:              return null
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 border-b border-border bg-card/90 backdrop-blur-xl supports-[backdrop-filter]:bg-card/75"
      >
        <div className="flex h-20 items-center px-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-md shadow-primary/20">
              <Settings className="h-6 w-6 text-primary-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Configuration</h1>
              <p className="text-sm text-muted-foreground tracking-tight">
                Paramètres généraux, transport, tarifs, paiements et intégrations
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-72 relative flex-shrink-0 flex flex-col min-h-0"
        >
          <div className="flex-1 min-h-0 p-6 flex flex-col">
            <div className="flex-1 min-h-0 min-w-0 flex flex-col rounded-2xl border border-border bg-card/80 backdrop-blur-xl shadow-sm p-4 overflow-hidden">
              <div className="mb-6 flex-shrink-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-3 mb-3">
                  Navigation
                </p>
              </div>

              <LayoutGroup>
                <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-1 pr-1 -mr-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.value

                    return (
                      <motion.button
                        key={tab.value}
                        onClick={() => selectTab(tab.value)}
                        className="w-full relative"
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeSettingsTab"
                            className="absolute inset-0 bg-gradient-to-r from-primary to-primary/90 rounded-xl shadow-md shadow-primary/25"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                          />
                        )}

                        <div
                          className={`
                          relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors
                          ${isActive ? 'text-primary-foreground' : 'text-foreground/85 hover:bg-muted/70'}
                        `}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
                          <div className="flex-1 text-left">
                            <div className={`font-medium text-sm ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>
                              {tab.label}
                            </div>
                            <div className={`text-xs ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                              {tab.description}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </nav>
              </LayoutGroup>
            </div>
          </div>
        </motion.div>

        <div className="flex-1 overflow-y-auto relative bg-background/50">
          <div className="p-8 pb-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
