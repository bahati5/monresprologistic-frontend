import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import api from '@/api/client'
import { AssistedShoppingForm, type AssistedShoppingFormValues } from '@/components/AssistedShoppingForm'
import { useAuthStore } from '@/stores/authStore'

const STAFF_ROLES = ['super_admin', 'agency_admin', 'operator'] as const

export default function AssistedShoppingNewPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isStaff = Boolean(user?.roles?.some((r) => STAFF_ROLES.includes(r as (typeof STAFF_ROLES)[number])))

  const onSubmit = async (data: AssistedShoppingFormValues) => {
    setIsSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        notes: data.notes?.trim() || undefined,
        items: data.items.map((it) => ({
          url: it.url.trim(),
          // Toujours envoyer une chaîne : sinon JSON.stringify retire `undefined` et Laravel ne reçoit pas la clé `name`.
          name: (it.name ?? '').trim(),
          options: it.options?.trim() || undefined,
          quantity: it.quantity,
          ...(it.merchant_id != null && Number.isFinite(it.merchant_id) ? { merchant_id: it.merchant_id } : {}),
        })),
      }
      if (isStaff && data.user_id != null && Number.isFinite(data.user_id)) {
        payload.user_id = data.user_id
      }

      await api.post('/api/assisted-purchases', payload)
      toast.success(
        data.items.length > 1
          ? `Demande de ${data.items.length} articles envoyée. Notre équipe vous contactera.`
          : 'Demande envoyée. Notre équipe vous contactera.'
      )
      navigate('/purchase-orders')
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(msg || 'Impossible d’envoyer la demande.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <AssistedShoppingForm onSubmit={onSubmit} isSubmitting={isSubmitting} isStaff={isStaff} />
}
