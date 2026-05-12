import type { ReactNode } from 'react'
import { z } from 'zod'

export type AssistedShoppingMerchantOption = {
  id: number
  name: string
  domains: string[] | null
  logo_url?: string | null
}

export const articleLineSchema = z.object({
  url: z
    .string()
    .min(1, 'Le lien vers l’article est requis.')
    .url({ message: 'Saisissez une URL valide (ex. https://…).' }),
  name: z.preprocess(
    (v) => (typeof v === 'string' ? v : ''),
    z.string().max(255),
  ),
  options: z.string().optional().default(''),
  quantity: z.coerce.number().int('Nombre entier uniquement.').min(1, 'La quantité minimale est 1.'),
  merchant_id: z.number().int().positive().optional(),
})

export function buildAssistedShoppingSchema(isStaff: boolean) {
  return z
    .object({
      user_id: z.number().int().positive().optional(),
      items: z.array(articleLineSchema).min(1, 'Ajoutez au moins un article.'),
      notes: z.string().optional().default(''),
    })
    .superRefine((data, ctx) => {
      if (isStaff && (data.user_id == null || !Number.isFinite(data.user_id))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Recherchez et sélectionnez le client pour le compte duquel cette demande est créée.',
          path: ['user_id'],
        })
      }
    })
}

export type AssistedShoppingFormValues = z.infer<ReturnType<typeof buildAssistedShoppingSchema>>

export function defaultArticle(): AssistedShoppingFormValues['items'][number] {
  return {
    url: '',
    name: '',
    options: '',
    quantity: 1,
    merchant_id: undefined,
  }
}

export type AssistedShoppingFormProps = {
  onSubmit?: (data: AssistedShoppingFormValues) => void | Promise<void>
  isSubmitting?: boolean
  className?: string
  isStaff?: boolean
  initialValues?: AssistedShoppingFormValues
  onValuesChange?: (values: AssistedShoppingFormValues) => void
  headerSlot?: ReactNode
  actionsSlot?: ReactNode
  /** Masque la bannière bleue (ex. page staff avec titre dans le layout parent). */
  hideHeader?: boolean
}

export type WizardClientSearchRow = {
  id: number
  user_id?: number | null
  name?: string
  email?: string
  phone?: string | null
  locker_code?: string | null
  has_portal?: boolean
}

export type ExtractionState = 'idle' | 'running' | 'done' | 'error'

export type ExtractedProduct = {
  name?: string | null
  merchant?: string | null
  currency?: string | null
  price?: number | null
  success?: boolean
}
