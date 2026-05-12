export type SavTicketStatus = 'open' | 'in_progress' | 'waiting_client' | 'escalated' | 'resolved' | 'closed' | 'cancelled'
export type SavTicketPriority = 'urgent' | 'normal' | 'low'
export type SavTicketChannel = 'portal' | 'email' | 'whatsapp' | 'telephone' | 'auto'

export interface SavTicket {
  id: number
  uuid: string
  reference_code: string
  agency_id: number
  client_id: number | null
  assigned_to: number | null
  created_by: number | null
  category: string
  priority: SavTicketPriority
  status: SavTicketStatus
  channel: SavTicketChannel
  subject: string
  description: string | null
  related_type: string | null
  related_id: number | null
  first_response_at: string | null
  resolved_at: string | null
  closed_at: string | null
  escalated_at: string | null
  sla_deadline_at: string | null
  zendesk_ticket_id: string | null
  attachments: string[] | null
  meta: Record<string, unknown> | null
  created_at: string
  updated_at: string
  status_label: string
  status_color: string
  priority_label: string
  priority_color: string
  category_label: string
  sla_remaining_minutes: number | null
  client?: { id: number; name: string; email?: string; phone?: string }
  assignee?: { id: number; name: string }
  creator?: { id: number; name: string }
  messages?: SavTicketMessage[]
  related?: Record<string, unknown>
}

export interface SavTicketMessage {
  id: number
  uuid: string
  ticket_id: number
  user_id: number | null
  body: string
  is_internal: boolean
  channel: string
  attachments: string[] | null
  created_at: string
  user?: { id: number; name: string }
}

export interface SavQuickReply {
  id: number
  uuid: string
  title: string
  body: string
  category: string | null
  sort_order: number
  is_active: boolean
}

export interface SavEnumOption {
  value: string
  label: string
}

export interface SavTicketListResponse {
  tickets: {
    data: SavTicket[]
    current_page: number
    last_page: number
    total: number
  }
  counts_by_status: Record<string, number>
  categories: SavEnumOption[]
  priorities: SavEnumOption[]
  statuses: SavEnumOption[]
}

export interface SavAnalytics {
  kpis: {
    total_created: number
    resolved: number
    resolved_rate: number
    sla_rate: number
    avg_resolution_hours: number
  }
  by_category: Array<{ category: string; count: number }>
  by_channel: Array<{ channel: string; count: number }>
  by_priority: Array<{ priority: string; count: number }>
  by_agent: Array<{ agent_name: string; total: number; resolved: number; avg_hours: number }>
}
