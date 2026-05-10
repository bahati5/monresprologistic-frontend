import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import CommentThread from '@/components/comments/CommentThread'

interface PurchaseDetailCommentsCardProps {
  purchaseId: number
}

export function PurchaseDetailCommentsCard({ purchaseId }: PurchaseDetailCommentsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Commentaires</CardTitle>
        <CardDescription>Échangez avec l’équipe sur cette demande.</CardDescription>
      </CardHeader>
      <CardContent>
        <CommentThread commentableType="assisted_purchase" commentableId={purchaseId} />
      </CardContent>
    </Card>
  )
}
