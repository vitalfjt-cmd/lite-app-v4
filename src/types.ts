export type AppView = 'customer' | 'cust-tablet' | 'staff' | 'kds' | 'admin' | 'handy' | 'sales' | 'seats'

export type MenuCategory = {
  id: string
  name: string
}

export type MenuItem = {
  id: string
  categoryId: string
  name: string
  price: number
  soldOut?: boolean
  lead?: string
  toppings?: { id: string; name: string; price: number; is_sold_out: boolean }[]
}

export type TicketLine = {
  id: string
  itemName: string
  qty: number
  status: 'NEW' | 'COOKING' | 'SERVED'
  note?: string
  toppings?: { id: string; name: string; price: number }[]
}

export type TicketSummary = {
  ticketNo: string
  tableName: string
  orderedAt: string
  subtotal: number
  lineCount: number
}

export type StaffProfile = {
  id: string
  auth_user_id?: string | null
  email: string | null
  display_name: string
  role_type: 'ADMIN' | 'STAFF' | 'KDS'
  store_id: string
  is_active?: boolean
  password_configured?: boolean
}

export type LiveCategory = { id: string; name: string; sort_order: number; is_active: boolean; parent_category_id?: string | null }
export type LiveMenuBook = {
  id: string
  code: string
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
  available_from_time: string | null
  available_to_time: string | null
  valid_from: string | null
  valid_to: string | null
  time_limit_minutes: number | null
  last_order_offset_minutes: number | null
}
export type LiveMenuBookItem = { id: string; menu_book_id: string; menu_category_id: string; menu_item_id: string; sort_order: number; is_active: boolean }
export type LiveSubcategory = { id: string; name: string; sort_order: number; parent_category_id?: string | null; is_active: boolean }
export type LiveBookCategorySubcategory = {
  id: string
  menu_book_id: string
  menu_category_id: string
  menu_subcategory_id: string
  sort_order: number
  is_active: boolean
  toppings?: { id: string; name: string; price: number; is_sold_out: boolean }[]
}
export type LiveBookCategory = {
  id: string
  menu_book_id: string
  menu_category_id: string
  sort_order: number
  is_active: boolean
  toppings?: { id: string; name: string; price: number; is_sold_out: boolean }[]
}
export type LiveBookSubcategoryItem = {
  id: string
  menu_book_id: string
  menu_category_id: string
  menu_subcategory_id: string
  menu_item_id: string
  sort_order: number
  is_active: boolean
  display_name_override?: string | null
  description_override?: string | null
}
export type LiveMenuItem = {
  id: string
  code?: string | null
  category_id: string
  parent_category_id?: string | null
  name: string
  name_en?: string | null
  price: number
  tax_type?: 'INCLUDED' | 'EXCLUDED' | 'NONE'
  is_sold_out: boolean
  image_url?: string | null
  sort_order: number
  is_active: boolean
  toppings?: { id: string; name: string; name_en?: string | null; price: number; is_sold_out: boolean }[]
}
export type LiveStore = {
  id: string
  tenant_id: string
  name: string
  slug: string
  timezone: string
  business_date_offset_minutes: number
  payment_timing_mode: 'PREPAID' | 'POSTPAID'
  ticket_no_reset_mode: 'DAILY' | 'SEQUENCE'
  ticket_no_digits: number
  open_business_date?: string | null
  today_business_date?: string
}
export type LiveTableRef = { id: string; label: string; qr_token: string; group_name?: string | null; sort_order?: number; is_active: boolean }
export type LiveTicket = {
  id: string
  ticket_no: string
  table_ref_id: string
  table_label?: string | null
  menu_book_id: string | null
  customer_access_token: string
  customer_count?: number | null
  ordered_at: string
  status: 'OPEN' | 'CANCELLED' | 'CLOSED'
  receipt_no?: string | null
}
export type LivePaymentEntry = {
  id: string
  order_ticket_id: string
  payment_seq: number
  payment_type: string
  payment_type_label?: string | null
  discount_amount: number
  coupon_amount: number
  voucher_amount: number
  received_amount: number | null
  change_amount: number | null
  final_amount: number
  entry_status: 'ACTIVE' | 'VOIDED'
  memo: string | null
  paid_at: string
}
export type TicketSummaryView = {
  ticketId: string
  ticketNo: string
  tableName: string
  customerUrl?: string | null
  orderedAt: string
  subtotal: number
  lineCount: number
  customerCount?: number | null
  status: 'NEW' | 'COOKING' | 'SERVED'
  receiptNo?: string | null
}
export type ReceiptSummaryLine = { itemName: string; qty: number; subtotal: number }

export type LiveLine = {
  id: string
  order_ticket_id?: string
  item_id?: string
  item_name_snapshot: string
  quantity: number
  line_subtotal: number
  kds_status: 'NEW' | 'COOKING' | 'SERVED' | 'CANCELLED' | string
  customer_note: string | null
  created_at: string
  toppings?: { id: string; name: string; price: number }[]
}
export type LiveStaffUser = StaffProfile
export type CustomerCategory = { id: string; name: string; parentId?: string | null }
export type CustomerMenuItem = { id: string; categoryId: string; name: string; name_en?: string | null; price: number; soldOut: boolean; lead?: string; imageUrl?: string | null; toppings?: { id: string; name: string; name_en?: string | null; price: number; is_sold_out: boolean }[] }

export type StaffPrototypeTopCategory = { id: string; name: string }
export type StaffPrototypeSubCategory = { id: string; name: string; parentId: string; sortOrder: number }
export type StaffPrototypeItem = {
  id: string
  name: string
  price: number
  isActive: boolean
  isSoldOut: boolean
  subcategoryId: string
  toppings?: { id: string; name: string; price: number; is_sold_out: boolean }[]
}
export type ActiveStoreSummary = { name: string; tableName: string; ticketNo: string }

export type AdminPaymentMethod = {
  id: string
  name: string
  sort_order: number
  is_active: boolean
  is_change_allowed: boolean
  toppings?: { id: string; name: string; price: number; is_sold_out: boolean }[]
}
