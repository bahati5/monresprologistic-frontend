import { useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import {
  Settings, Building2, Truck, DollarSign, Workflow, CreditCard, Bell, FileText,
} from 'lucide-react'
import {
  GeneralTab, AgenciesTab, ShippingTab, PricingTab,
  WorkflowsTab, PaymentsTab, NotificationsTab, DocumentsTab,
} from '@/components/settings'

type TabValue = 'general' | 'agencies' | 'shipping' | 'pricing' | 'workflows' | 'payments' | 'notifications' | 'documents'

const tabs: { value: TabValue; label: string; icon: typeof Settings; description: string }[] = [
  { value: 'general',       label: 'General',           icon: Settings,   description: 'Identite, devise, langue' },
  { value: 'agencies',      label: 'Agences & Bureaux', icon: Building2,  description: 'Succursales et points' },
  { value: 'shipping',      label: 'Transport',         icon: Truck,      description: 'Modes, emballages, delais' },
  { value: 'pricing',       label: 'Tarifs & Taxes',    icon: DollarSign, description: 'Grilles et regles' },
  { value: 'workflows',     label: 'Statuts & Workflows', icon: Workflow, description: 'Etapes et transitions' },
  { value: 'payments',      label: 'Paiements',         icon: CreditCard, description: 'Methodes et passerelles' },
  { value: 'notifications', label: 'Notifications',     icon: Bell,       description: 'Templates, SMTP, Twilio' },
  { value: 'documents',     label: 'Documents',         icon: FileText,   description: 'Templates PDF' },
]

export default function SettingsHub() {
  const [activeTab, setActiveTab] = useState<TabValue>('general')

  const renderContent = () => {
    switch (activeTab) {
      case 'general':       return <GeneralTab />
      case 'agencies':      return <AgenciesTab />
      case 'shipping':      return <ShippingTab />
      case 'pricing':       return <PricingTab />
      case 'workflows':     return <WorkflowsTab />
      case 'payments':      return <PaymentsTab />
      case 'notifications': return <NotificationsTab />
      case 'documents':     return <DocumentsTab />
      default:              return null
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-zinc-50/50 relative overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.5) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl z-10"
      >
        <div className="flex h-20 items-center px-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#0c4a6e] to-[#0e7490] shadow-lg shadow-[#0c4a6e]/20">
              <Settings className="h-6 w-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Configuration</h1>
              <p className="text-sm text-zinc-500 tracking-tight">Parametres generaux, transport, tarifs, workflows et integrations</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Glassmorphism */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-72 relative flex-shrink-0"
        >
          <div className="h-full p-6">
            <div className="h-full bg-white/80 backdrop-blur-xl border border-zinc-200/50 rounded-2xl shadow-xl shadow-zinc-900/5 p-4">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-wider text-zinc-500 font-semibold px-3 mb-3">Navigation</p>
              </div>

              <LayoutGroup>
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.value

                    return (
                      <motion.button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className="w-full relative"
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeSettingsTab"
                            className="absolute inset-0 bg-gradient-to-r from-[#0c4a6e] to-[#0e7490] rounded-xl shadow-lg shadow-[#0c4a6e]/30"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                          />
                        )}

                        <div className={`
                          relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors
                          ${isActive ? 'text-white' : 'text-zinc-700 hover:bg-zinc-100/80'}
                        `}>
                          <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
                          <div className="flex-1 text-left">
                            <div className={`font-medium text-sm ${isActive ? 'text-white' : 'text-zinc-900'}`}>
                              {tab.label}
                            </div>
                            <div className={`text-xs ${isActive ? 'text-white/70' : 'text-zinc-500'}`}>
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto relative">
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
