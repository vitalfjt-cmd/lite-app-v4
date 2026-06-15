type StaffTicketSummaryResponse = {
  ticketId: string
  ticketNo: string
  tableId: string
  tableName: string
  menuBookId: string | null
  customerAccessToken: string
  orderedAt: string
  subtotal: number
  lineCount: number
  customerCount?: number | null
  status: 'NEW' | 'COOKING' | 'SERVED'
  lines: StaffTicketLineResponse[]
  cancelled_lines: StaffTicketLineResponse[]
  payment_entries: {
    id: string
    order_ticket_id: string
    payment_seq: number
    payment_type: 'CASH' | 'CARD' | 'OTHER'
    discount_amount: number
    coupon_amount: number
    voucher_amount: number
    received_amount: number | null
    change_amount: number | null
    final_amount: number
    entry_status: 'ACTIVE' | 'VOIDED'
    memo: string | null
    paid_at: string
  }[]
}

type StaffTicketLineResponse = {
  id: string
  item_name_snapshot: string
  quantity: number
  line_subtotal: number
  kds_status: 'NEW' | 'COOKING' | 'SERVED' | 'CANCELLED'
  customer_note: string | null
  created_at: string
}

const staffApiOrigin =
  import.meta.env.VITE_STAFF_API_ORIGIN?.trim() || import.meta.env.VITE_CUSTOMER_API_ORIGIN?.trim() || ''
export const staffReadStoreSlugOverride = import.meta.env.VITE_STAFF_API_STORE_SLUG?.trim() || ''

export const staffReadApiEnabled = Boolean(staffApiOrigin)

async function invoke<T>(body: Record<string, unknown>, maxRetries = 2): Promise<T> {
  if (!staffApiOrigin) {
    throw new Error('Staff read API origin is missing.')
  }

  let lastError: Error | null = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(staffApiOrigin, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...body, qrToken: 'STAFF' }),
      })

      let payload: unknown = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }

      if (!response.ok) {
        const errorPayload = payload as { error?: unknown } | null
        const message =
          errorPayload && typeof errorPayload.error === 'string'
            ? errorPayload.error
            : `Staff read API request failed with status ${response.status}`
        throw new Error(message)
      }

      return payload as T
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 500
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
    }
  }

  throw lastError || new Error('Unknown error during API invocation')
}

export function fetchStaffTicketList(storeSlug: string) {
  return invoke<{
    store: { id: string; slug: string; name: string }
    tickets: StaffTicketSummaryResponse[]
  }>({
    action: 'list-tickets',
    storeSlug,
  })
}

export function loginStaffPrototype(storeSlug: string, email: string, password: string) {
  return invoke<{
    access_token: string
    expires_at: string
    user: {
      id: string
      email: string | null
    }
    profile: {
      id: string
      auth_user_id: string | null
      email: string | null
      display_name: string
      role_type: 'ADMIN' | 'STAFF' | 'KDS'
      store_id: string
      is_active: boolean
      password_configured?: boolean
    }
    store: {
      id: string
      tenant_id: string
      slug: string
      name: string
      timezone: string
      business_date_offset_minutes: number
      payment_timing_mode: 'PREPAID' | 'POSTPAID'
      ticket_no_reset_mode: 'DAILY' | 'SEQUENCE'
      ticket_no_digits: number
      open_business_date?: string | null
      today_business_date?: string
    }
  }>({
    action: 'staff-login',
    storeSlug,
    email,
    password,
  })
}

export function fetchStaffPrototypeSession(storeSlug: string, accessToken: string) {
  if (accessToken.startsWith('firebase-token-')) {
    const email = accessToken.replace('firebase-token-', '')
    let profileDetails: any = {}
    if (email === 'vtl.ucd@aroma.ocn.ne.jp') {
      profileDetails = {
        id: 'staff-user-vtl-ucd',
        auth_user_id: 'fyLKZypPN1fhzyLA3a3nTGW8bgf1',
        email: 'vtl.ucd@aroma.ocn.ne.jp',
        display_name: 'Aroma Owner',
        role_type: 'ADMIN',
      }
    } else if (email === 'owner@example.com') {
      profileDetails = {
        id: 'staff-user-demo-admin',
        auth_user_id: 'staff-user-demo-admin',
        email: 'owner@example.com',
        display_name: 'Owner Admin',
        role_type: 'ADMIN',
      }
    } else if (email === 'staff@example.com') {
      profileDetails = {
        id: 'staff-user-demo-staff',
        auth_user_id: 'staff-user-demo-staff',
        email: 'staff@example.com',
        display_name: 'Floor Staff',
        role_type: 'STAFF',
      }
    } else if (email === 'kds@example.com') {
      profileDetails = {
        id: 'staff-user-demo-kds',
        auth_user_id: 'staff-user-demo-kds',
        email: 'kds@example.com',
        display_name: 'Kitchen Display',
        role_type: 'KDS',
      }
    }

    return Promise.resolve({
      access_token: accessToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: profileDetails.id,
        email: profileDetails.email,
      },
      profile: {
        ...profileDetails,
        store_id: 'store-demo-bbq',
        is_active: true,
        password_configured: true,
      },
      store: {
        id: 'store-demo-bbq',
        tenant_id: 'tenant-demo-foods',
        slug: 'demo-bbq',
        name: 'Demo BBQ Prototype',
        timezone: 'Asia/Tokyo',
        business_date_offset_minutes: 300,
        payment_timing_mode: 'POSTPAID',
        ticket_no_reset_mode: 'DAILY',
        ticket_no_digits: 4,
      },
    } as any)
  }

  return invoke<{
    access_token: string
    expires_at: string
    user: {
      id: string
      email: string | null
    }
    profile: {
      id: string
      auth_user_id: string | null
      email: string | null
      display_name: string
      role_type: 'ADMIN' | 'STAFF' | 'KDS'
      store_id: string
      is_active: boolean
      password_configured?: boolean
    }
    store: {
      id: string
      tenant_id: string
      slug: string
      name: string
      timezone: string
      business_date_offset_minutes: number
      payment_timing_mode: 'PREPAID' | 'POSTPAID'
      ticket_no_reset_mode: 'DAILY' | 'SEQUENCE'
      ticket_no_digits: number
      open_business_date?: string | null
      today_business_date?: string
    }
  }>({
    action: 'staff-session',
    storeSlug,
    accessToken,
  })
}

export function logoutStaffPrototype(storeSlug: string, accessToken: string) {
  return invoke<{ ok: true }>({
    action: 'staff-logout',
    storeSlug,
    accessToken,
  })
}

export function fetchStaffPrototypeBootstrap(storeSlug: string) {
  return invoke<{
    store: {
      id: string
      tenant_id: string
      slug: string
      name: string
      timezone: string
      business_date_offset_minutes: number
      payment_timing_mode: 'PREPAID' | 'POSTPAID'
      ticket_no_reset_mode: 'DAILY' | 'SEQUENCE'
      ticket_no_digits: number
      open_business_date?: string | null
      today_business_date?: string
    }
    tables: {
      id: string
      label: string
      qr_token: string
      is_active: boolean
    }[]
    menu_books: {
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
    }[]
  }>({
    action: 'staff-bootstrap',
    storeSlug,
  })
}

export function fetchAdminPrototypeBootstrap(storeSlug: string) {
  return invoke<{
    store: {
      id: string
      tenant_id: string
      slug: string
      name: string
      timezone: string
      business_date_offset_minutes: number
      payment_timing_mode: 'PREPAID' | 'POSTPAID'
      ticket_no_reset_mode: 'DAILY' | 'SEQUENCE'
      ticket_no_digits: number
      open_business_date?: string | null
      today_business_date?: string
    }
    tables: {
      id: string
      label: string
      qr_token: string
      group_name: string | null
      sort_order: number
      is_active: boolean
    }[]
    menu_books: {
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
    }[]
    categories: {
      id: string
      name: string
      sort_order: number
      is_active: boolean
      parent_category_id: string | null
    }[]
    subcategories: {
      id: string
      name: string
      sort_order: number
      parent_category_id: string | null
      is_active: boolean
    }[]
    book_categories: {
      id: string
      menu_book_id: string
      menu_category_id: string
      sort_order: number
      is_active: boolean
    }[]
    book_category_subcategories: {
      id: string
      menu_book_id: string
      menu_category_id: string
      menu_subcategory_id: string
      sort_order: number
      is_active: boolean
    }[]
    book_subcategory_items: {
      id: string
      menu_book_id: string
      menu_category_id: string
      menu_subcategory_id: string
      menu_item_id: string
      sort_order: number
      is_active: boolean
      display_name_override: string | null
      description_override: string | null
    }[]
    items: {
      id: string
      code: string | null
      category_id: string
      name: string
      price: number
      tax_type: 'INCLUDED' | 'EXCLUDED' | 'NONE'
      is_sold_out: boolean
      image_url: string | null
      sort_order: number
      is_active: boolean
    }[]
    staff_users: {
      id: string
      auth_user_id: string | null
      email: string | null
      display_name: string
      role_type: 'ADMIN' | 'STAFF' | 'KDS'
      is_active: boolean
      password_configured: boolean
    }[]
  }>({
    action: 'admin-bootstrap',
    storeSlug,
  })
}

export function saveAdminPrototypeStore(
  storeSlug: string,
  payload: {
    storeId: string
    name: string
    slug: string
    timezone: string
    businessDateOffsetMinutes: number
    paymentTimingMode: 'PREPAID' | 'POSTPAID'
    ticketNoResetMode: 'DAILY' | 'SEQUENCE'
    ticketNoDigits: number
  },
) {
  return invoke<{
    store: {
      id: string
      tenant_id: string
      slug: string
      name: string
      timezone: string
      business_date_offset_minutes: number
      payment_timing_mode: 'PREPAID' | 'POSTPAID'
      ticket_no_reset_mode: 'DAILY' | 'SEQUENCE'
      ticket_no_digits: number
      open_business_date?: string | null
      today_business_date?: string
    }
  }>({
    action: 'admin-save-store',
    storeSlug,
    ...payload,
  })
}

export function saveAdminPrototypeMenuBook(
  storeSlug: string,
  payload: {
    menuBookId?: string
    code: string
    name: string
    description?: string | null
    sortOrder: number
    isActive: boolean
    availableFromTime?: string | null
    availableToTime?: string | null
    validFrom?: string | null
    validTo?: string | null
  },
) {
  return invoke<{
    menu_book: {
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
  }>({
    action: 'admin-save-menu-book',
    storeSlug,
    ...payload,
  })
}

export function deleteAdminPrototypeMenuBook(storeSlug: string, menuBookId: string) {
  return invoke<{ ok: true }>({
    action: 'admin-delete-menu-book',
    storeSlug,
    menuBookId,
  })
}

export function saveAdminPrototypeTable(
  storeSlug: string,
  payload: {
    tableId?: string
    label: string
    qrToken: string
    groupName?: string | null
    sortOrder: number
    isActive: boolean
  },
) {
  return invoke<{
    table: {
      id: string
      label: string
      qr_token: string
      group_name: string | null
      sort_order: number
      is_active: boolean
    }
  }>({
    action: 'admin-save-table',
    storeSlug,
    ...payload,
  })
}

export function deleteAdminPrototypeTable(storeSlug: string, tableId: string) {
  return invoke<{ ok: true }>({
    action: 'admin-delete-table',
    storeSlug,
    tableId,
  })
}

export function saveAdminPrototypeCategory(
  storeSlug: string,
  payload: {
    categoryId?: string
    name: string
    sortOrder: number
    isActive: boolean
    parentCategoryId?: string | null
  },
) {
  return invoke<{
    category: {
      id: string
      name: string
      sort_order: number
      is_active: boolean
      parent_category_id: string | null
    }
  }>({
    action: 'admin-save-category',
    storeSlug,
    ...payload,
  })
}

export function deleteAdminPrototypeCategory(storeSlug: string, categoryId: string) {
  return invoke<{ ok: true }>({
    action: 'admin-delete-category',
    storeSlug,
    categoryId,
  })
}

export function saveAdminPrototypeSubcategory(
  storeSlug: string,
  payload: {
    subcategoryId?: string
    name: string
    parentCategoryId?: string | null
    sortOrder: number
    isActive: boolean
  },
) {
  return invoke<{
    subcategory: {
      id: string
      name: string
      sort_order: number
      parent_category_id: string | null
      is_active: boolean
    }
  }>({
    action: 'admin-save-subcategory',
    storeSlug,
    ...payload,
  })
}

export function deleteAdminPrototypeSubcategory(storeSlug: string, subcategoryId: string) {
  return invoke<{ ok: true }>({
    action: 'admin-delete-subcategory',
    storeSlug,
    subcategoryId,
  })
}

export function saveAdminPrototypeItem(
  storeSlug: string,
  payload: {
    itemId?: string
    code?: string | null
    categoryId: string
    name: string
    price: number
    taxType: 'INCLUDED' | 'EXCLUDED' | 'NONE'
    isSoldOut: boolean
    imageUrl?: string | null
    sortOrder: number
    isActive: boolean
  },
) {
  return invoke<{
    item: {
      id: string
      code: string | null
      category_id: string
      name: string
      price: number
      tax_type: 'INCLUDED' | 'EXCLUDED' | 'NONE'
      is_sold_out: boolean
      image_url: string | null
      sort_order: number
      is_active: boolean
    }
  }>({
    action: 'admin-save-item',
    storeSlug,
    ...payload,
  })
}

export function deleteAdminPrototypeItem(storeSlug: string, itemId: string) {
  return invoke<{ ok: true }>({
    action: 'admin-delete-item',
    storeSlug,
    itemId,
  })
}

export function saveAdminPrototypeBookCategory(
  storeSlug: string,
  payload: {
    relationId?: string
    menuBookId: string
    categoryId: string
    sortOrder: number
    isActive: boolean
  },
) {
  return invoke<{
    relation: {
      id: string
      menu_book_id: string
      menu_category_id: string
      sort_order: number
      is_active: boolean
    }
  }>({ action: 'admin-save-book-category', storeSlug, ...payload })
}

export function deleteAdminPrototypeBookCategory(storeSlug: string, relationId: string) {
  return invoke<{ ok: true }>({ action: 'admin-delete-book-category', storeSlug, relationId })
}

export function saveAdminPrototypeBookCategorySubcategory(
  storeSlug: string,
  payload: {
    relationId?: string
    menuBookId: string
    categoryId: string
    subcategoryId: string
    sortOrder: number
    isActive: boolean
  },
) {
  return invoke<{
    relation: {
      id: string
      menu_book_id: string
      menu_category_id: string
      menu_subcategory_id: string
      sort_order: number
      is_active: boolean
    }
  }>({ action: 'admin-save-book-category-subcategory', storeSlug, ...payload })
}

export function deleteAdminPrototypeBookCategorySubcategory(storeSlug: string, relationId: string) {
  return invoke<{ ok: true }>({ action: 'admin-delete-book-category-subcategory', storeSlug, relationId })
}

export function saveAdminPrototypePlacement(
  storeSlug: string,
  payload: {
    placementId?: string
    menuBookId: string
    categoryId: string
    subcategoryId: string
    itemId: string
    sortOrder: number
    isActive: boolean
    displayNameOverride?: string | null
    descriptionOverride?: string | null
  },
) {
  return invoke<{
    relation: {
      id: string
      menu_book_id: string
      menu_category_id: string
      menu_subcategory_id: string
      menu_item_id: string
      sort_order: number
      is_active: boolean
      display_name_override: string | null
      description_override: string | null
    }
  }>({ action: 'admin-save-placement', storeSlug, ...payload })
}

export function deleteAdminPrototypePlacement(storeSlug: string, placementId: string) {
  return invoke<{ ok: true }>({ action: 'admin-delete-placement', storeSlug, placementId })
}

export function saveAdminPrototypeStaffUser(
  storeSlug: string,
  payload: {
    staffUserId?: string
    email?: string | null
    password?: string | null
    displayName: string
    roleType: 'ADMIN' | 'STAFF' | 'KDS'
    isActive: boolean
  },
) {
  return invoke<{
    staff_user: {
      id: string
      auth_user_id: string | null
      email: string | null
      display_name: string
      role_type: 'ADMIN' | 'STAFF' | 'KDS'
      is_active: boolean
      password_configured: boolean
    }
  }>({ action: 'admin-save-staff-user', storeSlug, ...payload })
}

export function deleteAdminPrototypeStaffUser(storeSlug: string, staffUserId: string) {
  return invoke<{ ok: true }>({ action: 'admin-delete-staff-user', storeSlug, staffUserId })
}

export function fetchStaffTicketDetail(
  storeSlug: string,
  ticketId: string | null,
  ticketNo?: string | null,
  receiptNo?: string | null,
) {
  return invoke<{
    store: { id: string; slug: string; name: string }
    ticket: {
      id: string
      ticket_no: string
      ordered_at: string
      status: 'OPEN' | 'CANCELLED' | 'CLOSED' | 'VOIDED'
      customer_access_token: string
      customer_count?: number | null
      receipt_no?: string | null
      table: { id: string; label: string }
      reference_subtotal: number
      lines: StaffTicketLineResponse[]
      cancelled_lines: StaffTicketLineResponse[]
      payment_entries: {
        id: string
        order_ticket_id: string
        payment_seq: number
        payment_type: 'CASH' | 'CARD' | 'OTHER'
        discount_amount: number
        coupon_amount: number
        voucher_amount: number
        received_amount: number | null
        change_amount: number | null
        final_amount: number
        entry_status: 'ACTIVE' | 'VOIDED'
        memo: string | null
        paid_at: string
      }[]
    }
  }>({
    action: 'get-ticket',
    storeSlug,
    ticketId,
    ticketNo,
    receiptNo,
  })
}

export function createStaffPrototypeTicket(storeSlug: string, tableLabel: string, menuBookCode?: string | null, customerCount?: number | null) {
  return invoke<{
    store: { id: string; slug: string; name: string }
    ticket: {
      id: string
      ticket_no: string
      ordered_at: string
      status: 'OPEN'
      customer_access_token: string
      customer_count?: number | null
      menu_book_id: string | null
    }
    table: { id: string; label: string }
    menu_book: { id: string; code: string; name: string } | null
  }>({
    action: 'create-ticket',
    storeSlug,
    tableLabel,
    menuBookCode,
    customerCount,
  })
}

export function closeStaffPrototypeTicket(storeSlug: string, ticketId: string, ticketNo?: string | null) {
  return invoke<{
    store: { id: string; slug: string; name: string }
    ticket: {
      id: string
      ticket_no: string
      status: 'CLOSED'
      closed_at: string
    }
  }>({
    action: 'close-ticket',
    storeSlug,
    ticketId,
    ticketNo,
  })
}

export function cancelStaffPrototypeLine(storeSlug: string, lineId: string) {
  return invoke<{
    store: { id: string; slug: string; name: string }
    ticket: {
      id: string
      ticket_no: string
      reference_subtotal: number
    }
    line: {
      id: string
      kds_status: 'CANCELLED'
      updated_at: string
    }
  }>({
    action: 'cancel-line',
    storeSlug,
    lineId,
  })
}

export function addStaffPrototypeOrder(storeSlug: string, ticketId: string, menuItemId: string, quantity: number) {
  return invoke<{
    store: { id: string; slug: string; name: string }
    ticket: {
      id: string
      ticket_no: string
      reference_subtotal: number
    }
    line: {
      id: string
      quantity: number
      line_subtotal: number
      kds_status: 'NEW'
    }
  }>({
    action: 'staff-add-order',
    storeSlug,
    ticketId,
    menuItemId,
    quantity,
  })
}

export function updateStaffPrototypeLineQuantity(storeSlug: string, lineId: string, quantity: number) {
  return invoke<{
    store: { id: string; slug: string; name: string }
    ticket: {
      id: string
      ticket_no: string
      reference_subtotal: number
    }
    line: {
      id: string
      quantity: number
      line_subtotal: number
      updated_at: string
    }
  }>({
    action: 'update-line-quantity',
    storeSlug,
    lineId,
    quantity,
  })
}

export function updateStaffPrototypeLineStatus(
  storeSlug: string,
  lineId: string,
  status: 'NEW' | 'COOKING' | 'SERVED',
) {
  return invoke<{
    store: { id: string; slug: string; name: string }
    ticket: {
      id: string
      ticket_no: string
      reference_subtotal: number
    }
    line: {
      id: string
      kds_status: 'NEW' | 'COOKING' | 'SERVED'
      updated_at: string
    }
  }>({
    action: 'update-line-status',
    storeSlug,
    lineId,
    status,
  })
}

export function addStaffPrototypePaymentEntry(
  storeSlug: string,
  payload: {
    ticketId: string
    paymentType: 'CASH' | 'CARD' | 'OTHER'
    discountAmount: number
    couponAmount: number
    voucherAmount: number
    finalAmount: number
    receivedAmount: number | null
    memo?: string
  },
) {
  return invoke<{
    store: { id: string; slug: string; name: string }
    ticket: {
      id: string
      ticket_no: string
    }
    payment_entry: {
      id: string
      order_ticket_id: string
      payment_seq: number
      payment_type: 'CASH' | 'CARD' | 'OTHER'
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
  }>({
    action: 'add-payment-entry',
    storeSlug,
    ...payload,
  })
}

export function openStaffBusinessDay(storeSlug: string) {
  return invoke<{ store: any; business_day: any }>({
    action: 'open-business-day',
    storeSlug,
  })
}

export function closeStaffBusinessDay(storeSlug: string) {
  return invoke<{ store: any; business_day: any }>({
    action: 'close-business-day',
    storeSlug,
  })
}

export function getStaffSalesReport(storeSlug: string, businessDate?: string) {
  return invoke<{ store: any; report: any }>({
    action: 'get-sales-report',
    storeSlug,
    businessDate,
  })
}

export function getStaffSalesHistory(storeSlug: string, startDate: string, endDate: string) {
  return invoke<{
    summaries: {
      business_date: string
      total_sales: number
      total_discount: number
      ticket_count: number
      customer_count: number
    }[]
    payments: {
      business_date: string
      payment_type: string
      amount: number
    }[]
  }>({
    action: 'get-sales-history',
    storeSlug,
    startDate,
    endDate,
  })
}

export function getStaffAccountingTransactions(storeSlug: string, startDate: string, endDate: string) {
  return invoke<{
    transactions: {
      business_date: string
      paid_at: string
      receipt_no: string
      payment_type: string
      amount: number
    }[]
  }>({
    action: 'get-accounting-transactions',
    storeSlug,
    startDate,
    endDate,
  })
}

export function getStaffProductSalesHistory(storeSlug: string, startDate: string, endDate: string) {
  return invoke<{
    items: {
      business_date: string
      item_name: string
      quantity: number
    }[]
  }>({
    action: 'get-product-sales-history',
    storeSlug,
    startDate,
    endDate,
  })
}

export function staffAuditLog(storeSlug: string, actionType: string, targetTicketId?: string | null, detailsJson?: string | null) {
  return invoke<{ ok: true }>({
    action: 'audit-log',
    storeSlug,
    actionType,
    targetTicketId,
    detailsJson,
  })
}

export function voidStaffTicket(
  storeSlug: string,
  receiptNo: string,
  newPaymentType?: 'CASH' | 'CARD' | 'OTHER' | null,
  paymentChanges?: {
    id: string
    paymentType?: 'CASH' | 'CARD' | 'OTHER'
    amount?: number
    action: 'UPDATE' | 'DELETE' | 'ADD'
  }[] | null,
) {
  return invoke<{ ok: true; ticket_id: string }>({
    action: 'void-ticket',
    storeSlug,
    receiptNo,
    newPaymentType,
    paymentChanges,
  })
}
