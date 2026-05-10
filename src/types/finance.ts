/* ── Finance entity types ── */

export interface Invoice {
  id: number
  reference: string
  client_id: number
  client?: { id: number; name: string; email: string }
  invoiceable_type: string
  invoiceable_id: number
  subtotal: number
  tax_total: number
  total: number
  amount_paid: number
  balance_due: number
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled'
  due_date: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
}

export interface PaymentProof {
  id: number
  client_id: number
  client?: { id: number; name: string; email: string }
  amount: number
  method: string
  reference: string | null
  proof_url: string | null
  notes: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface LedgerEntry {
  id: number
  type: 'credit' | 'debit'
  amount: number
  description: string
  reference_type: string | null
  reference_id: number | null
  client_id: number | null
  client_name: string | null
  created_at: string
}

export interface FinanceDashboardData {
  revenue_this_month: number
  revenue_last_month: number
  revenue_trend: number
  total_receivable: number
  total_paid: number
  pending_proofs: number
  monthly_revenue: Array<{ month: string; amount: number }>
  revenue_by_type: Array<{ type: string; amount: number }>
}
