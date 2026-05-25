
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
}

export type AdminCategory = {
  id: string
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
  image_url?: string | null
  sort_order: number
  is_active: boolean
  is_sold_out: boolean
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
  name: string
  slug: string
  timezone: string
  business_date_offset_minutes: number
  payment_timing_mode: 'PREPAID' | 'POSTPAID'
  ticket_no_reset_mode: 'DAILY' | 'SEQUENCE'
  ticket_no_digits: number
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

export type AdminTab = 'menuBooks' | 'categories' | 'subcategories' | 'items' | 'placements' | 'store' | 'tables' | 'staff' | 'sales'
