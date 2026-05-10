import GenericListPage from '@/pages/GenericListPage'
import { useAuthStore } from '@/stores/authStore'
import { usePublicBranding } from '@/hooks/useSettings'
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
      <AssistedPurchasesListPageTabs
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isStaff={isStaff}
      />

      {viewMode === 'list' ? (
        <GenericListPage
          title="Shopping Assisté"
          apiPath="/api/assisted-purchases"
          dataKey="purchases"
          columns={columns}
          createPath="/shopping-assiste/nouveau"
          createLabel="Nouvelle demande"
          logoUrl={branding?.logo_url ?? null}
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
