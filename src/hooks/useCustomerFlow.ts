import { useState, useMemo, useEffect } from 'react'
import type { CustomerCategory, CustomerMenuItem, LiveCategory, LiveMenuItem, AppView } from '../types'
import type { TicketReceipt } from '../lib/staffUtils'
import {
  readCustomerAccessParams,
  composeScopedCategoryId,
  syncCustomerTicketInUrl,
  formatError,
  isTimeWithinWindow,
} from '../lib/appUtils'
import { createPublicOrder, customerApiSupportsTicketBootstrap, fetchPublicTicket, fetchPublicMenu } from '../lib/publicCustomerApi'
import { createLocalTicketReceipt, createTicketReceipt } from '../lib/staffUtils'

export function useCustomerFlow(view: AppView) {
  const [customerAccess, setCustomerAccess] = useState(readCustomerAccessParams())
  const [customerBusy, setCustomerBusy] = useState(false)
  const [customerMessage, setCustomerMessage] = useState<string | null>(null)
  const [cart, setCart] = useState<Record<string, number>>({})
  const [publicMenuReady, setPublicMenuReady] = useState(false)
  const [publicStore, setPublicStore] = useState<{ id: string; name: string; slug: string } | null>(null)
  const [publicTable, setPublicTable] = useState<{ id: string; label: string } | null>(null)
  const [publicOpenTicket, setPublicOpenTicket] = useState<{
    id: string
    ticket_no: string
    ordered_at: string
    first_ordered_at?: string | null
    customer_access_token: string
    status?: string
    last_order_completed?: boolean
  } | null>(null)
  const [publicCategories, setPublicCategories] = useState<LiveCategory[]>([])
  const [publicItems, setPublicItems] = useState<LiveMenuItem[]>([])
  const [publicMenuBook, setPublicMenuBook] = useState<{
    id: string
    code: string
    name: string
    description: string | null
    available_from_time?: string | null
    available_to_time?: string | null
    time_limit_minutes: number | null
    last_order_offset_minutes: number | null
  } | null>(null)

  const [selectedCustomerTopCategoryId, setSelectedCustomerTopCategoryId] = useState<string | null>(null)
  const [selectedCustomerCategoryId, setSelectedCustomerCategoryId] = useState<string | null>(null)
  const [customerFocusedItemId, setCustomerFocusedItemId] = useState<string | null>(null)
  const [customerStep, setCustomerStep] = useState<'menu' | 'confirm' | 'myOrder'>('menu')
  const [ticketReceipt, setTicketReceipt] = useState<TicketReceipt | null>(null)

  const publicStoreSlug = customerAccess.storeSlug
  const publicQrToken = customerAccess.qrToken
  const publicTicketToken = customerAccess.ticketToken
  const hasPublicCustomerAccess = Boolean(publicStoreSlug && publicQrToken)
  const effectivePublicTicketToken = publicTicketToken || publicOpenTicket?.customer_access_token || null

  // Memoized values
  const customerCategories = useMemo<CustomerCategory[]>(() => {
    if (customerApiSupportsTicketBootstrap || publicCategories.length > 0) {
      return publicCategories
        .filter((item) => item.is_active)
        .map((item) => ({
          id: composeScopedCategoryId(item.parent_category_id ?? null, item.id),
          name: item.name,
          parentId: item.parent_category_id ?? null,
        }))
    }
    return []
  }, [publicCategories])

  const customerMenuItems = useMemo<CustomerMenuItem[]>(() => {
    if (customerApiSupportsTicketBootstrap || publicItems.length > 0) {
      return publicItems
        .filter((item) => item.is_active)
        .map((item) => ({
          id: item.id,
          categoryId: composeScopedCategoryId(item.parent_category_id ?? null, item.category_id),
          name: item.name,
          name_en: item.name_en ?? null,
          price: item.price,
          soldOut: item.is_sold_out,
          imageUrl: item.image_url ?? null,
          toppings: item.toppings ?? [],
        }))
    }
    return []
  }, [publicItems])

  const customerTopCategories = useMemo(() => {
    const hierarchicalTop = customerCategories.filter((category) => !category.parentId)
    return hierarchicalTop.length > 0 ? hierarchicalTop : customerCategories
  }, [customerCategories])

  const hasCustomerCategoryHierarchy = useMemo(
    () => customerCategories.some((category) => Boolean(category.parentId)),
    [customerCategories],
  )

  const customerSubCategories = useMemo(() => {
    if (!hasCustomerCategoryHierarchy) return customerCategories
    if (!selectedCustomerTopCategoryId) return []
    return customerCategories.filter((category) => category.parentId === selectedCustomerTopCategoryId)
  }, [customerCategories, hasCustomerCategoryHierarchy, selectedCustomerTopCategoryId])

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([cartKey, qty]) => {
        const [itemId, toppingIdsStr] = cartKey.split(':')
        const toppingIds = toppingIdsStr ? toppingIdsStr.split(',') : []
        const item = customerMenuItems.find((m) => m.id === itemId)
        
        const activeToppings = toppingIds.map(tid => {
          const tItem = item?.toppings?.find(t => t.id === tid)
          return {
            id: tid,
            name: tItem?.name ?? 'トッピング',
            price: tItem?.price ?? 0
          }
        })
        
        const toppingPriceSum = activeToppings.reduce((sum, t) => sum + t.price, 0)
        const unitPrice = (item?.price ?? 0) + toppingPriceSum

        return {
          id: itemId,
          cartKey,
          qty,
          name: item?.name ?? 'Unknown Item',
          price: unitPrice,
          lead: item?.lead ?? '',
          soldOut: item?.soldOut ?? false,
          imageUrl: item?.imageUrl ?? null,
          toppings: activeToppings,
          toppingIds,
        }
      })
  }, [cart, customerMenuItems])

  const cartCount = useMemo(() => cartItems.reduce((acc, item) => acc + item.qty, 0), [cartItems])
  const cartSubtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.qty * item.price, 0), [cartItems])

  const selectedCustomerTopCategoryIdSafe = selectedCustomerTopCategoryId ?? (customerTopCategories[0]?.id || null)
  const selectedCustomerCategoryIdSafe = selectedCustomerCategoryId ?? (customerSubCategories[0]?.id || null)

  const firstCategoryWithItems = useMemo(() => {
    return customerSubCategories.find((cat) => customerMenuItems.some((item) => item.categoryId === cat.id))
  }, [customerSubCategories, customerMenuItems])

  const visibleCustomerItems = useMemo(() => {
    return customerMenuItems.filter((item) => item.categoryId === selectedCustomerCategoryIdSafe)
  }, [customerMenuItems, selectedCustomerCategoryIdSafe])

  // Effects
  useEffect(() => {
    if (customerTopCategories.length === 0) {
      setSelectedCustomerTopCategoryId(null)
      return
    }
    setSelectedCustomerTopCategoryId((current) =>
      current && customerTopCategories.some((category) => category.id === current) ? current : customerTopCategories[0].id,
    )
  }, [customerTopCategories])

  useEffect(() => {
    if (customerSubCategories.length === 0) {
      setSelectedCustomerCategoryId(null)
      return
    }
    setSelectedCustomerCategoryId((current) =>
      current && customerSubCategories.some((category) => category.id === current) ? current : customerSubCategories[0].id,
    )
  }, [customerSubCategories])

  useEffect(() => {
    if (hasCustomerCategoryHierarchy) return
    if (!selectedCustomerTopCategoryId) return
    setSelectedCustomerCategoryId(selectedCustomerTopCategoryId)
  }, [hasCustomerCategoryHierarchy, selectedCustomerTopCategoryId])

  useEffect(() => {
    if (customerStep === 'confirm' && Object.values(cart).every((qty) => qty === 0)) {
      setCustomerStep('menu')
    }
  }, [cart, customerStep])

  useEffect(() => {
    setPublicMenuReady(false)
    setPublicStore(null)
    setPublicTable(null)
    setPublicCategories([])
    setPublicItems([])
    setPublicMenuBook(null)
    setTicketReceipt(null)
    setCart({})
    setCustomerStep('menu')
    if ((view === 'customer' || view === 'cust-tablet') && !hasPublicCustomerAccess) {
      const savedStore = window.localStorage.getItem('pos_tablet_store')
      const savedQr = window.localStorage.getItem('pos_tablet_qr')
      setCustomerMessage(`卓情報が見つかりません。URL: ${window.location.search || '(空)'} / キャッシュ: store=${savedStore || '(空)'}, qr=${savedQr || '(空)'}`)
    }
  }, [hasPublicCustomerAccess, publicQrToken, publicStoreSlug, publicTicketToken, view])

  const handleSubmitCustomerOrder = async (session: any | null, loadLiveData: (s: any) => Promise<void>, loadPublicMenu: (silent?: boolean) => Promise<void>) => {
    if (cartItems.length === 0) {
      setCustomerMessage('商品を選択してください。')
      return
    }
    if (publicMenuBook && !isTimeWithinWindow(publicMenuBook.available_from_time, publicMenuBook.available_to_time)) {
      setCustomerMessage('現在、このメニューの提供時間外のため注文できません。')
      return
    }
    setCustomerBusy(true)
    setCustomerMessage(null)
    try {
      const created = await createPublicOrder(
        publicStoreSlug,
        publicQrToken,
        effectivePublicTicketToken,
        cartItems.map((item) => ({ menu_item_id: item.id, quantity: item.qty, toppings: item.toppingIds })),
      )
      setTicketReceipt(
        createLocalTicketReceipt(
          created.ticket_no,
          created.ordered_at,
          cartItems.map((item) => {
            const toppingStr = item.toppings.length > 0 ? ` ＋ ${item.toppings.map(t => t.name).join(' ＋ ')}` : ''
            return {
              id: item.id,
              itemName: `${item.name}${toppingStr}`,
              qty: item.qty,
              subtotal: item.qty * item.price,
            }
          }),
        ),
      )
      if (created.customer_access_token) {
        syncCustomerTicketInUrl(created.customer_access_token)
        setCustomerAccess((current) => ({
          ...current,
          ticketToken: created.customer_access_token as string,
        }))
        setPublicOpenTicket((current) => ({
          id: current?.id ?? '',
          ticket_no: created.ticket_no,
          ordered_at: current?.ordered_at || created.ordered_at,
          first_ordered_at: (created as any).first_ordered_at || current?.first_ordered_at || created.ordered_at,
          customer_access_token: created.customer_access_token as string,
          status: 'OPEN',
          last_order_completed: Boolean((created as any).last_order_completed || current?.last_order_completed),
        }))
      }
      setCart({})
      setCustomerStep('menu')
      setCustomerMessage('注文を送信しました。内容は「注文内容を見る」から確認できます。')
      if (session && view !== 'customer') await loadLiveData(session)
    } catch (err) {
      const errorMessage = formatError(err)
      if (errorMessage.includes('no_open_ticket')) {
        await loadPublicMenu(true)
        setCart({})
        setCustomerStep('menu')
        if (view === 'cust-tablet') {
          setCustomerMessage('会計が完了しました。新しいご注文を開始できます。')
        } else {
          setCustomerMessage('会計済みのため、この卓からの追加注文はできません。スタッフにお声がけください。')
        }
      } else if (errorMessage.includes('menu_book_out_of_hours') || errorMessage.includes('out_of_hours')) {
        await loadPublicMenu(true)
        setCustomerMessage('現在、このメニューの提供時間外のため注文できません。')
        setCustomerStep('menu')
      } else if (errorMessage.includes('menu_item_sold_out') || errorMessage.includes('sold_out')) {
        await loadPublicMenu(true)
        setCustomerMessage('一部の商品が売切れになったため、メニューを更新しました。')
        setCustomerStep('menu')
      } else {
        setCustomerMessage(errorMessage)
      }
    } finally {
      setCustomerBusy(false)
    }
  }

  const refreshCustomerTicket = async () => {
    const ticketNo = ticketReceipt?.ticketNo || publicOpenTicket?.ticket_no
    if (!ticketNo) return
    setCustomerBusy(true)
    setCustomerMessage(null)
    try {
      const ticket = await fetchPublicTicket(publicStoreSlug, publicQrToken, effectivePublicTicketToken, ticketNo)
      setTicketReceipt(createTicketReceipt(ticket.ticket))
      setCustomerMessage('My Order updated.')
    } catch (err) {
      const message = formatError(err)
      setCustomerMessage(message)
    } finally {
      setCustomerBusy(false)
    }
  }

  return {
    customerAccess,
    setCustomerAccess,
    publicStoreSlug,
    publicQrToken,
    publicTicketToken,
    effectivePublicTicketToken,
    hasPublicCustomerAccess,
    customerBusy,
    setCustomerBusy,
    customerMessage,
    setCustomerMessage,
    cart,
    setCart,
    publicMenuReady,
    setPublicMenuReady,
    publicStore,
    setPublicStore,
    publicTable,
    setPublicTable,
    publicOpenTicket,
    setPublicOpenTicket,
    publicMenuBook,
    setPublicMenuBook,
    publicCategories,
    setPublicCategories,
    publicItems,
    setPublicItems,
    selectedCustomerTopCategoryId,
    setSelectedCustomerTopCategoryId,
    selectedCustomerCategoryId,
    setSelectedCustomerCategoryId,
    customerFocusedItemId,
    setCustomerFocusedItemId,
    customerStep,
    setCustomerStep,
    ticketReceipt,
    setTicketReceipt,
    customerCategories,
    customerMenuItems,
    customerTopCategories,
    customerSubCategories,
    cartItems,
    cartCount,
    cartSubtotal,
    selectedCustomerTopCategoryIdSafe,
    selectedCustomerCategoryIdSafe,
    visibleCustomerItems,
    handleSubmitCustomerOrder,
    refreshCustomerTicket,
    returnToCustomerMenu: () => {
      setCustomerStep('menu')
      if (visibleCustomerItems.length === 0 && firstCategoryWithItems) {
        setSelectedCustomerCategoryId(firstCategoryWithItems.id)
      }
    },
  }
}
