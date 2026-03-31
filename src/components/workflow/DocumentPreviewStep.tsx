import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText, Tag, Printer, Download, Eye, Loader2,
  CheckCircle, RefreshCw, AlertTriangle,
} from 'lucide-react'
import { fetchPdfBlob, printApiPdf, downloadApiPdf } from '@/lib/openPdf'
import { toast } from 'sonner'

interface DocumentPreviewStepProps {
  shipmentId: number
  trackingNumber: string
  onValidate: () => void
}

type DocTab = 'invoice' | 'label'

export function DocumentPreviewStep({ shipmentId, trackingNumber, onValidate }: DocumentPreviewStepProps) {
  const [activeTab, setActiveTab] = useState<DocTab>('invoice')
  const [invoiceBlobUrl, setInvoiceBlobUrl] = useState<string | null>(null)
  const [labelBlobUrl, setLabelBlobUrl] = useState<string | null>(null)
  const [loadingInvoice, setLoadingInvoice] = useState(false)
  const [loadingLabel, setLoadingLabel] = useState(false)
  const [errorInvoice, setErrorInvoice] = useState(false)
  const [errorLabel, setErrorLabel] = useState(false)
  const [invoiceReviewed, setInvoiceReviewed] = useState(false)
  const [labelReviewed, setLabelReviewed] = useState(false)

  const invoicePath = `/api/shipments/${shipmentId}/pdf/invoice`
  const labelPath = `/api/shipments/${shipmentId}/pdf/label`

  const loadDocument = useCallback(async (type: DocTab) => {
    if (type === 'invoice') {
      setLoadingInvoice(true)
      setErrorInvoice(false)
      try {
        const blob = await fetchPdfBlob(invoicePath)
        if (blob) {
          setInvoiceBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob) })
        } else {
          setErrorInvoice(true)
        }
      } catch {
        setErrorInvoice(true)
      } finally {
        setLoadingInvoice(false)
      }
    } else {
      setLoadingLabel(true)
      setErrorLabel(false)
      try {
        const blob = await fetchPdfBlob(labelPath)
        if (blob) {
          setLabelBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob) })
        } else {
          setErrorLabel(true)
        }
      } catch {
        setErrorLabel(true)
      } finally {
        setLoadingLabel(false)
      }
    }
  }, [invoicePath, labelPath])

  // Auto-load invoice on mount
  useEffect(() => {
    loadDocument('invoice')
    return () => {
      // Cleanup blob URLs on unmount
      setInvoiceBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
      setLabelBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load label when switching to that tab for the first time
  useEffect(() => {
    if (activeTab === 'label' && !labelBlobUrl && !loadingLabel && !errorLabel) {
      loadDocument('label')
    }
  }, [activeTab, labelBlobUrl, loadingLabel, errorLabel, loadDocument])

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

  const handleMarkReviewed = (type: DocTab) => {
    if (type === 'invoice') setInvoiceReviewed(true)
    else setLabelReviewed(true)
    toast.success(type === 'invoice' ? 'Facture vérifiée' : 'Étiquette vérifiée')
  }

  const bothReviewed = invoiceReviewed && labelReviewed

  const renderPdfViewer = (type: DocTab) => {
    const blobUrl = type === 'invoice' ? invoiceBlobUrl : labelBlobUrl
    const loading = type === 'invoice' ? loadingInvoice : loadingLabel
    const error = type === 'invoice' ? errorInvoice : errorLabel
    const reviewed = type === 'invoice' ? invoiceReviewed : labelReviewed

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
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
          <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => loadDocument(type)}>
            <RefreshCw size={14} /> Réessayer
          </Button>
        </div>
      )
    }

    if (!blobUrl) return null

    return (
      <div className="space-y-3">
        {/* Action bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {reviewed ? (
              <Badge className="bg-emerald-500 text-white gap-1">
                <CheckCircle size={12} /> Vérifié
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <Eye size={12} /> En attente de vérification
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handlePrint(type)}>
              <Printer size={14} /> Imprimer
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleDownload(type)}>
              <Download size={14} /> Télécharger
            </Button>
            {!reviewed && (
              <Button size="sm" className="gap-1.5" onClick={() => handleMarkReviewed(type)}>
                <CheckCircle size={14} /> Marquer vérifié
              </Button>
            )}
          </div>
        </div>

        {/* Embedded PDF viewer */}
        <div className="rounded-lg border bg-white overflow-hidden" style={{ height: '600px' }}>
          <iframe
            src={`${blobUrl}#toolbar=1&navpanes=0`}
            title={type === 'invoice' ? 'Prévisualisation facture' : 'Prévisualisation étiquette'}
            className="w-full h-full"
            style={{ border: 'none' }}
          />
        </div>
      </div>
    )
  }

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
            Vérifiez la facture et l'étiquette avant de passer à la caisse.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DocTab)}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="invoice" className="gap-2">
                <FileText size={14} />
                Facture
                {invoiceReviewed && <CheckCircle size={12} className="text-emerald-500" />}
              </TabsTrigger>
              <TabsTrigger value="label" className="gap-2">
                <Tag size={14} />
                Étiquette
                {labelReviewed && <CheckCircle size={12} className="text-emerald-500" />}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="invoice">{renderPdfViewer('invoice')}</TabsContent>
            <TabsContent value="label">{renderPdfViewer('label')}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Continue button */}
      <div className="flex justify-between items-center">
        <div>
          {!bothReviewed && (
            <p className="text-sm text-amber-600 flex items-center gap-1.5">
              <AlertTriangle size={14} />
              Veuillez vérifier les deux documents avant de continuer
            </p>
          )}
        </div>
        <Button
          onClick={onValidate}
          size="lg"
          className="gap-2"
          disabled={!bothReviewed}
        >
          <CheckCircle size={18} />
          Passer à la caisse
        </Button>
      </div>
    </div>
  )
}
