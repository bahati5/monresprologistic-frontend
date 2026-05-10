import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AssistedPurchasesListPageTabsProps {
  activeTab: 'active' | 'history'
  onActiveTabChange: (next: 'active' | 'history') => void
  viewMode: 'list' | 'kanban'
  onViewModeChange: (next: 'list' | 'kanban') => void
  isStaff: boolean
}

export function AssistedPurchasesListPageTabs({
  activeTab,
  onActiveTabChange,
  viewMode,
  onViewModeChange,
  isStaff,
}: AssistedPurchasesListPageTabsProps) {
  return (
    <>
      <Tabs value={activeTab} onValueChange={(v) => onActiveTabChange(v as 'active' | 'history')}>
        <TabsList>
          <TabsTrigger value="active">En cours</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as 'list' | 'kanban')}>
        <TabsList>
          <TabsTrigger value="list">Vue liste</TabsTrigger>
          <TabsTrigger value="kanban" disabled={!isStaff}>
            Vue Kanban
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </>
  )
}
