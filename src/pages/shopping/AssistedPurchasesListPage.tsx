import { ShoppingBag, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

import GenericListPage from '@/pages/GenericListPage'
import { useAuthStore } from '@/stores/authStore'
import { usePublicBranding } from '@/hooks/useSettings'
import { Button } from '@/components/ui/button'
import { AssistedPurchasesKanbanSection } from '@/components/shopping/list/AssistedPurchasesKanbanSection'
import { AssistedPurchasesListFilters } from '@/components/shopping/list/AssistedPurchasesListFilters'
import { AssistedPurchasesListPageTabs } from '@/components/shopping/list/AssistedPurchasesListPageTabs'
import { useAssistedPurchasesListPage } from '@/components/shopping/list/useAssistedPurchasesListPage'

export default function AssistedPurchasesListPage() {
  const { user } = useAuthStore()
  const { data: branding } = usePublicBranding()
  const {
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    extraApiParams,
    filtersProps,
    columns,
    isStaff,
    isKanbanLoading,
    kanbanRes,
    updateStatusMutation,
  } = useAssistedPurchasesListPage(user)

  return (
    <div className="space-y-4">
      {/* Header glass gradient */}
      <div className="bg-linear-to-r from-[#073763] to-[#0b5394] rounded-xl p-6 text-white shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
              <ShoppingBag className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-2xl font-light">Shopping assisté</h1>
              <p className="text-white/70 text-sm font-light mt-0.5">
                Gérez les demandes d'achat, les devis et les commandes fournisseur.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-white/15 hover:bg-white/25 text-white border border-white/20 gap-1.5 backdrop-blur-sm"
          >
            <Link to="/shopping-assiste/nouveau">
              <Plus size={14} />
              Nouvelle demande
            </Link>
          </Button>
        </div>
      </div>

      <AssistedPurchasesListPageTabs
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isStaff={isStaff}
      />

      {viewMode === 'list' ? (
        <GenericListPage
          title=""
          apiPath="/api/assisted-purchases"
          dataKey="purchases"
          columns={columns}
          logoUrl={null}
          logoAlt={branding?.site_name ? `${branding.site_name} — logo` : 'Logo'}
          extraApiParams={extraApiParams}
          filtersSlot={<AssistedPurchasesListFilters {...filtersProps} />}
          detailPath={(row: Record<string, unknown>) =>
            isStaff ? `/purchase-orders/${row.id}/chiffrage` : `/purchase-orders/${row.id}`
          }
        />
      ) : (
        <AssistedPurchasesKanbanSection
          filtersProps={filtersProps}
          isKanbanLoading={isKanbanLoading}
          isStaff={isStaff}
          purchaseRows={(kanbanRes?.purchases?.data ?? []) as Record<string, unknown>[]}
          onMoveCard={async (cardId, to) => {
            try {
              await updateStatusMutation.mutateAsync({ id: cardId, status: to })
              return true
            } catch {
              return false
            }
          }}
        />
      )}
    </div>
  )
}
