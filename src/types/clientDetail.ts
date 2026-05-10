export interface ClientProfile {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string | null
  phone: string
  phone_secondary: string | null
  address: string | null
  landmark: string | null
  zip_code: string | null
  city: { id: number; name: string } | null
  state: { id: number; name: string } | null
  country: {
    id: number
    name: string
    code?: string
    iso2?: string
    emoji?: string | null
  } | null
  agency_id: number | null
  is_active: boolean
  is_client: boolean
  is_staff: boolean
  is_recipient: boolean
  address_book_count: number
  has_account: boolean
  locker_number: string | null
  has_shipments_as_sender?: boolean
  has_shipments_as_recipient?: boolean
  shipments_as_sender_count?: number
  shipments_as_recipient_count?: number
  created_at: string
}

export interface ClientShipmentRow {
  id: number
  public_tracking: string
  status: string
  status_label: string
  sender_profile_id: number
  recipient_profile_id: number
  sender_name?: string
  recipient_name?: string
  weight_kg: number
  declared_value: number
  currency: string
  created_at: string
  senderProfile?: { full_name: string }
  recipientProfile?: { full_name: string }
}

export interface ClientInvoiceRow {
  id: number
  invoice_number: string
  amount: number
  status: 'pending' | 'paid' | 'cancelled'
  created_at: string
  shipment_id?: number | null
}

export interface ClientAssistedPurchaseRow {
  id: number
  status: string
  status_label: string
  total_amount: number | null
  currency: string
  created_at: string
  converted_shipment_id: number | null
}

export interface ClientShipmentNoticeRow {
  id: number
  reference_code: string
  carrier_name: string
  tracking_number: string
  status: string
  status_label: string
  created_at: string
}

export interface ClientTimelineEvent {
  id: number
  type: string
  shipment_id: number
  tracking: string | null
  role: 'sender' | 'recipient'
  status: string
  title: string
  description: string | null
  user_name: string | null
  created_at: string
}

export interface ClientAddressBookEntry {
  id: number
  contact_profile_id?: number
  alias?: string
  is_default?: boolean
  contactProfile?: {
    id?: number
    full_name?: string
    email?: string
    phone?: string
  }
}

export interface ClientActivityData {
  client: ClientProfile
  sentShipments: { data: ClientShipmentRow[]; meta: { total: number } }
  receivedShipments: { data: ClientShipmentRow[]; meta: { total: number } }
  assistedPurchases: { data: ClientAssistedPurchaseRow[]; meta: { total: number } }
  shipmentNotices: { data: ClientShipmentNoticeRow[]; meta: { total: number } }
  invoices: { data: ClientInvoiceRow[]; meta: { total: number } }
  addressBookEntries: { data: ClientAddressBookEntry[]; meta: { total: number } }
  timeline: ClientTimelineEvent[]
}
