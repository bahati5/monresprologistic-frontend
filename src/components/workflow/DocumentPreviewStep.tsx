import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  FileText, Tag, Printer, Download, Receipt,
  CheckCircle, RefreshCw, AlertTriangle, ExternalLink,
} from 'lucide-react'
import { printApiPdf, downloadApiPdf, openApiPdf } from '@/lib/openPdf'
import { fetchShipmentDocumentHtml, type ShipmentDocKind } from '@/lib/shipmentDocumentPreview'
import { ShipmentDocumentDigitalFrame } from '@/components/shipments/ShipmentDocumentDigitalFrame'
import { toast } from 'sonner'

interface DocumentPreviewStepProps {
  shipmentId: number
  trackingNumber: string
  onValidate: () => void
}

type DocTab = 'form' | 'invoice' | 'label'

const PDF_PATHS: Record<DocTab, string> = {
  form: 'pdf/form',
  invoice: 'pdf/invoice',
  label: 'pdf/label',
}

const TAB_LABELS: Record<DocTab, string> = {
  form: "Formulaire d'expédition",
  invoice: 'Facture',
  label: 'Étiquette',
}

const PRINT_LABELS: Record<DocTab, string> = {
  form: "Impression du formulaire d'expédition lancée",
  invoice: 'Impression de la facture lancée',
  label: "Impression de l'étiquette lancée",
}

const DOWNLOAD_NAMES: Record<DocTab, (t: string) => string> = {
  form: (t) => `formulaire-expedition-${t}.pdf`,
  invoice: (t) => `facture-${t}.pdf`,
  label: (t) => `etiquette-${t}.pdf`,
}

export function DocumentPreviewStep({ shipmentId, trackingNumber, onValidate }: DocumentPreviewStepProps) {
  const [activeTab, setActiveTab] = useState<DocTab>('form')

  const [formHtml, setFormHtml] = useState<string | null>(null)
  const [invoiceHtml, setInvoiceHtml] = useState<string | null>(null)
  const [labelHtml, setLabelHtml] = useState<string | null>(null)

  const [loadingForm, setLoadingForm] = useState(false)
  const [loadingInvoice, setLoadingInvoice] = useState(false)
  const [loadingLabel, setLoadingLabel] = useState(false)

  const [errorForm, setErrorForm] = useState(false)
  const [errorInvoice, setErrorInvoice] = useState(false)
  const [errorLabel, setErrorLabel] = useState(false)

  const [documentsAck, setDocumentsAck] = useState(false)

  const pdfPath = (tab: DocTab) => `/api/shipments/${shipmentId}/${PDF_PATHS[tab]}`

  const loadDocument = useCallback(async (type: DocTab) => {
    const setLoading = type === 'form' ? setLoadingForm : type === 'invoice' ? setLoadingInvoice : setLoadingLabel
    const setError = type === 'form' ? setErrorForm : type === 'invoice' ? setErrorInvoice : setErrorLabel
    const setHtml = type === 'form' ? setFormHtml : type === 'invoice' ? setInvoiceHtml : setLabelHtml
    const kind: ShipmentDocKind = type

    setLoading(true)
    setError(false)
    try {
      const html = await fetchShipmentDocumentHtml(shipmentId, kind, { suppressToast: true })
      if (html) setHtml(html)
      else setError(true)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [shipmentId])

  useEffect(() => {
    void loadDocument('form')
    void loadDocument('invoice')
    void loadDocument('label')
  }, [loadDocument])

  const handlePrint = async (type: DocTab) => {
    await printApiPdf(pdfPath(type))
    toast.success(PRINT_LABELS[type])
  }

  const handleDownload = async (type: DocTab) => {
    await downloadApiPdf(pdfPath(type), DOWNLOAD_NAMES[type](trackingNumber))
  }

  const handleOpenPdf = async (type: DocTab) => {
    await openApiPdf(pdfPath(type))
  }

  const formulaireReady =
    !loadingForm &&
    (Boolean(formHtml?.trim()) || (errorForm && !formHtml?.trim()))

  const canProceed = formulaireReady && documentsAck

  const renderDigitalViewer = (type: DocTab) => {
    const html = type === 'form' ? formHtml : type === 'invoice' ? invoiceHtml : labelHtml
    const loading = type === 'form' ? loadingForm : type === 'invoice' ? loadingInvoice : loadingLabel
    const error = type === 'form' ? errorForm : type === 'invoice' ? errorInvoice : errorLabel

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="mt-3 text-sm text-muted-foreground">
            Chargement du document…
          </p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
          <p className="mt-3 text-sm text-muted-foreground">
            Impossible de charger l&apos;aperçu HTML
          </p>
          <p className="mt-1 text-xs text-muted-foreground text-center max-w-md">
            Vous pouvez ouvrir ou imprimer le PDF directement.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => void loadDocument(type)}>
              <RefreshCw size={14} /> Réessayer
            </Button>
            <Button variant="default" size="sm" className="gap-2" onClick={() => void handleOpenPdf(type)}>
              <ExternalLink size={14} /> Ouvrir le PDF
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => void handlePrint(type)}>
              <Printer size={14} /> Imprimer (PDF)
            </Button>
          </div>
        </div>
      )
    }

    if (!html) return null

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void handleOpenPdf(type)}>
            <ExternalLink size={14} /> Ouvrir le PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void handlePrint(type)}>
            <Printer size={14} /> Imprimer
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void handleDownload(type)}>
            <Download size={14} /> Télécharger PDF
          </Button>
        </div>

        <ShipmentDocumentDigitalFrame
          html={html}
          title={`${TAB_LABELS[type]} (aperçu)`}
          heightClass="h-[600px] min-h-[320px]"
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText size={20} /> Documents de l&apos;expédition
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Expédition <span className="font-mono font-semibold">{trackingNumber}</span>
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Vérifiez le formulaire d&apos;expédition (à imprimer pour signature client), la facture et l&apos;étiquette.
          </p>
        </CardHeader>
        <CardContent>
          {formulaireReady && errorLabel && !loadingLabel ? (
            <Alert className="mb-4 border-amber-200 bg-amber-50/80 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle>Étiquette</AlertTitle>
              <AlertDescription>
                L&apos;aperçu de l&apos;étiquette n&apos;a pas pu être chargé. Le formulaire d&apos;expédition est disponible ; vous pouvez réessayer l&apos;étiquette ou l&apos;ouvrir en PDF depuis l&apos;onglet « Étiquette ».
              </AlertDescription>
            </Alert>
          ) : null}

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DocTab)}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="form" className="gap-2">
                <FileText size={14} />
                Formulaire
              </TabsTrigger>
              <TabsTrigger value="invoice" className="gap-2">
                <Receipt size={14} />
                Facture
              </TabsTrigger>
              <TabsTrigger value="label" className="gap-2">
                <Tag size={14} />
                Étiquette
              </TabsTrigger>
            </TabsList>
            <TabsContent value="form" forceMount className="data-[state=inactive]:hidden">
              {renderDigitalViewer('form')}
            </TabsContent>
            <TabsContent value="invoice" forceMount className="data-[state=inactive]:hidden">
              {renderDigitalViewer('invoice')}
            </TabsContent>
            <TabsContent value="label" forceMount className="data-[state=inactive]:hidden">
              {renderDigitalViewer('label')}
            </TabsContent>
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
            disabled={!formulaireReady}
            onChange={(e) => setDocumentsAck(e.target.checked)}
          />
          <Label htmlFor="docs-ack" className="text-sm font-normal leading-snug cursor-pointer">
            J&apos;ai relu le formulaire d&apos;expédition et les informations sont correctes.
          </Label>
        </div>
        <Button
          onClick={onValidate}
          size="lg"
          className="gap-2 shrink-0"
          disabled={!canProceed}
        >
          <CheckCircle size={18} />
          Passer à la caisse
        </Button>
      </div>
    </div>
  )
}
