import { ShipmentDocumentDigitalFrame } from '@/components/shipments/ShipmentDocumentDigitalFrame'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TabsContent } from '@/components/ui/tabs'
import { downloadApiPdf } from '@/lib/openPdf'
import { ExternalLink, FileUp, Loader2, Download, Printer } from 'lucide-react'

export interface ShipmentDetailDocumentsProps {
  shipmentId: string | undefined
  trackingNumber: string | undefined
  hasSignedForm: boolean | undefined
  signedFormUrl: string | null
  formHtml: string | null
  invoiceHtml: string | null
  labelHtml: string | null
  docFetchState: { form: boolean; invoice: boolean; label: boolean }
  docDownloadKind: 'form' | 'invoice' | 'label' | null
  setDocDownloadKind: (v: 'form' | 'invoice' | 'label' | null) => void
  signedFormInputRef: React.RefObject<HTMLInputElement | null>
  archiveSignedPending: boolean
  onPrintForm: () => void
  onPrintInvoice: () => void
  onPrintLabel: () => void
}

export function ShipmentDetailDocuments({
  shipmentId,
  trackingNumber,
  hasSignedForm,
  signedFormUrl,
  formHtml,
  invoiceHtml,
  labelHtml,
  docFetchState,
  docDownloadKind,
  setDocDownloadKind,
  signedFormInputRef,
  archiveSignedPending,
  onPrintForm,
  onPrintInvoice,
  onPrintLabel,
}: ShipmentDetailDocumentsProps) {
  return (
    <>
      <TabsContent value="form" className="mt-4 space-y-3">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onPrintForm}>
                <Printer size={14} className="mr-1.5" />
                Imprimer
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!!docDownloadKind}
                onClick={async () => {
                  if (!shipmentId) return
                  setDocDownloadKind('form')
                  try {
                    await downloadApiPdf(
                      `/api/shipments/${shipmentId}/pdf/form`,
                      `formulaire-expedition-${trackingNumber || shipmentId}.pdf`,
                    )
                  } finally {
                    setDocDownloadKind(null)
                  }
                }}
              >
                {docDownloadKind === 'form' ? (
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                ) : (
                  <Download size={14} className="mr-1.5" />
                )}
                Télécharger
              </Button>
            </div>
            <div className="relative min-h-[320px] rounded-lg border bg-muted/10 overflow-hidden">
              {docFetchState.form && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {formHtml ? (
                <ShipmentDocumentDigitalFrame
                  html={formHtml}
                  title="Aperçu formulaire d'expédition"
                  heightClass="h-[min(70vh,720px)] min-h-[320px]"
                  className="border-0 shadow-none rounded-lg"
                />
              ) : (
                !docFetchState.form && (
                  <p className="p-8 text-center text-sm text-muted-foreground">
                    Impossible de charger l&apos;aperçu numérique.
                  </p>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="invoice" className="mt-4 space-y-3">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onPrintInvoice}>
                <Printer size={14} className="mr-1.5" />
                Imprimer
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!!docDownloadKind}
                onClick={async () => {
                  if (!shipmentId) return
                  setDocDownloadKind('invoice')
                  try {
                    await downloadApiPdf(
                      `/api/shipments/${shipmentId}/pdf/invoice`,
                      `facture-${trackingNumber || shipmentId}.pdf`,
                    )
                  } finally {
                    setDocDownloadKind(null)
                  }
                }}
              >
                {docDownloadKind === 'invoice' ? (
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                ) : (
                  <Download size={14} className="mr-1.5" />
                )}
                Télécharger
              </Button>
            </div>
            <div className="relative min-h-[320px] rounded-lg border bg-muted/10 overflow-hidden">
              {docFetchState.invoice && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {invoiceHtml ? (
                <ShipmentDocumentDigitalFrame
                  html={invoiceHtml}
                  title="Aperçu facture"
                  heightClass="h-[min(70vh,720px)] min-h-[320px]"
                  className="border-0 shadow-none rounded-lg"
                />
              ) : (
                !docFetchState.invoice && (
                  <p className="p-8 text-center text-sm text-muted-foreground">
                    Impossible de charger l&apos;aperçu numérique.
                  </p>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="label" className="mt-4 space-y-3">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onPrintLabel}>
                <Printer size={14} className="mr-1.5" />
                Imprimer
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!!docDownloadKind}
                onClick={async () => {
                  if (!shipmentId) return
                  setDocDownloadKind('label')
                  try {
                    await downloadApiPdf(
                      `/api/shipments/${shipmentId}/pdf/label`,
                      `etiquette-${trackingNumber || shipmentId}.pdf`,
                    )
                  } finally {
                    setDocDownloadKind(null)
                  }
                }}
              >
                {docDownloadKind === 'label' ? (
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                ) : (
                  <Download size={14} className="mr-1.5" />
                )}
                Télécharger
              </Button>
            </div>
            <div className="relative min-h-[320px] rounded-lg border bg-muted/10 overflow-hidden">
              {docFetchState.label && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {labelHtml ? (
                <ShipmentDocumentDigitalFrame
                  html={labelHtml}
                  title="Aperçu étiquette"
                  heightClass="h-[min(70vh,720px)] min-h-[320px]"
                  className="border-0 shadow-none rounded-lg"
                />
              ) : (
                !docFetchState.label && (
                  <p className="p-8 text-center text-sm text-muted-foreground">
                    Impossible de charger l&apos;aperçu numérique.
                  </p>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="signed-form" className="mt-4 space-y-3">
        <Card>
          <CardContent className="space-y-4 pt-6">
            {hasSignedForm && signedFormUrl ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a href={signedFormUrl} target="_blank" rel="noreferrer">
                      <ExternalLink size={14} className="mr-1.5" />
                      Ouvrir le fichier archivé
                    </a>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={archiveSignedPending}
                    onClick={() => signedFormInputRef.current?.click()}
                  >
                    {archiveSignedPending ? (
                      <Loader2 size={14} className="mr-1.5 animate-spin" />
                    ) : (
                      <FileUp size={14} className="mr-1.5" />
                    )}
                    Remplacer le document
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Le formulaire signé est archivé et lié à ce dossier pour consultation ultérieure.
                </p>
              </>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
                <p className="text-sm font-medium">Aucun formulaire signé archivé</p>
                <p className="text-sm text-muted-foreground">
                  Téléversez un PDF ou une photo du document signé pour marquer le dossier comme conforme.
                </p>
                <Button
                  type="button"
                  size="sm"
                  disabled={archiveSignedPending}
                  onClick={() => signedFormInputRef.current?.click()}
                >
                  {archiveSignedPending ? (
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                  ) : (
                    <FileUp size={14} className="mr-1.5" />
                  )}
                  Archiver un formulaire signé
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </>
  )
}
