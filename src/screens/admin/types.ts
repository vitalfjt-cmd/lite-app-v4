
export type AdminMenuBook = {
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
  time_limit_minutes?: number | null
  last_order_offset_minutes?: number | null
}

export type AdminCategory = {
  id: string
  code?: string | null
  name: string
  sort_order?: number
  parent_category_id?: string | null
}

export type AdminMenuItem = {
  id: string
  code?: string | null
  category_id: string
  name: string
  price: number
  tax_type?: 'INCLUDED' | 'EXCLUDED' | 'NONE'
  tax_rate_type?: 'STANDARD' | 'REDUCED' | 'NONE'
  image_url?: string | null
  sort_order: number
  is_active: boolean
  is_sold_out: boolean
  toppings?: { id: string; name: string; price: number; is_sold_out: boolean }[]
  logical_printer_ids?: string[]
}

export type AdminPlacementRow = {
  id: string
  menuBookId: string
  menuBookName: string
  topCategoryId: string
  topCategoryName: string
  subcategoryId: string
  subcategoryName: string
  itemId: string
  itemName: string
  sortOrder: number
  displayNameOverride?: string | null
  descriptionOverride?: string | null
}

export type AdminBookCategoryRow = {
  id: string
  menuBookId: string
  menuBookName: string
  topCategoryId: string
  topCategoryName: string
  sortOrder: number
}

export type AdminBookCategorySubcategoryRow = {
  id: string
  menuBookId: string
  menuBookName: string
  topCategoryId: string
  topCategoryName: string
  subcategoryId: string
  subcategoryName: string
  sortOrder: number
}

export type AdminStoreSettings = {
  id: string
  tenant_id: string
  code?: string | null
  name: string
  slug: string
  timezone: string
  business_date_offset_minutes: number
  payment_timing_mode: 'PREPAID' | 'POSTPAID'
  ticket_no_reset_mode: 'DAILY' | 'SEQUENCE'
  ticket_no_digits: number
  tax_rate?: number
  reduced_tax_rate?: number
  tax_display_mode?: 'INCLUDED' | 'EXCLUDED'
  open_business_date?: string | null
  today_business_date?: string
} | null

export type AdminTableRow = {
  id: string
  label: string
  qr_token: string
  customer_url?: string | null
  group_name?: string | null
  sort_order?: number
  is_active: boolean
}

export type AdminStaffUserRow = {
  id: string
  auth_user_id?: string | null
  email: string | null
  display_name: string
  role_type: 'ADMIN' | 'STAFF' | 'KDS'
  is_active?: boolean
  password_configured?: boolean
}

export type AdminPaymentMethod = {
  id: string
  name: string
  sort_order: number
  is_active: boolean
  is_change_allowed: boolean
}

export type AdminPhysicalPrinter = {
  id: string
  name: string
  ip_address: string
  port: number
  is_active: boolean
  backup_printer_id?: string | null
  is_default_fallback?: boolean
}

export type AdminLogicalPrinter = {
  id: string
  store_id: string
  code: string
  name: string
  sort_order: number
  is_receipt_printer?: boolean
}

export type AdminPrinterRoutingRule = {
  id: string
  floor_id?: string | null
  area_group: string
  logical_printer_id?: string | null
  logical_printer_code?: string | null
  physical_printer_id: string
}

export type AdminFloor = {
  id: string
  name: string
  sort_order: number
  is_active: boolean
}

export type AdminTab = 'menuBooks' | 'categories' | 'subcategories' | 'items' | 'placements' | 'store' | 'tables' | 'staff' | 'sales' | 'salesHistory' | 'paymentHistory' | 'accountingHistory' | 'productSalesHistory' | 'paymentMethods' | 'receiptReissue' | 'categorySales' | 'subcategorySales' | 'hourlySalesHistory' | 'printers' | 'floors' | 'logicalPrinters'
