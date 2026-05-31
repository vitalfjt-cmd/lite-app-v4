import { StaffProfile, LiveStore, LiveTicket, LiveLine, LivePaymentEntry, LiveTableRef, LiveMenuBook, LiveCategory, LiveSubcategory, LiveBookCategory, LiveBookCategorySubcategory, LiveBookSubcategoryItem, LiveMenuItem, LiveStaffUser, LiveMenuBookItem } from '../types'
import { fetchStaffPrototypeSession, fetchStaffPrototypeBootstrap, fetchStaffTicketList, fetchAdminPrototypeBootstrap, staffReadStoreSlugOverride, staffReadApiEnabled } from '../lib/staffReadApi'
import { fetchPublicMenu } from '../lib/publicCustomerApi'
import { formatError, syncCustomerTicketInUrl, readCustomerAccessParams } from '../lib/appUtils'

export type DataLoadingSetters = {
  setLoadBusy: (busy: boolean) => void
  setError: (error: string | null) => void
  setProfile: (profile: StaffProfile | null) => void
  setLiveStore: (store: LiveStore | null) => void
  setLiveTickets: (tickets: LiveTicket[]) => void
  setLiveLines: (lines: LiveLine[]) => void
  setLivePaymentEntries: (entries: LivePaymentEntry[]) => void
  setLiveTables: (tables: LiveTableRef[]) => void
  setLiveMenuBooks: (menuBooks: LiveMenuBook[]) => void
  setLiveCategories: (categories: LiveCategory[]) => void
  setLiveSubcategories: (subcategories: LiveSubcategory[]) => void
  setLiveMenuBookItems: (items: LiveMenuBookItem[]) => void
  setLiveBookCategories: (bookCategories: LiveBookCategory[]) => void
  setLiveBookCategorySubcategories: (relations: LiveBookCategorySubcategory[]) => void
  setLiveBookSubcategoryItems: (items: LiveBookSubcategoryItem[]) => void
  setLiveItems: (items: LiveMenuItem[]) => void
  setLiveStaffUsers: (users: LiveStaffUser[]) => void
  setNewTicketMenuBookId: (updater: string | ((current: string) => string)) => void
  setAdminMenuBookId: (updater: string | ((current: string) => string)) => void
  setAdminPlacementMenuBookId: (updater: string | ((current: string) => string)) => void
  setAdminCategoryParentId: (updater: string | ((current: string) => string)) => void
  setAdminItemCategoryId: (updater: string | ((current: string) => string)) => void
  setAdminPlacementTopCategoryId: (updater: string | ((current: string) => string)) => void
  setAdminPlacementCategoryId: (updater: string | ((current: string) => string)) => void
  setAdminPlacementItemId: (updater: string | ((current: string) => string)) => void
  setAdminStoreName: (name: string) => void
  setAdminStoreSlug: (slug: string) => void
  setAdminStoreTimezone: (tz: string) => void
  setAdminStoreBusinessOffsetMinutes: (min: any) => void
  setAdminStorePaymentTimingMode: (mode: any) => void
  setAdminStoreTicketNoResetMode: (mode: any) => void
  setAdminStoreTicketNoDigits: (digits: any) => void
  setPublicStore: (store: any) => void
  setPublicTable: (table: any) => void
  setPublicOpenTicket: (ticket: any) => void
  setPublicCategories: (categories: any[]) => void
  setPublicItems: (items: any[]) => void
  setPublicMenuReady: (ready: boolean) => void
  setCustomerBusy: (busy: boolean) => void
  setCustomerMessage: (msg: string | null) => void
  setCustomerAccess: (access: any) => void
  setSession: (session: any | null) => void
}

export function useDataLoading(setters: DataLoadingSetters) {
  const {
    setLoadBusy, setError, setProfile, setLiveStore, setLiveTickets, setLiveLines, setLivePaymentEntries,
    setLiveTables, setLiveMenuBooks, setLiveMenuBookItems, setLiveCategories, setLiveSubcategories,
    setLiveBookCategories, setLiveBookCategorySubcategories, setLiveBookSubcategoryItems, setLiveItems, setLiveStaffUsers,
    setNewTicketMenuBookId, setAdminMenuBookId, setAdminPlacementMenuBookId, setAdminCategoryParentId,
    setAdminItemCategoryId, setAdminPlacementTopCategoryId, setAdminPlacementCategoryId, setAdminPlacementItemId,
    setAdminStoreName, setAdminStoreSlug, setAdminStoreTimezone, setAdminStoreBusinessOffsetMinutes,
    setAdminStorePaymentTimingMode, setAdminStoreTicketNoResetMode, setAdminStoreTicketNoDigits,
    setPublicStore, setPublicTable, setPublicOpenTicket, setPublicCategories, setPublicItems,
    setPublicMenuReady, setCustomerBusy, setCustomerMessage, setCustomerAccess, setSession
  } = setters

  const loadOperationalData = async (currentProfile: StaffProfile, storeSlugOverride?: string) => {
    if (staffReadApiEnabled) {
      const storeSlug = staffReadStoreSlugOverride || storeSlugOverride
      if (!storeSlug) throw new Error('staff_store_slug_missing')

      const bootstrap = await fetchStaffPrototypeBootstrap(storeSlug)
      const listResponse = await fetchStaffTicketList(storeSlug)

      setLiveStore(bootstrap.store)
      setLiveTables(bootstrap.tables)
      setLiveMenuBooks(bootstrap.menu_books)
      setNewTicketMenuBookId((current) =>
        current && bootstrap.menu_books.some((menuBook) => menuBook.id === current)
          ? current
          : (bootstrap.menu_books.find((menuBook) => menuBook.is_active)?.id ?? bootstrap.menu_books[0]?.id ?? ''),
      )

      const nextTickets: LiveTicket[] = listResponse.tickets.map((ticket) => ({
        id: ticket.ticketId,
        ticket_no: ticket.ticketNo,
        table_ref_id: ticket.tableId,
        menu_book_id: ticket.menuBookId,
        table_label: ticket.tableName,
        customer_access_token: ticket.customerAccessToken,
        customer_count: ticket.customerCount,
        ordered_at: ticket.orderedAt,
        status: 'OPEN',
      }))

      const nextLines: LiveLine[] = listResponse.tickets.flatMap((ticket) =>
        [...ticket.lines, ...ticket.cancelled_lines].map((line) => ({
          id: line.id,
          order_ticket_id: ticket.ticketId,
          item_id: (line as any).itemId || (line as any).item_id || (line as any).menu_item_id || '00000000-0000-0000-0000-000000000000',
          item_name_snapshot: line.item_name_snapshot,
          quantity: line.quantity,
          line_subtotal: line.line_subtotal,
          kds_status: line.kds_status,
          customer_note: line.customer_note,
          created_at: line.created_at,
        })),
      )

      const nextPaymentEntries: LivePaymentEntry[] = listResponse.tickets.flatMap((ticket) =>
        ticket.payment_entries.map((entry) => ({
          id: entry.id,
          order_ticket_id: entry.order_ticket_id,
          payment_seq: entry.payment_seq,
          payment_type: entry.payment_type,
          discount_amount: entry.discount_amount,
          coupon_amount: entry.coupon_amount,
          voucher_amount: entry.voucher_amount,
          received_amount: entry.received_amount,
          change_amount: entry.change_amount,
          final_amount: entry.final_amount,
          entry_status: entry.entry_status,
          memo: entry.memo,
          paid_at: entry.paid_at,
        })),
      )

      setLiveTickets(nextTickets)
      setLiveLines(nextLines)
      setLivePaymentEntries(nextPaymentEntries)
      return
    }
  }

  const loadAdminPrototypeData = async (storeSlug: string) => {
    const bootstrap = await fetchAdminPrototypeBootstrap(storeSlug)
    setLiveStore(bootstrap.store)
    setLiveTables(
      bootstrap.tables.map((table) => ({
        id: table.id,
        label: table.label,
        qr_token: table.qr_token,
        group_name: table.group_name ?? null,
        sort_order: table.sort_order,
        is_active: table.is_active,
      })),
    )
    setLiveMenuBooks(bootstrap.menu_books)
    setLiveCategories(bootstrap.categories.map((category) => ({ ...category, parent_category_id: category.parent_category_id ?? null })))
    setLiveSubcategories(bootstrap.subcategories)
    setLiveBookCategories(bootstrap.book_categories)
    setLiveBookCategorySubcategories(bootstrap.book_category_subcategories)
    setLiveBookSubcategoryItems(bootstrap.book_subcategory_items)
    setLiveItems(
      bootstrap.items.map((item) => ({
        ...item,
        code: item.code ?? null,
        image_url: item.image_url ?? null,
      })),
    )
    setLiveStaffUsers(
      bootstrap.staff_users.map((staffUser) => ({
        id: staffUser.id,
        auth_user_id: staffUser.auth_user_id ?? null,
        email: staffUser.email ?? null,
        display_name: staffUser.display_name,
        role_type: staffUser.role_type,
        store_id: bootstrap.store.id,
        is_active: staffUser.is_active,
        password_configured: staffUser.password_configured,
      })),
    )
    setNewTicketMenuBookId((current) =>
      typeof current === 'function' ? (current as any)(bootstrap.menu_books) : // Fallback if it's not a function
      current && bootstrap.menu_books.some((menuBook) => menuBook.id === current)
        ? current
        : (bootstrap.menu_books.find((menuBook) => menuBook.is_active)?.id ?? bootstrap.menu_books[0]?.id ?? ''),
    )
    // Simplify for bootstrap
    setAdminMenuBookId(bootstrap.menu_books[0]?.id ?? '')
    setAdminPlacementMenuBookId(bootstrap.menu_books[0]?.id ?? '')
    const topCats = bootstrap.categories.filter(c => !c.parent_category_id)
    setAdminCategoryParentId(topCats[0]?.id ?? '')
    setAdminItemCategoryId(topCats[0]?.id ?? bootstrap.categories[0]?.id ?? '')
    setAdminPlacementTopCategoryId(topCats[0]?.id ?? '')
    setAdminPlacementCategoryId(bootstrap.subcategories[0]?.id ?? '')
    setAdminPlacementItemId(bootstrap.items[0]?.id ?? '')

    setAdminStoreName(bootstrap.store.name)
    setAdminStoreSlug(bootstrap.store.slug)
    setAdminStoreTimezone(bootstrap.store.timezone)
    setAdminStoreBusinessOffsetMinutes(bootstrap.store.business_date_offset_minutes)
    setAdminStorePaymentTimingMode(bootstrap.store.payment_timing_mode)
    setAdminStoreTicketNoResetMode(bootstrap.store.ticket_no_reset_mode)
    setAdminStoreTicketNoDigits(bootstrap.store.ticket_no_digits)
  }

  const loadLiveData = async (activeSession: any, view: string, PROTOTYPE_STAFF_SESSION_STORAGE_KEY: string) => {
    setLoadBusy(true)
    setError(null)
    try {
      if (staffReadApiEnabled) {
        const prototypeStoreSlug = staffReadStoreSlugOverride || 'demo-bbq'
        const auth = await fetchStaffPrototypeSession(prototypeStoreSlug, activeSession.access_token)
        const currentProfile: StaffProfile = {
          id: auth.profile.id,
          auth_user_id: auth.profile.auth_user_id ?? null,
          email: auth.profile.email ?? null,
          display_name: auth.profile.display_name,
          role_type: auth.profile.role_type,
          store_id: auth.profile.store_id,
          is_active: auth.profile.is_active,
          password_configured: auth.profile.password_configured,
        }
        setProfile(currentProfile)
        setLiveStore(auth.store)
        setLiveStaffUsers([currentProfile])
        if (view === 'admin') {
          await loadAdminPrototypeData(prototypeStoreSlug)
          setLiveTickets([])
          setLiveLines([])
          setLivePaymentEntries([])
        } else {
          await loadOperationalData(currentProfile, prototypeStoreSlug)
          if (view === 'staff' || view === 'kds') {
            await loadAdminPrototypeData(prototypeStoreSlug)
          } else {
            setLiveCategories([])
            setLiveSubcategories([])
            setLiveBookCategories([])
            setLiveBookCategorySubcategories([])
            setLiveBookSubcategoryItems([])
            setLiveItems([])
          }
        }
        setLoadBusy(false)
        return
      }
    } catch (err) {
      const message = formatError(err)
      if (staffReadApiEnabled && (message === 'invalid_session' || message === 'store_not_found:demo-bbq')) {
        window.localStorage.removeItem(PROTOTYPE_STAFF_SESSION_STORAGE_KEY)
        setSession(null)
      }
      setError(message)
    } finally {
      setLoadBusy(false)
    }
  }

  const loadPublicMenu = async (publicStoreSlug: string, publicQrToken: string, publicTicketToken: string | null, hasPublicCustomerAccess: boolean, silent = false) => {
    if (!hasPublicCustomerAccess) {
      setPublicMenuReady(false)
      setPublicStore(null)
      setPublicTable(null)
      setPublicOpenTicket(null)
      setPublicCategories([])
      setPublicItems([])
      if (!silent) setCustomerMessage('卓情報が見つかりません。QRコードから開き直してください。')
      return
    }
    if (!silent) {
      setCustomerBusy(true)
      setCustomerMessage(null)
    }
    try {
      const data = await fetchPublicMenu(publicStoreSlug, publicQrToken, publicTicketToken)
      setPublicStore(data.store)
      setPublicTable({ id: data.table.id, label: data.table.label })
      setPublicOpenTicket(
        data.current_ticket
          ? {
              id: data.current_ticket.id,
              ticket_no: data.current_ticket.ticket_no,
              ordered_at: data.current_ticket.ordered_at,
              customer_access_token: data.current_ticket.customer_access_token,
              status: data.current_ticket.status,
            }
          : null,
      )
      if (!publicTicketToken && data.current_ticket?.customer_access_token) {
        syncCustomerTicketInUrl(data.current_ticket.customer_access_token)
        setCustomerAccess(readCustomerAccessParams())
      }
      setPublicCategories(data.categories.map((item) => ({ ...item, is_active: true, parent_category_id: item.parent_category_id ?? null })))
      setPublicItems(data.items.map((item) => ({ ...item, is_active: true, parent_category_id: item.parent_category_id ?? null })))
      setPublicMenuReady(true)
    } catch (err) {
      setPublicMenuReady(false)
      setPublicOpenTicket(null)
      setPublicCategories([])
      setPublicItems([])
      if (!silent) setCustomerMessage(formatError(err))
    } finally {
      if (!silent) setCustomerBusy(false)
    }
  }

  return {
    loadOperationalData,
    loadAdminPrototypeData,
    loadLiveData,
    loadPublicMenu
  }
}
