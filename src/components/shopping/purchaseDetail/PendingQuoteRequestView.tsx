import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { MerchantLogoBadge } from '@/components/shopping/MerchantLogoBadge'
import type { PendingQuoteRow } from '@/components/shopping/purchaseDetail/pendingQuoteRows'

interface PendingQuoteRequestViewProps {
  rows: PendingQuoteRow[]
  onBack: () => void
}

export function PendingQuoteRequestView({ rows, onBack }: PendingQuoteRequestViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" className="gap-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Retour
        </Button>
      </div>
      <Alert>
        <AlertTitle>Chiffrage en cours</AlertTitle>
        <AlertDescription>
          Notre équipe établit votre devis à partir des liens et quantités fournis. Vous recevrez un e-mail et une
          notification dès qu’il sera disponible.
        </AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Articles demandés</CardTitle>
          <CardDescription>Récapitulatif de votre demande</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex flex-col gap-2 rounded-lg border border-border/80 bg-muted/20 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <MerchantLogoBadge
                  size="lg"
                  logoUrl={row.merchant?.logo_url}
                  merchantName={row.merchant?.name}
                />
                <div className="min-w-0">
                  <p className="font-medium leading-snug">{row.label}</p>
                  <p className="text-sm text-muted-foreground">Quantité : {row.qty}</p>
                </div>
              </div>
              {row.url ? (
                <Button variant="outline" size="sm" className="shrink-0 self-start" asChild>
                  <a href={row.url} target="_blank" rel="noopener noreferrer">
                    Voir le lien
                  </a>
                </Button>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
