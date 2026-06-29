import GenericListPage from '@/pages/GenericListPage'
import { displayLocalized } from '@/lib/localizedString'
import { useAuthStore } from '@/stores/authStore'
import { notificationDetailHref } from '@/lib/notificationNavigation'

type ListRow = Record<string, unknown>

export default function NotificationsListPage() {
  const { user } = useAuthStore()

  return (
    <GenericListPage
      title="Notifications"
      apiPath="/api/notifications"
      dataKey="notifications"
      columns={[
        {
          key: 'title',
          label: 'Titre',
          render: (r: ListRow) => {
            const data = r.data
            const dataTitle =
              data && typeof data === 'object' && data !== null && 'title' in data
                ? (data as { title?: unknown }).title
                : undefined
            const fallback = r.title
            return displayLocalized(dataTitle ?? fallback)
          },
        },
        {
          key: 'read_at',
          label: 'Lu',
          render: (r: ListRow) => (r.read_at ? 'Oui' : 'Non'),
        },
        {
          key: 'created_at',
          label: 'Date',
          render: (r: ListRow) => {
            const d = r.created_at
            return typeof d === 'string' ? new Date(d).toLocaleDateString('fr-FR') : '—'
          },
        },
      ]}
      detailPath={(row) => notificationDetailHref(row as Record<string, unknown>, user)}
    />
  )
}
