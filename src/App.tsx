import { useEffect, useMemo, useState, KeyboardEvent } from 'react'
import { AppSidebar } from './components/AppSidebar'
import { AppLauncher } from './components/AppLauncher'
import { PROTOTYPE_STAFF_SESSION_STORAGE_KEY, VIEWS } from './constants'
import { buildAdminBookCategories, buildAdminBookCategorySubcategories, buildAdminPlacements, buildAdminTopCategories, buildAdminVisibleItems } from './lib/adminSelectors'
import {
  buildCustomerUrl,
  formatError,
  formatTime,
  messageTone,
  normalizeAppLocation,
  readCustomerAccessParams,
  readViewFromHash,
  yen,
} from './lib/appUtils'
import { customerApiSupportsTicketBootstrap } from './lib/publicCustomerApi'
import {
  staffReadApiEnabled,
  staffReadStoreSlugOverride,
} from './lib/staffReadApi'
import { kdsStatusLabel } from './lib/staffUtils'
import { AdminScreen } from './screens/AdminScreen'
import { CustomerScreen } from './screens/CustomerScreen'
import { CustomerTabletScreen } from './screens/CustomerTabletScreen'
import { KdsScreen } from './screens/KdsScreen'
import { StaffScreen } from './screens/StaffScreen'
import type {
  ActiveStoreSummary,
  AppView,
  ReceiptSummaryLine,
} from './types'

import { useAuth } from './hooks/useAuth'
import { useAdminForm } from './hooks/useAdminForm'
import { useStaffData } from './hooks/useStaffData'
import { useDataLoading } from './hooks/useDataLoading'
import { useAdminOperations } from './hooks/useAdminOperations'
import { useCustomerFlow } from './hooks/useCustomerFlow'
import { useStaffOperations } from './hooks/useStaffOperations'

export default function App() {
  normalizeAppLocation()
  const {
    email, setEmail,
    password, setPassword,
    session, setSession,
    profile, setProfile,
    authBusy,
    handleSignIn,
    handleSignOut
  } = useAuth()

  const [view, setView] = useState<AppView>(() => readViewFromHash() || 'customer')
  const custFlow = useCustomerFlow(view)
  const adminForm = useAdminForm()
  const staffData = useStaffData()

  const {
    liveStore, setLiveStore,
    liveTickets, setLiveTickets,
    liveLines, setLiveLines,
    livePaymentEntries, setLivePaymentEntries,
    liveTables, setLiveTables,
    liveMenuBooks, setLiveMenuBooks,
    liveMenuBookItems, setLiveMenuBookItems,
    liveCategories, setLiveCategories,
    liveSubcategories, setLiveSubcategories,
    liveBookCategories, setLiveBookCategories,
    liveBookCategorySubcategories, setLiveBookCategorySubcategories,
    liveBookSubcategoryItems, setLiveBookSubcategoryItems,
    liveStaffUsers, setLiveStaffUsers,
    liveItems, setLiveItems,
    selectedTicketId, setSelectedTicketId,
    staffDirectAction, setStaffDirectAction,
    staffHandyTopCategories, setStaffHandyTopCategories,
    staffHandySubCategories, setStaffHandySubCategories,
    staffHandyItems, setStaffHandyItems,
    selectedTicket,
    selectedLines,
    selectedPaymentEntries,
    cancelledLines,
    activeLines,
    selectedSummary,
    activeLiveTickets,
    liveTicketSummaries,
  } = staffData

  const {
    customerAccess, setCustomerAccess,
    publicStoreSlug, publicQrToken, publicTicketToken, effectivePublicTicketToken, hasPublicCustomerAccess,
    customerBusy, setCustomerBusy,
    customerMessage, setCustomerMessage,
    cart, setCart,
    publicMenuReady, setPublicMenuReady,
    publicStore, setPublicStore,
    publicTable, setPublicTable,
    publicOpenTicket, setPublicOpenTicket,
    publicCategories, setPublicCategories,
    publicItems, setPublicItems,
    selectedCustomerTopCategoryId, setSelectedCustomerTopCategoryId,
    selectedCustomerCategoryId, setSelectedCustomerCategoryId,
    customerFocusedItemId, setCustomerFocusedItemId,
    customerStep, setCustomerStep,
    ticketReceipt, setTicketReceipt,
    customerCategories, customerMenuItems, customerTopCategories, customerSubCategories,
    cartItems, cartCount, cartSubtotal,
    selectedCustomerTopCategoryIdSafe, selectedCustomerCategoryIdSafe,
    visibleCustomerItems,
    handleSubmitCustomerOrder, refreshCustomerTicket, returnToCustomerMenu
  } = custFlow

  const [loadBusy, setLoadBusy] = useState(false)
  const [mutationBusy, setMutationBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [staffMessage, setStaffMessage] = useState<string | null>(null)
  const [adminMessage, setAdminMessage] = useState<string | null>(null)
  const [isLauncherOpen, setIsLauncherOpen] = useState(false)

  const [draftQuantities, setDraftQuantities] = useState<Record<string, number>>({})
  const [handyItemId, setHandyItemId] = useState('')
  const [handyQty, setHandyQty] = useState('1')
  const [newTicketMenuBookId, setNewTicketMenuBookId] = useState('')

  const [kdsMode, setKdsMode] = useState<'all' | 'table'>('all')
  const [kdsSelectedTableName, setKdsSelectedTableName] = useState<string | null>(null)

  const { loadOperationalData, loadAdminPrototypeData, loadLiveData, loadPublicMenu } = useDataLoading({
    setLoadBusy, setError, setProfile, setLiveStore, setLiveTickets, setLiveLines, setLivePaymentEntries,
    setLiveTables, setLiveMenuBooks, setLiveMenuBookItems, setLiveCategories, setLiveSubcategories,
    setLiveBookCategories, setLiveBookCategorySubcategories, setLiveBookSubcategoryItems, setLiveItems, setLiveStaffUsers,
    setNewTicketMenuBookId,
    setAdminMenuBookId: adminForm.setAdminMenuBookId,
    setAdminPlacementMenuBookId: adminForm.setAdminPlacementMenuBookId,
    setAdminCategoryParentId: adminForm.setAdminCategoryParentId,
    setAdminItemCategoryId: adminForm.setAdminItemCategoryId,
    setAdminPlacementTopCategoryId: adminForm.setAdminPlacementTopCategoryId,
    setAdminPlacementCategoryId: adminForm.setAdminPlacementCategoryId,
    setAdminPlacementItemId: adminForm.setAdminPlacementItemId,
    setAdminStoreName: adminForm.setAdminStoreName,
    setAdminStoreSlug: adminForm.setAdminStoreSlug,
    setAdminStoreTimezone: adminForm.setAdminStoreTimezone,
    setAdminStoreBusinessOffsetMinutes: adminForm.setAdminStoreBusinessOffsetMinutes,
    setAdminStorePaymentTimingMode: adminForm.setAdminStorePaymentTimingMode,
    setAdminStoreTicketNoResetMode: adminForm.setAdminStoreTicketNoResetMode,
    setAdminStoreTicketNoDigits: adminForm.setAdminStoreTicketNoDigits,
    setPublicStore, setPublicTable, setPublicOpenTicket, setPublicCategories, setPublicItems,
    setPublicMenuReady, setCustomerBusy, setCustomerMessage, setCustomerAccess, setSession
  })

  const adminTopCategories = useMemo(() => buildAdminTopCategories(liveCategories), [liveCategories])
  const adminVisibleItems = useMemo(
    () => buildAdminVisibleItems(liveBookSubcategoryItems, liveItems, adminForm.adminMenuBookId),
    [adminForm.adminMenuBookId, liveBookSubcategoryItems, liveItems],
  )
  const adminPlacements = useMemo(
    () => buildAdminPlacements(liveBookSubcategoryItems, liveMenuBooks, liveBookCategorySubcategories, liveCategories, liveSubcategories, liveItems),
    [liveBookCategorySubcategories, liveBookSubcategoryItems, liveCategories, liveItems, liveMenuBooks, liveSubcategories],
  )
  const adminBookCategories = useMemo(
    () => buildAdminBookCategories(liveBookCategories, liveMenuBooks, liveCategories),
    [liveBookCategories, liveCategories, liveMenuBooks],
  )
  const adminBookCategorySubcategories = useMemo(
    () => buildAdminBookCategorySubcategories(liveBookCategorySubcategories, liveMenuBooks, liveCategories, liveSubcategories),
    [liveBookCategorySubcategories, liveCategories, liveMenuBooks, liveSubcategories],
  )
  const adminTables = useMemo(
    () =>
      liveTables.map((table) => ({
        ...table,
        customer_url: buildCustomerUrl(window.location, liveStore?.slug || publicStoreSlug, table.qr_token),
      })),
    [liveStore?.slug, liveTables, publicStoreSlug],
  )

  const adminOps = useAdminOperations({
    profile,
    liveStore,
    adminForm,
    liveItems,
    liveBookCategoryRows: adminBookCategories,
    liveBookCategorySubcategoryRows: adminBookCategorySubcategories,
    livePlacements: adminPlacements,
    setMutationBusy,
    setItemImageUploadBusy: adminForm.setItemImageUploadBusy,
    setAdminMessage,
    setError,
    refreshAdminData: async () => {
      const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
      if (storeSlug) await loadAdminPrototypeData(storeSlug)
    },
    refreshLiveData: async () => {
      if (session) await loadLiveData(session, view, PROTOTYPE_STAFF_SESSION_STORAGE_KEY)
    }
  })

  const staffOps = useStaffOperations({
    session, profile, liveLines, liveStore, liveTickets, liveTables, liveMenuBooks,
    staffHandyItems, selectedTicketId, selectedTicket, handyItemId, handyQty, draftQuantities,
    setMutationBusy, setError, setStaffMessage, setLiveLines, setDraftQuantities, setLiveTickets,
    setLivePaymentEntries, setSelectedTicketId, setHandyQty,
    loadLiveData: (s) => loadLiveData(s, view, PROTOTYPE_STAFF_SESSION_STORAGE_KEY)
  })

  const {
    changeLineQuantity, submitLineQuantityUpdate, cancelLine, advanceLineStatus,
    createHandyOrder, createStaffTicket, savePaymentEntry, settleTicket, logPaymentAbort
  } = staffOps




  useEffect(() => {
    document.body.classList.toggle('customer-browser-bg', view === 'customer')
    return () => {
      document.body.classList.remove('customer-browser-bg')
    }
  }, [view])

  useEffect(() => {
    const syncLocationState = () => {
      normalizeAppLocation()
      setView(readViewFromHash() || 'customer')
      setCustomerAccess(readCustomerAccessParams())
    }
    window.addEventListener('hashchange', syncLocationState)
    window.addEventListener('popstate', syncLocationState)
    return () => {
      window.removeEventListener('hashchange', syncLocationState)
      window.removeEventListener('popstate', syncLocationState)
    }
  }, [])



  useEffect(() => {
    if (!session) {
      setProfile(null)
      setLiveStore(null)
      setLiveCategories([])
      setLiveMenuBooks([])
      setLiveMenuBookItems([])
      setLiveSubcategories([])
      setLiveBookCategories([])
      setLiveBookCategorySubcategories([])
      setLiveBookSubcategoryItems([])
      setLiveItems([])
      setLiveTickets([])
      setLiveTables([])
      setLiveStaffUsers([])
      setLiveLines([])
      setLivePaymentEntries([])
      setSelectedTicketId(null)
      setNewTicketMenuBookId('')
      setPublicOpenTicket(null)
      return
    }
    void loadLiveData(session, view, PROTOTYPE_STAFF_SESSION_STORAGE_KEY)
  }, [session])

  useEffect(() => {
    if (!customerApiSupportsTicketBootstrap || publicMenuReady || customerBusy || !hasPublicCustomerAccess) return
    void loadPublicMenu(publicStoreSlug, publicQrToken, publicTicketToken, hasPublicCustomerAccess)
  }, [customerBusy, hasPublicCustomerAccess, publicMenuReady, publicQrToken, publicStoreSlug, publicTicketToken])

  useEffect(() => {
    if (!session || view === 'customer') return
    if (!profile) return
    if (staffReadApiEnabled && (view === 'admin' || view === 'sales')) return
    const timer = window.setInterval(() => void loadOperationalData(profile, liveStore?.slug), 5000)
    return () => window.clearInterval(timer)
  }, [liveStore?.slug, profile, session, view])

  useEffect(() => {
    if (!staffReadApiEnabled || (view !== 'admin' && view !== 'sales' && view !== 'staff' && view !== 'kds') || !profile) return
    const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
    if (!storeSlug) return
    void loadAdminPrototypeData(storeSlug).catch((err) => setError(formatError(err)))
  }, [liveStore?.slug, profile, view])



  useEffect(() => {
    const nextDrafts = Object.fromEntries(
      liveLines
        .filter((line) => line.order_ticket_id === selectedTicketId && line.kds_status !== 'CANCELLED')
        .map((line) => [line.id, line.quantity]),
    )
    setDraftQuantities(nextDrafts)
  }, [liveLines, selectedTicketId])

  useEffect(() => {
    const firstAvailableItem = liveItems.find((item) => item.is_active && !item.is_sold_out)
    if (firstAvailableItem && !handyItemId) setHandyItemId(firstAvailableItem.id)
  }, [handyItemId, liveItems])

  useEffect(() => {
    if (!customerMessage) return
    const timer = window.setTimeout(() => setCustomerMessage(null), 10000)
    return () => window.clearTimeout(timer)
  }, [customerMessage, setCustomerMessage])

  useEffect(() => {
    if (!adminMessage) return
    const timer = window.setTimeout(() => setAdminMessage(null), 4000)
    return () => window.clearTimeout(timer)
  }, [adminMessage, setAdminMessage])

  const publicTicketIsOpen = !publicOpenTicket || publicOpenTicket.status === 'OPEN'
  const customerCanViewMyOrder = Boolean(ticketReceipt && publicTicketIsOpen)
  const customerApiAvailable = customerApiSupportsTicketBootstrap
  const customerOrderingEnabled = customerApiSupportsTicketBootstrap
    ? hasPublicCustomerAccess && publicTicketIsOpen
    : false

  const availableTables = useMemo(() => {
    const occupiedTableIds = new Set(activeLiveTickets.map((ticket) => ticket.table_ref_id))
    return liveTables.filter((table) => !occupiedTableIds.has(table.id))
  }, [activeLiveTickets, liveTables])

  const selectedCustomerTable = useMemo(() => {
    const normalizedTableName = selectedSummary?.tableName?.trim().toLowerCase() ?? ''
    return (
      (selectedTicket ? liveTables.find((table) => table.id === selectedTicket.table_ref_id) : null) ??
      (selectedSummary
        ? liveTables.find((table) => {
            const label = table.label.trim().toLowerCase()
            return label === normalizedTableName || label.includes(normalizedTableName) || normalizedTableName.includes(label)
          })
        : null) ??
      null
    )
  }, [liveTables, selectedSummary, selectedTicket])

  const selectedCustomerQrToken = selectedCustomerTable?.qr_token ?? null

  const selectedCustomerUrl = useMemo(() => {
    // If we have a ticket with an access token, use it to build a full URL
    const ticketToken = selectedTicket?.customer_access_token || (selectedSummary?.customerUrl?.length && selectedSummary.customerUrl.length > 20 ? selectedSummary.customerUrl : null)
    
    const storeSlugForCustomer = liveStore?.slug || publicStoreSlug
    if (storeSlugForCustomer && selectedCustomerQrToken) {
      return buildCustomerUrl(window.location, storeSlugForCustomer, selectedCustomerQrToken, ticketToken)
    }
    
    // Fallback to summary's URL only if it looks like a full URL
    if (selectedSummary?.customerUrl && selectedSummary.customerUrl.startsWith('http')) {
      return selectedSummary.customerUrl
    }
    
    return null
  }, [liveStore?.slug, publicStoreSlug, selectedCustomerQrToken, selectedSummary, selectedTicket])


  const loginCandidates = useMemo(
    () =>
      liveStaffUsers
        .filter((staffUser) => staffUser.is_active && Boolean(staffUser.email))
        .map((staffUser) => ({
          email: staffUser.email ?? '',
          displayName: staffUser.display_name,
          roleType: staffUser.role_type,
        }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName, 'ja')),
    [liveStaffUsers],
  )

  const kdsQueue = useMemo(() => {
    if (liveLines.length === 0 || activeLiveTickets.length === 0) {
      return []
    }
    const openTicketIds = new Set(activeLiveTickets.map((ticket) => ticket.id))
    return liveLines
      .filter((line) => line.order_ticket_id && openTicketIds.has(line.order_ticket_id))
      .filter((line) => line.kds_status !== 'SERVED' && line.kds_status !== 'CANCELLED')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((line) => {
        const ticket = activeLiveTickets.find((item) => item.id === line.order_ticket_id)
        const table = liveTables.find((item) => item.id === ticket?.table_ref_id)
        const item = liveItems.find((i) => i.id === line.item_id)
        const relation = liveBookSubcategoryItems.find((r) => r.menu_book_id === ticket?.menu_book_id && r.menu_item_id === line.item_id)
          || liveBookSubcategoryItems.find((r) => r.menu_item_id === line.item_id)
        const subcategory = relation
          ? liveSubcategories.find((s) => s.id === relation.menu_subcategory_id)
          : undefined
        const qty = line.quantity
        return {
          id: line.id,
          itemName: line.item_name_snapshot,
          qty,
          name: item?.name ?? 'Unknown Item',
          price: item?.price ?? 0,
          soldOut: item?.is_sold_out ?? false,
          imageUrl: item?.image_url ?? null,
          status: line.kds_status as any,
          ticketNo: ticket?.ticket_no ?? '-',
          tableName: table?.label ?? '-',
          createdAt: line.created_at,
          subcategoryName: subcategory?.name ?? 'その他',
          subcategorySortOrder: subcategory?.sort_order ?? 9999,
        }
      })
  }, [activeLiveTickets, liveLines, liveTables, liveItems, liveSubcategories, liveBookSubcategoryItems, session])

  const kdsTableOptions = useMemo(
    () =>
      [...new Set(kdsQueue.map((item) => item.tableName))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'ja')),
    [kdsQueue],
  )

  useEffect(() => {
    if (kdsTableOptions.length === 0) {
      setKdsSelectedTableName(null)
      if (kdsMode === 'table') setKdsMode('all')
      return
    }
    if (!kdsSelectedTableName || !kdsTableOptions.includes(kdsSelectedTableName)) {
      setKdsSelectedTableName(kdsTableOptions[0])
    }
  }, [kdsMode, kdsSelectedTableName, kdsTableOptions])

  const visibleKdsQueue = useMemo(() => {
    if (kdsMode === 'table' && kdsSelectedTableName) {
      return kdsQueue.filter((item) => item.tableName === kdsSelectedTableName)
    }
    return kdsQueue
  }, [kdsMode, kdsQueue, kdsSelectedTableName])


  const activeStore: ActiveStoreSummary = {
    name: publicStore?.name ?? liveStore?.name ?? '',
    tableName: publicTable?.label ?? liveTables[0]?.label ?? '',
    ticketNo: ticketReceipt?.ticketNo ?? publicOpenTicket?.ticket_no ?? selectedTicket?.ticket_no ?? '',
  }
  const lastUpdatedText = new Intl.DateTimeFormat('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date())
  const ticketSummaryLines = useMemo<ReceiptSummaryLine[]>(() => {
    if (!ticketReceipt) return []
    const grouped = new Map<string, ReceiptSummaryLine>()
    for (const line of ticketReceipt.lines) {
      const current = grouped.get(line.itemName)
      if (current) {
        current.qty += line.qty
        current.subtotal += line.subtotal
      } else {
        grouped.set(line.itemName, { itemName: line.itemName, qty: line.qty, subtotal: line.subtotal })
      }
    }
    return [...grouped.values()]
  }, [ticketReceipt])



  function moveTo(nextView: AppView) {
    // Both customer views (mobile and tablet) open in a new tab when there is store context available
    if (nextView === 'customer' && view !== 'customer') {
      const targetUrl = selectedCustomerUrl ?? buildCustomerUrl(window.location, publicStoreSlug, publicQrToken)
      if (!targetUrl) return
      window.open(targetUrl, '_blank', 'noopener,noreferrer')
      return
    }

    if (nextView === 'cust-tablet') {
      // Build a tablet URL similar to mobile: same store/qr/ticket params but view=cust-tablet
      const storeSlug = liveStore?.slug || publicStoreSlug
      const qrToken = selectedCustomerQrToken ?? publicQrToken
      const ticketToken = selectedTicket?.customer_access_token ?? effectivePublicTicketToken
      if (storeSlug && qrToken) {
        const tabletUrl = new URL(window.location.origin + window.location.pathname)
        tabletUrl.searchParams.set('view', 'cust-tablet')
        tabletUrl.searchParams.set('store', storeSlug)
        tabletUrl.searchParams.set('qr', qrToken)
        if (ticketToken) tabletUrl.searchParams.set('ticket', ticketToken)
        window.open(tabletUrl.toString(), '_blank', 'noopener,noreferrer')
        return
      }
      // No store context - just navigate in-place (shows loading message)
    }

    const url = new URL(window.location.href)
    url.searchParams.set('view', nextView)
    if (!url.searchParams.get('store') && publicStoreSlug) {
      url.searchParams.set('store', publicStoreSlug)
    }
    if (!url.searchParams.get('qr') && publicQrToken) {
      url.searchParams.set('qr', publicQrToken)
    }
    if (!url.searchParams.get('ticket') && effectivePublicTicketToken) {
      url.searchParams.set('ticket', effectivePublicTicketToken)
    }
    url.hash = ''
    window.history.pushState({}, '', url)
    setView(nextView)
    setCustomerAccess(readCustomerAccessParams())
  }


  function handleSelectableCardKey(event: KeyboardEvent<HTMLElement>, ticketId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setSelectedTicketId(ticketId)
    }
  }

  return (
    <div
      className={`shell ${view === 'customer' ? 'customer-only' : ''} ${view === 'cust-tablet' ? 'cust-tablet-shell' : ''} ${(view === 'admin' || view === 'sales') ? 'admin-mode' : ''} ${view === 'staff' ? 'staff-mode' : ''} ${view === 'kds' ? 'kds-mode' : ''}`}
    >
      <AppLauncher
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
        currentView={view}
        onMove={moveTo}
        onSignOut={() => void handleSignOut()}
        session={session}
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSignIn={(e) => handleSignIn(e)}
        authBusy={authBusy}
        error={error}
        loginCandidates={loginCandidates}
        onPickLoginCandidate={setEmail}
      />


      {false && (
        <AppSidebar
          view={view}
          views={VIEWS}
          session={session}
          authEnabled={true}
          authModeLabel="Staff Login"
          publicMenuReady={publicMenuReady}
          loginCandidates={loginCandidates}
          email={email}
          password={password}
          authBusy={authBusy}
          profile={profile}
          liveStoreName={liveStore?.name ?? activeStore.name}
          error={error}
          onMove={moveTo}
          onPickLoginCandidate={setEmail}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSignIn={(e) => handleSignIn(e)}
          onSignOut={() => void handleSignOut()}
          onDirectAction={(action) => {
            setView('staff')
            setStaffDirectAction(action)
          }}
        />
      )}
      <main className="content">
        {view === 'customer' ? (
          <CustomerScreen
            activeStoreName={activeStore.name}
            activeTableName={activeStore.tableName}
            activeTicketNo={activeStore.ticketNo}
            customerStep={customerStep}
            customerMessage={customerMessage}
            customerBusy={customerBusy}
            customerTopCategories={customerTopCategories}
            customerSubCategories={customerSubCategories}
            selectedCustomerTopCategoryId={selectedCustomerTopCategoryIdSafe}
            selectedCustomerCategoryId={selectedCustomerCategoryIdSafe}
            visibleCustomerItems={visibleCustomerItems}
            ticketReceipt={ticketReceipt}
            ticketSummaryLines={ticketSummaryLines}
            cart={cart}
            cartItems={cartItems}
            cartCount={cartCount}
            cartSubtotal={cartSubtotal}
            customerFocusedItemId={customerFocusedItemId}
            customerOrderingEnabled={customerOrderingEnabled}
            customerCanViewMyOrder={customerCanViewMyOrder}
            publicMenuReady={publicMenuReady}
            customerApiAvailable={customerApiAvailable}
            formatTime={formatTime}
            yen={yen}
            messageTone={messageTone}
            onSelectTopCategory={setSelectedCustomerTopCategoryId}
            onSelectCategory={setSelectedCustomerCategoryId}
            onFocusItem={setCustomerFocusedItemId}
            onDecrementItem={(itemId) => {
              setCustomerFocusedItemId(itemId)
              setCart((current) => ({ ...current, [itemId]: Math.max((current[itemId] ?? 0) - 1, 0) }))
            }}
            onIncrementItem={(itemId) => {
              setCustomerFocusedItemId(itemId)
              setCart((current) => ({ ...current, [itemId]: (current[itemId] ?? 0) + 1 }))
            }}
            onReloadMenu={() => void loadPublicMenu(publicStoreSlug, publicQrToken, publicTicketToken, hasPublicCustomerAccess)}
            onOpenMyOrder={() => setCustomerStep('myOrder')}
            onOpenConfirm={() => setCustomerStep('confirm')}
            onBackToMenu={returnToCustomerMenu}
            onSubmitOrder={() => void handleSubmitCustomerOrder(session, (s) => loadLiveData(s, view, PROTOTYPE_STAFF_SESSION_STORAGE_KEY), (silent) => loadPublicMenu(publicStoreSlug, publicQrToken, publicTicketToken, hasPublicCustomerAccess, silent))}
            onRefreshTicket={() => void refreshCustomerTicket()}
          />
        ) : null}
        {view === 'cust-tablet' ? (
          <CustomerTabletScreen
            activeStoreName={activeStore.name}
            activeTableName={activeStore.tableName}
            activeTicketNo={activeStore.ticketNo}
            customerTopCategories={customerTopCategories}
            customerSubCategories={customerSubCategories}
            selectedCustomerTopCategoryId={selectedCustomerTopCategoryIdSafe}
            selectedCustomerCategoryId={selectedCustomerCategoryIdSafe}
            visibleCustomerItems={visibleCustomerItems}
            cart={cart}
            cartCount={cartCount}
            cartSubtotal={cartSubtotal}
            customerOrderingEnabled={customerOrderingEnabled}
            customerBusy={customerBusy}
            publicMenuReady={publicMenuReady}
            customerApiAvailable={customerApiAvailable}
            yen={yen}
            onSelectTopCategory={setSelectedCustomerTopCategoryId}
            onSelectCategory={setSelectedCustomerCategoryId}
            onDecrementItem={(itemId) => {
              setCart((current) => ({ ...current, [itemId]: Math.max((current[itemId] ?? 0) - 1, 0) }))
            }}
            onIncrementItem={(itemId) => {
              setCart((current) => ({ ...current, [itemId]: (current[itemId] ?? 0) + 1 }))
            }}
            customerStep={customerStep}
            customerMessage={customerMessage}
            cartItems={cartItems}
            onOpenConfirm={() => setCustomerStep('confirm')}
            onBackToMenu={returnToCustomerMenu}
            onSubmitOrder={() => void handleSubmitCustomerOrder(session, (s) => loadLiveData(s, view, PROTOTYPE_STAFF_SESSION_STORAGE_KEY), (silent) => loadPublicMenu(publicStoreSlug, publicQrToken, publicTicketToken, hasPublicCustomerAccess, silent))}
            selectedCustomerUrl={selectedCustomerUrl}
          />

        ) : null}
        {view === 'staff' || view === 'handy' ? (
          <StaffScreen
            isHandyMode={view === 'handy'}
            staffReadOnlyMode={staffReadApiEnabled}
            staffPrototypeDebug={
              staffReadApiEnabled
                ? `prototype store=${staffReadStoreSlugOverride || liveStore?.slug || '(missing)'} tickets=${liveTicketSummaries.length}`
                : null
            }
            storeName={liveStore?.name ?? activeStore.name}
            lastUpdatedText={lastUpdatedText}
            ticketCount={liveTicketSummaries.length}
            selectedTicketExists={Boolean(selectedTicket)}
            handyItemId={handyItemId}
            handyQty={handyQty}
            staffMessage={staffMessage}
            selectedSummary={selectedSummary}
            selectedTicketId={selectedTicketId}
            liveTicketSummaries={liveTicketSummaries}
            selectedLines={selectedLines}
            cancelledLineCount={cancelledLines.length}
            draftQuantities={draftQuantities}
            liveItems={liveItems}
            handyTopCategories={staffHandyTopCategories}
            handySubCategories={staffHandySubCategories}
            handyItems={staffHandyItems}
            roleType={profile?.role_type ?? null}
            mutationBusy={mutationBusy}
            selectedPaymentEntries={selectedPaymentEntries}
            availableTables={availableTables}
            liveMenuBooks={liveMenuBooks}
            newTicketMenuBookId={newTicketMenuBookId}
            selectedCustomerUrl={selectedCustomerUrl}
            yen={yen}
            kdsStatusLabel={kdsStatusLabel}
            messageTone={messageTone}
            onSelectTicket={setSelectedTicketId}
            onTicketKeyDown={(event, ticketId) => handleSelectableCardKey(event, ticketId)}
            onChangeLineQuantity={changeLineQuantity}
            onSubmitLineQuantityUpdate={(lineId) => void submitLineQuantityUpdate(lineId)}
            onCancelLine={(lineId) => void cancelLine(lineId)}
            onHandyItemChange={setHandyItemId}
            onHandyQtyChange={setHandyQty}
            onCreateHandyOrder={(itemId, qty) => void createHandyOrder(itemId, qty)}
            onNewTicketMenuBookChange={setNewTicketMenuBookId}
            onCreateTicket={(tableRefId, menuBookId, customerCount) => createStaffTicket(tableRefId, menuBookId, customerCount)}
            onOpenLauncher={() => setIsLauncherOpen(true)}
            onSavePaymentEntry={(payload) => savePaymentEntry(payload)}
            onCloseTicket={() => settleTicket()}
            onAbortPayment={logPaymentAbort}
            directAction={staffDirectAction}
            onClearDirectAction={() => setStaffDirectAction(null)}
          />
        ) : null}
        {view === 'kds' ? (
          <KdsScreen
            queue={visibleKdsQueue}
            tableOptions={kdsTableOptions}
            mode={kdsMode}
            selectedTableName={kdsSelectedTableName}
            mutationBusy={mutationBusy}
            formatTime={formatTime}
            kdsStatusLabel={kdsStatusLabel}
            onModeChange={setKdsMode}
            onSelectTable={setKdsSelectedTableName}
            onAdvanceStatus={(lineId) => void advanceLineStatus(lineId)}
            onOpenLauncher={() => setIsLauncherOpen(true)}
          />
        ) : null}
        {view === 'admin' || view === 'sales' ? (
          <AdminScreen
            key={view}
            mode={view === 'sales' ? 'sales' : 'master'}
            storeName={liveStore?.name ?? activeStore.name}
            categoryCount={liveCategories.length}
            itemCount={adminVisibleItems.length}
            roleType={profile?.role_type ?? null}
            adminReadOnlyMode={staffReadApiEnabled}
            adminMessage={adminMessage}
            mutationBusy={mutationBusy}
            liveStoreSettings={liveStore}
            liveMenuBooks={liveMenuBooks}
            liveParentCategories={adminTopCategories}
            liveCategories={liveSubcategories.map((subcategory) => ({ id: subcategory.id, name: subcategory.name, sort_order: subcategory.sort_order, parent_category_id: subcategory.parent_category_id ?? null }))}
            liveMenuItems={liveItems.map((item) => ({ ...item }))}
            visibleItems={adminVisibleItems}
            liveBookCategoryRows={adminBookCategories}
            liveBookCategorySubcategoryRows={adminBookCategorySubcategories}
            livePlacements={adminPlacements}
            liveTables={adminTables}
            liveStaffUsers={liveStaffUsers}
            adminMenuBookName={adminForm.adminMenuBookName}
            adminMenuBookCode={adminForm.adminMenuBookCode}
            adminMenuBookDescription={adminForm.adminMenuBookDescription}
            adminMenuBookSortOrder={adminForm.adminMenuBookSortOrder}
            adminMenuBookIsActive={adminForm.adminMenuBookIsActive}
            adminMenuBookAvailableFromTime={adminForm.adminMenuBookAvailableFromTime}
            adminMenuBookAvailableToTime={adminForm.adminMenuBookAvailableToTime}
            adminMenuBookValidFrom={adminForm.adminMenuBookValidFrom}
            adminMenuBookValidTo={adminForm.adminMenuBookValidTo}
            editingMenuBookId={adminForm.editingMenuBookId}
            adminCategoryName={adminForm.adminCategoryName}
            adminCategorySortOrder={adminForm.adminCategorySortOrder}
            editingCategoryId={adminForm.editingCategoryId}
            adminSubCategoryName={adminForm.adminSubCategoryName}
            adminSubCategorySortOrder={adminForm.adminSubCategorySortOrder}
            adminSubCategoryParentCategoryId={adminForm.adminCategoryParentId}
            editingSubCategoryId={adminForm.editingSubCategoryId}
            adminMenuBookId={adminForm.adminMenuBookId}
            adminItemCategoryId={adminForm.adminItemCategoryId}
            adminItemCode={adminForm.adminItemCode}
            adminItemName={adminForm.adminItemName}
            adminItemPrice={adminForm.adminItemPrice}
            adminItemTaxType={adminForm.adminItemTaxType}
            adminItemImageUrl={adminForm.adminItemImageUrl}
            adminItemSortOrder={adminForm.adminItemSortOrder}
            adminItemIsActive={adminForm.adminItemIsActive}
            adminItemIsSoldOut={adminForm.adminItemIsSoldOut}
            itemImageUploadBusy={adminForm.itemImageUploadBusy}
            editingMenuItemId={adminForm.editingMenuItemId}
            adminPlacementMenuBookId={adminForm.adminPlacementMenuBookId}
            adminPlacementTopCategoryId={adminForm.adminPlacementTopCategoryId}
            adminPlacementCategoryId={adminForm.adminPlacementCategoryId}
            adminPlacementItemId={adminForm.adminPlacementItemId}
            adminPlacementDisplayNameOverride={adminForm.adminPlacementDisplayNameOverride}
            adminPlacementDescriptionOverride={adminForm.adminPlacementDescriptionOverride}
            editingPlacementId={adminForm.editingPlacementId}
            adminStoreName={adminForm.adminStoreName}
            adminStoreSlug={adminForm.adminStoreSlug}
            adminStoreTimezone={adminForm.adminStoreTimezone}
            adminStoreBusinessOffsetMinutes={String(adminForm.adminStoreBusinessOffsetMinutes)}
            adminStorePaymentTimingMode={adminForm.adminStorePaymentTimingMode}
            adminStoreTicketNoResetMode={adminForm.adminStoreTicketNoResetMode}
            adminStoreTicketNoDigits={String(adminForm.adminStoreTicketNoDigits)}
            adminTableLabel={adminForm.adminTableLabel}
            adminTableQrToken={adminForm.adminTableQrToken}
            adminTableGroupName={adminForm.adminTableGroupName}
            adminTableSortOrder={adminForm.adminTableSortOrder}
            adminTableIsActive={adminForm.adminTableIsActive}
            editingTableId={adminForm.editingTableId}
            adminStaffEmail={adminForm.adminStaffEmail}
            adminStaffPassword={adminForm.adminStaffPassword}
            adminStaffDisplayName={adminForm.adminStaffDisplayName}
            adminStaffRoleType={adminForm.adminStaffRoleType}
            adminStaffIsActive={adminForm.adminStaffIsActive}
            editingStaffUserId={adminForm.editingStaffUserId}
            yen={yen}
            messageTone={messageTone}
            onMenuBookNameChange={adminForm.setAdminMenuBookName}
            onMenuBookCodeChange={adminForm.setAdminMenuBookCode}
            onMenuBookDescriptionChange={adminForm.setAdminMenuBookDescription}
            onMenuBookSortOrderChange={adminForm.setAdminMenuBookSortOrder}
            onMenuBookIsActiveChange={adminForm.setAdminMenuBookIsActive}
            onMenuBookAvailableFromTimeChange={adminForm.setAdminMenuBookAvailableFromTime}
            onMenuBookAvailableToTimeChange={adminForm.setAdminMenuBookAvailableToTime}
            onMenuBookValidFromChange={adminForm.setAdminMenuBookValidFrom}
            onMenuBookValidToChange={adminForm.setAdminMenuBookValidTo}
            onCreateMenuBook={() => void adminOps.createMenuBook()}
            onEditMenuBook={(id) => {
              const book = liveMenuBooks.find((b) => b.id === id)
              if (book) adminForm.startEditMenuBook(book)
            }}
            onDeleteMenuBook={(id) => void adminOps.deleteMenuBook(id)}
            onCancelMenuBookEdit={adminForm.resetBook}
            onStoreNameChange={adminForm.setAdminStoreName}
            onStoreSlugChange={adminForm.setAdminStoreSlug}
            onStoreTimezoneChange={adminForm.setAdminStoreTimezone}
            onStoreBusinessOffsetMinutesChange={(v) => adminForm.setAdminStoreBusinessOffsetMinutes(Number(v))}
            onStorePaymentTimingModeChange={adminForm.setAdminStorePaymentTimingMode}
            onStoreTicketNoResetModeChange={adminForm.setAdminStoreTicketNoResetMode}
            onStoreTicketNoDigitsChange={(v) => adminForm.setAdminStoreTicketNoDigits(Number(v))}
            onSaveStoreSettings={() => void adminOps.saveStoreSettings()}
            onDeleteStaffUser={(id) => void adminOps.deleteStaffUser(id)}
            onOpenLauncher={() => setIsLauncherOpen(true)}
            onTableLabelChange={adminForm.setAdminTableLabel}
            onTableQrTokenChange={adminForm.setAdminTableQrToken}
            onTableGroupNameChange={adminForm.setAdminTableGroupName}
            onTableSortOrderChange={adminForm.setAdminTableSortOrder}
            onTableIsActiveChange={adminForm.setAdminTableIsActive}
            onSaveTableRef={() => adminOps.saveTableRef()}
            onEditTable={(id) => {
              const table = availableTables.find((t) => t.id === id)
              if (table) adminForm.startEditTable(table)
            }}
            onDeleteTable={(id) => void adminOps.deleteTable(id)}
            onCancelTableEdit={adminForm.resetTable}
            onStaffEmailChange={adminForm.setAdminStaffEmail}
            onStaffPasswordChange={adminForm.setAdminStaffPassword}
            onStaffDisplayNameChange={adminForm.setAdminStaffDisplayName}
            onStaffRoleTypeChange={adminForm.setAdminStaffRoleType}
            onStaffIsActiveChange={adminForm.setAdminStaffIsActive}
            onSaveStaffUser={() => adminOps.saveStaffUser()}
            onEditStaffUser={(id) => {
              const user = liveStaffUsers.find((u) => u.id === id)
              if (user) adminForm.startEditStaffUser(user)
            }}
            onCancelStaffUserEdit={adminForm.resetStaffUser}
            onCategoryNameChange={adminForm.setAdminCategoryName}
            onCategorySortOrderChange={adminForm.setAdminCategorySortOrder}
            onCreateCategory={() => adminOps.createCategory()}
            onEditCategory={(id) => {
              const cat = liveCategories.find((c) => c.id === id)
              if (cat) adminForm.startEditCategory(cat)
            }}
            onDeleteCategory={(id) => void adminOps.deleteCategory(id)}
            onCancelCategoryEdit={adminForm.resetCategory}
            onSubCategoryNameChange={adminForm.setAdminSubCategoryName}
            onSubCategorySortOrderChange={adminForm.setAdminSubCategorySortOrder}
            onSubCategoryParentCategoryChange={adminForm.setAdminCategoryParentId}
            onCreateSubCategory={() => adminOps.createSubCategory()}
            onEditSubCategory={(id) => {
              const sub = liveSubcategories.find((s) => s.id === id)
              if (sub) adminForm.startEditSubCategory(sub)
            }}
            onDeleteSubCategory={(id) => void adminOps.deleteSubcategory(id)}
            onCancelSubCategoryEdit={adminForm.resetSubCategory}
            onMenuBookChange={adminForm.setAdminMenuBookId}
            onItemCategoryChange={adminForm.setAdminItemCategoryId}
            onItemCodeChange={adminForm.setAdminItemCode}
            onItemNameChange={adminForm.setAdminItemName}
            onItemPriceChange={adminForm.setAdminItemPrice}
            onItemTaxTypeChange={adminForm.setAdminItemTaxType}
            onItemImageUrlChange={adminForm.setAdminItemImageUrl}
            onItemSortOrderChange={adminForm.setAdminItemSortOrder}
            onItemIsActiveChange={adminForm.setAdminItemIsActive}
            onItemIsSoldOutChange={adminForm.setAdminItemIsSoldOut}
            onUploadItemImage={(file) => adminOps.uploadMenuItemImage(file)}
            onClearItemImage={() => adminOps.clearMenuItemImage()}
            onCreateMenuItem={() => adminOps.createMenuItem()}
            onEditMenuItem={(id) => {
              const item = liveItems.find((i) => i.id === id)
              if (item) adminForm.startEditMenuItem(item)
            }}
            onDeleteMenuItem={(id) => void adminOps.deleteMenuItem(id)}
            onToggleSoldOut={(id, soldOut) => void adminOps.toggleSoldOut(id, soldOut)}
            onCancelMenuItemEdit={adminForm.resetItem}
            onPlacementMenuBookChange={adminForm.setAdminPlacementMenuBookId}
            onPlacementTopCategoryChange={adminForm.setAdminPlacementTopCategoryId}
            onPlacementCategoryChange={adminForm.setAdminPlacementCategoryId}
            onPlacementItemChange={adminForm.setAdminPlacementItemId}
            onPlacementDisplayNameOverrideChange={adminForm.setAdminPlacementDisplayNameOverride}
            onPlacementDescriptionOverrideChange={adminForm.setAdminPlacementDescriptionOverride}
            onCreateBookCategory={() => adminOps.createBookCategoryPlacement()}
            onCreateBookCategorySubcategory={() => adminOps.createBookCategorySubcategoryPlacement()}
            onCreatePlacement={() => adminOps.createMenuPlacement()}
            onEditPlacement={(id) => {
              const p = adminPlacements.find((x) => x.id === id)
              if (p) adminForm.startEditPlacement(p)
            }}
            onDeleteBookCategory={(id) => void adminOps.deleteBookCategory(id)}
            onDeleteBookCategorySubcategory={(id) => void adminOps.deleteBookCategorySubcategory(id)}
            onDeletePlacement={(id) => void adminOps.deletePlacement(id)}
            onSaveBookCategorySort={(id, sortOrder) => void adminOps.saveBookCategorySort(id, sortOrder)}
            onSaveBookCategorySubcategorySort={(id, sortOrder) => void adminOps.saveBookCategorySubcategorySort(id, sortOrder)}
            onSavePlacementSort={(id, sortOrder) => void adminOps.savePlacementSort(id, sortOrder)}
            onCancelPlacementEdit={adminForm.resetPlacement}
          />
        ) : null}
      </main>
    </div>
  )
}
