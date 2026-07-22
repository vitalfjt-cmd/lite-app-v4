type CustomerOrderDraft = {
  menu_item_id: string
  quantity: number
  note?: string
  toppings?: string[]
}

const customerApiOrigin = import.meta.env.VITE_CUSTOMER_API_ORIGIN?.trim() || ''
export const customerApiSupportsTicketBootstrap = Boolean(customerApiOrigin)

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  if (!customerApiOrigin) {
    throw new Error('Customer API origin is missing.')
  }

  const response = await fetch(
    customerApiOrigin,
    {
    method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )

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
        : `Edge Function request failed with status ${response.status}`
    throw new Error(message)
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('Function returned no data.')
  }

  const successPayload = payload as { error?: unknown }
  if (typeof successPayload.error === 'string') {
    throw new Error(successPayload.error)
  }

  return payload as T
}

export function fetchPublicMenu(storeSlug: string, qrToken: string, ticketToken?: string | null) {
  return invoke<{
    store: { id: string; slug: string; name: string }
    table: { id: string; label: string; qr_token: string }
    current_ticket: { id: string; ticket_no: string; ordered_at: string; status: string; customer_access_token: string } | null
    menu_book: { id: string; code: string; name: string; description: string | null; available_from_time?: string | null; available_to_time?: string | null } | null
    categories: { id: string; name: string; sort_order: number; parent_category_id?: string | null }[]
    top_categories: { id: string; name: string; sort_order: number; parent_category_id?: string | null }[]
    subcategories: { id: string; name: string; sort_order: number; parent_category_id?: string | null }[]
    items: {
      id: string
      category_id: string
      parent_category_id?: string | null
      name: string
      price: number
      is_sold_out: boolean
      image_url?: string | null
      sort_order: number
      description_override?: string | null
      toppings?: { id: string; name: string; price: number; is_sold_out: boolean }[]
    }[]
  }>({
    action: 'menu',
    storeSlug,
    qrToken,
    ticketToken,
  })
}

export function createPublicOrder(storeSlug: string, qrToken: string, ticketToken: string | null | undefined, items: CustomerOrderDraft[]) {
  return invoke<{
    ticket_no: string
    ordered_at: string
    customer_access_token?: string
  }>({
    action: 'create-order',
    storeSlug,
    qrToken,
    ticketToken,
    items,
  })
}

export function fetchPublicTicket(storeSlug: string, qrToken: string, ticketToken: string | null | undefined, ticketNo: string) {
  return invoke<{
    store: { id: string; slug: string; name: string }
    table: { id: string; label: string; qr_token: string }
    ticket: {
      ticket_no: string
      ordered_at: string
      status: string
      reference_subtotal: number
      lines: {
        id: string
        item_name_snapshot: string
        quantity: number
        line_subtotal: number
        kds_status: string
        customer_note: string | null
        created_at: string
        toppings?: { id: string; name: string; price: number }[]
      }[]
    }
  }>({
    action: 'ticket',
    storeSlug,
    qrToken,
    ticketToken,
    ticketNo,
  })
}
