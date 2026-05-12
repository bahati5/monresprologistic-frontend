import { useState } from 'react'
import { z } from 'zod'
import {
  ShoppingBag,
  Send,
  CheckCircle2,
  Plus,
  Trash2,
  Loader2,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react'
import api from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

const PHONE_REGEX = /^(\+?\d{1,4}[\s-]?)?\(?\d{1,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,5}$/

const publicFormSchema = z.object({
  full_name: z.string().min(2, 'Minimum 2 caractères'),
  email: z.string().email('Format email invalide'),
  phone: z.string().regex(PHONE_REGEX, 'Numéro de téléphone invalide'),
  links: z.array(z.string().url('URL invalide')).min(1, 'Ajoutez au moins 1 lien produit'),
  note: z.string().max(500).optional().default(''),
  consent: z.boolean().refine((v) => v === true, { message: 'Consentement requis' }),
})

type PublicFormData = z.infer<typeof publicFormSchema>

interface LinkPreview {
  url: string
  name: string | null
  price: string | null
  status: 'idle' | 'loading' | 'success' | 'error'
}

function useLinkPreviews() {
  const [previews, setPreviews] = useState<LinkPreview[]>([{ url: '', name: null, price: null, status: 'idle' }])

  const addLink = () => {
    setPreviews((p) => [...p, { url: '', name: null, price: null, status: 'idle' }])
  }

  const removeLink = (index: number) => {
    if (previews.length <= 1) return
    setPreviews((p) => p.filter((_, i) => i !== index))
  }

  const updateUrl = (index: number, url: string) => {
    setPreviews((p) => p.map((item, i) => (i === index ? { ...item, url, name: null, price: null, status: 'idle' } : item)))
  }

  const extractProduct = async (index: number) => {
    const url = previews[index]?.url?.trim()
    if (!url) return
    try {
      new URL(url)
    } catch {
      return
    }

    setPreviews((p) => p.map((item, i) => (i === index ? { ...item, status: 'loading' as const } : item)))
    try {
      const { data } = await api.post<{ name?: string; price?: number; currency?: string }>(
        '/api/assisted-purchases/extract-product',
        { url },
      )
      setPreviews((p) =>
        p.map((item, i) =>
          i === index
            ? {
                ...item,
                name: data.name ?? null,
                price: data.price != null && data.currency ? `${data.currency} ${data.price}` : null,
                status: 'success' as const,
              }
            : item,
        ),
      )
    } catch {
      setPreviews((p) => p.map((item, i) => (i === index ? { ...item, status: 'error' as const } : item)))
    }
  }

  return { previews, addLink, removeLink, updateUrl, extractProduct }
}

function ConfirmationView({ reference }: { reference: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#073763]/5 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-semibold text-[#073763]">Demande reçue</h1>
        <div className="bg-white rounded-xl border p-6 text-left space-y-3 shadow-sm">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Référence</p>
            <p className="text-lg font-semibold text-[#073763] mt-0.5">{reference}</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nous préparons votre devis. Vous le recevrez dans les 24h par email et sur votre WhatsApp.
          </p>
          <p className="text-xs text-muted-foreground">
            Pour toute question : <a href="mailto:info@monrespro.cd" className="text-[#0b5394] underline">info@monrespro.cd</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AssistedPurchasePublicPage() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    note: '',
    consent: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedRef, setSubmittedRef] = useState<string | null>(null)
  const { previews, addLink, removeLink, updateUrl, extractProduct } = useLinkPreviews()

  const validLinks = previews.filter((p) => {
    try {
      new URL(p.url.trim())
      return true
    } catch {
      return false
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const payload = {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      links: validLinks.map((p) => p.url.trim()),
      note: form.note,
      consent: form.consent,
    }

    const result = publicFormSchema.safeParse(payload)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const path = issue.path.join('.')
        if (!fieldErrors[path]) fieldErrors[path] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const { data } = await api.post<{ reference: string }>('/api/assisted-purchases/public', {
        full_name: result.data.full_name,
        email: result.data.email,
        phone: result.data.phone,
        links: result.data.links,
        note: result.data.note,
      })
      setSubmittedRef(data.reference)
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Erreur lors de l\'envoi')
          : 'Erreur réseau'
      setErrors({ _global: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submittedRef) {
    return <ConfirmationView reference={submittedRef} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#073763]/5 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-[#073763] to-[#0b5394] rounded-xl p-6 text-white shadow-md mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-light">Demande de devis — achat assisté</h1>
              <p className="text-white/70 text-sm mt-0.5">
                Collez vos liens, on s'occupe du reste.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Vos coordonnées</h2>

            <div className="space-y-1.5">
              <Label htmlFor="full_name">Prénom et nom *</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Jean-Paul Muamba"
                className={errors.full_name ? 'border-destructive' : ''}
              />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="jean@example.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Téléphone / WhatsApp *</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+243 XX XXX XXXX"
                className={errors.phone ? 'border-destructive' : ''}
              />
              <p className="text-[11px] text-muted-foreground">Nous enverrons votre devis sur ce numéro</p>
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Vos liens produits</h2>
            <p className="text-xs text-muted-foreground -mt-2">
              Collez vos liens ci-dessous (un par champ)
            </p>

            <div className="space-y-3">
              {previews.map((preview, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex gap-2">
                    <Input
                      value={preview.url}
                      onChange={(e) => updateUrl(index, e.target.value)}
                      onBlur={() => {
                        if (preview.url.trim() && preview.status === 'idle') extractProduct(index)
                      }}
                      placeholder="https://www.amazon.fr/dp/..."
                      className="flex-1"
                    />
                    {previews.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="shrink-0 h-9 w-9 text-destructive/60 hover:text-destructive" onClick={() => removeLink(index)}>
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                  {preview.status === 'loading' && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 size={12} className="animate-spin" /> Extraction en cours...
                    </div>
                  )}
                  {preview.status === 'success' && preview.name && (
                    <div className="flex items-center gap-1.5 text-xs text-green-600">
                      <CheckCircle2 size={12} />
                      <span className="font-medium">{preview.name}</span>
                      {preview.price && <Badge variant="outline" className="text-[10px] ml-1">{preview.price}</Badge>}
                    </div>
                  )}
                  {preview.status === 'error' && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600">
                      <AlertTriangle size={12} />
                      Lien ajouté — notre équipe vérifiera le produit
                    </div>
                  )}
                </div>
              ))}
            </div>

            {errors.links && <p className="text-xs text-destructive">{errors.links}</p>}

            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addLink}>
              <Plus size={14} /> Ajouter un lien
            </Button>
          </div>

          <div className="bg-white rounded-xl border p-5 shadow-sm space-y-3">
            <Label htmlFor="note">Note (optionnel)</Label>
            <Textarea
              id="note"
              rows={3}
              maxLength={500}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="La Nike en taille 42 blanc. Si indispo, le noir convient."
              className="resize-y text-sm"
            />
            <p className="text-[11px] text-muted-foreground text-right">{form.note.length}/500</p>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="consent"
              checked={form.consent}
              onCheckedChange={(v) => setForm((f) => ({ ...f, consent: Boolean(v) }))}
              className="mt-0.5"
            />
            <Label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              J'accepte d'être contacté(e) par Monrespro pour ce devis
            </Label>
          </div>
          {errors.consent && <p className="text-xs text-destructive -mt-2">{errors.consent}</p>}
          {errors._global && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {errors._global}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || !form.consent || validLinks.length === 0}
            className="w-full h-12 text-sm font-semibold bg-[#073763] hover:bg-[#0b5394] text-white shadow-md gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Envoi en cours...
              </>
            ) : (
              <>
                <Send size={16} /> Envoyer ma demande
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Vous recevrez un devis sous 24h par email et WhatsApp.
          </p>
        </form>
      </div>
    </div>
  )
}
