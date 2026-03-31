/* ── React Query hooks for Finance API ── */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { toast } from 'sonner'
import type { FinanceDashboardData, Invoice, PaymentProof, Wallet, LedgerEntry } from '@/types/finance'
import type { PaginatedData } from '@/types'

export function useFinanceDashboard() {
  return useQuery<FinanceDashboardData>({
    queryKey: ['finance', 'dashboard'],
    queryFn: () => api.get('/api/finance/dashboard').then(r => r.data),
  })
}

export function useInvoices(params: Record<string, any> = {}) {
  return useQuery<PaginatedData<Invoice>>({
    queryKey: ['finance', 'invoices', params],
    queryFn: () => api.get('/api/finance/invoices', { params }).then(r => r.data?.invoices ?? r.data),
  })
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, any>) =>
      api.post('/api/finance/invoices', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      toast.success('Facture creee')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function usePaymentProofs(params: Record<string, any> = {}) {
  return useQuery<PaginatedData<PaymentProof>>({
    queryKey: ['finance', 'payment-proofs', params],
    queryFn: () => api.get('/api/finance/payment-proofs', { params }).then(r => r.data?.payment_proofs ?? r.data),
  })
}

export function useSubmitPaymentProof() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: FormData) =>
      api.post('/api/finance/payment-proofs', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payment-proofs'] })
      toast.success('Preuve de paiement soumise')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useApprovePaymentProof() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.post(`/api/finance/payment-proofs/${id}/approve`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payment-proofs'] })
      toast.success('Paiement approuve')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useRejectPaymentProof() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.post(`/api/finance/payment-proofs/${id}/reject`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payment-proofs'] })
      toast.success('Paiement rejete')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useWallets(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['finance', 'wallets', params],
    queryFn: () => api.get('/api/finance/wallets', { params }).then(r => r.data),
  })
}

export function useDepositWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { client_id: number; amount: number; note?: string }) =>
      api.post('/api/finance/wallets/deposit', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'wallets'] })
      toast.success('Depot effectue')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useLedger(params: Record<string, any> = {}) {
  return useQuery<LedgerEntry[]>({
    queryKey: ['finance', 'ledger', params],
    queryFn: () => api.get('/api/finance/ledger', { params }).then(r => r.data?.entries ?? r.data),
  })
}
