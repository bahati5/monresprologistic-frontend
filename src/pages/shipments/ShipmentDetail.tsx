import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ShipmentDetail() {
  const { id } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['shipment', id],
    queryFn: () => api.get(`/api/shipments/${id}`).then((r) => r.data),
  })

  if (isLoading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <Card key={i} className="animate-pulse h-32" />)}</div>
  }

  const s = data?.shipment || data || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expedition #{s.tracking_number}</h1>
          <p className="text-muted-foreground">Creee le {s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : '-'}</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-medium">
          {s.status?.name || '-'}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Expediteur</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{s.sender?.name || '-'}</p>
            <p className="text-muted-foreground">{s.sender?.email}</p>
            <p className="text-muted-foreground">{s.sender?.phone}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Destinataire</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{s.recipient?.name || '-'}</p>
            <p className="text-muted-foreground">{s.recipient?.email}</p>
            <p className="text-muted-foreground">{s.recipient?.phone}</p>
          </CardContent>
        </Card>
      </div>

      {s.items && s.items.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Articles</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Description</th>
                  <th className="py-2 text-right">Qte</th>
                  <th className="py-2 text-right">Poids (kg)</th>
                  <th className="py-2 text-right">Valeur</th>
                </tr>
              </thead>
              <tbody>
                {s.items.map((item: any, i: number) => (
                  <tr key={i} className="border-b">
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">{item.weight_kg}</td>
                    <td className="py-2 text-right">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {s.logs && s.logs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Historique</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {s.logs.map((log: any, i: number) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium">{log.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
