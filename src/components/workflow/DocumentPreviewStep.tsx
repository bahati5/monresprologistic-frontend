import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import {
  FileText, Tag, Printer, Download,
  CheckCircle, RefreshCw, AlertTriangle,
} from 'lucide-react'
import { printApiPdf, downloadApiPdf } from '@/lib/openPdf'
import { fetchShipmentDocumentHtml } from '@/lib/shipmentDocumentPreview'
import { ShipmentDocumentDigitalFrame } from '@/components/shipments/ShipmentDocumentDigitalFrame'
import { toast } from 'sonner'

interface DocumentPreviewStepProps {
  shipmentId: number
  trackingNumber: string
  onValidate: () => void
}

type DocTab = 'invoice' | 'label'

export function DocumentPreviewStep({ shipmentId, trackingNumber, onValidate }: DocumentPreviewStepProps) {
  const [activeTab, setActiveTab] = useState<DocTab>('invoice')
  const [invoiceHtml, setInvoiceHtml] = useState<string | null>(null)
  const [labelHtml, setLabelHtml] = useState<string | null>(null)
  const [loadingInvoice, setLoadingInvoice] = useState(false)
  const [loadingLabel, setLoadingLabel] = useState(false)
  const [errorInvoice, setErrorInvoice] = useState(false)
  const [errorLabel, setErrorLabel] = useState(false)
  const [documentsAck, setDocumentsAck] = useState(false)

  const invoicePath = `/api/shipments/${shipmentId}/pdf/invoice`
  const labelPath = `/api/shipments/${shipmentId}/pdf/label`

  const loadDocument = useCallback(async (type: DocTab) => {
    if (type === 'invoice') {
      setLoadingInvoice(true)
      setErrorInvoice(false)
      try {
        const html = await fetchShipmentDocumentHtml(shipmentId, 'invoice', { suppressToast: true })
        if (html) setInvoiceHtml(html)
        else setErrorInvoice(true)
      } catch {
        setErrorInvoice(true)
      } finally {
        setLoadingInvoice(false)
      }
    } else {
      setLoadingLabel(true)
      setErrorLabel(false)
      try {
        const html = await fetchShipmentDocumentHtml(shipmentId, 'label', { suppressToast: true })
        if (html) setLabelHtml(html)
        else setErrorLabel(true)
      } catch {
        setErrorLabel(true)
      } finally {
        setLoadingLabel(false)
      }
    }
  }, [shipmentId])

  useEffect(() => {
    void loadDocument('invoice')
    void loadDocument('label')
  }, [loadDocument])

  const handlePrint = async (type: DocTab) => {
    const path = type === 'invoice' ? invoicePath : labelPath
    await printApiPdf(path)
    toast.success(type === 'invoice' ? 'Impression facture lancée' : 'Impression étiquette lancée')
  }

  const handleDownload = async (type: DocTab) => {
    const path = type === 'invoice' ? invoicePath : labelPath
    const filename = type === 'invoice'
      ? `facture-${trackingNumber}.pdf`
      : `etiquette-${trackingNumber}.pdf`
    await downloadApiPdf(path, filename)
  }

  const renderDigitalViewer = (type: DocTab) => {
    const html = type === 'invoice' ? invoiceHtml : labelHtml
    const loading = type === 'invoice' ? loadingInvoice : loadingLabel
    const error = type === 'invoice' ? errorInvoice : errorLabel

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="mt-3 text-sm text-muted-foreground">
            Chargement du document...
          </p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
          <p className="mt-3 text-sm text-muted-foreground">
            Impossible de charger le document
          </p>
          <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => void loadDocument(type)}>
            <RefreshCw size={14} /> Réessayer
          </Button>
        </div>
      )
    }

    if (!html) return null

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {type === 'invoice' ? (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void handlePrint(type)}>
              <Printer size={14} /> Imprimer
            </Button>
          ) : null}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void handleDownload(type)}>
            <Download size={14} /> Télécharger PDF
          </Button>
        </div>

        <ShipmentDocumentDigitalFrame
          html={html}
          title={type === 'invoice' ? 'Prévisualisation facture' : 'Prévisualisation étiquette'}
          heightClass="h-[600px] min-h-[320px]"
        />
      </div>
    )
  }

  const docsReady =
    !loadingInvoice &&
    !errorInvoice &&
    invoiceHtml &&
    !loadingLabel &&
    !errorLabel &&
    labelHtml

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText size={20} /> Prévisualisation des documents
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Expédition <span className="font-mono font-semibold">{trackingNumber}</span>
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Aperçu numérique (HTML). L’impression et le téléchargement génèrent un PDF.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DocTab)}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="invoice" className="gap-2">
                <FileText size={14} />
                Facture
              </TabsTrigger>
              <TabsTrigger value="label" className="gap-2">
                <Tag size={14} />
                Étiquette
              </TabsTrigger>
            </TabsList>
            <TabsContent value="invoice">{renderDigitalViewer('invoice')}</TabsContent>
            <TabsContent value="label">{renderDigitalViewer('label')}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <input
            id="docs-ack"
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 rounded border-input"
            checked={documentsAck}
            disabled={!docsReady}
            onChange={(e) => setDocumentsAck(e.target.checked)}
          />
          <Label htmlFor="docs-ack" className="text-sm font-normal leading-snug cursor-pointer">
            J’ai relu la facture et l’étiquette (onglets ci-dessus).
          </Label>
        </div>
        <Button
          onClick={onValidate}
          size="lg"
          className="gap-2 shrink-0"
          disabled={!docsReady || !documentsAck}
        >
          <CheckCircle size={18} />
          Passer à la caisse
        </Button>
      </div>
    </div>
  )
}
