import { useEffect, useMemo, useState } from 'react'
import type { KeyboardEventHandler } from 'react'

import { DirectActionView } from './staff/DirectActionView'
import { StaffPaymentView } from './staff/StaffPaymentView'
import { StaffHandyView } from './staff/StaffHandyView'
import { StaffPrototypeTopCategory, StaffPrototypeSubCategory, StaffPrototypeItem, LivePaymentEntry, LiveTableRef, LiveMenuBook, TicketSummaryView, LiveLine, LiveMenuItem } from '../types'

type PaymentKind = 'CASH' | 'CARD' | 'OTHER'
type TicketFilter = 'new' | 'progress' | 'served' | 'all'

type StaffScreenProps = {
  staffReadOnlyMode: boolean
  staffPrototypeDebug?: string | null
  storeName: string
  lastUpdatedText: string
  ticketCount: number
  selectedTicketExists: boolean
  selectedTicketId: string | null
  handyItemId: string
  handyQty: string
  staffMessage: string | null
  selectedSummary: TicketSummaryView | null
  liveTicketSummaries: TicketSummaryView[]
  selectedLines: LiveLine[]
  cancelledLineCount: number
  draftQuantities: Record<string, number>
  liveItems: LiveMenuItem[]
  handyTopCategories: StaffPrototypeTopCategory[]
  handySubCategories: StaffPrototypeSubCategory[]
  handyItems: StaffPrototypeItem[]
  roleType: 'ADMIN' | 'STAFF' | 'KDS' | null
  mutationBusy: string | null
  selectedPaymentEntries: LivePaymentEntry[]
  availableTables: LiveTableRef[]
  liveMenuBooks: LiveMenuBook[]
  newTicketMenuBookId: string
  selectedCustomerUrl: string | null
  yen: (value: number) => string
  kdsStatusLabel: (status: LiveLine['kds_status'] | 'NEW' | 'COOKING' | 'SERVED') => string
  messageTone: (message: string | null) => 'success' | 'error'
  onSelectTicket: (ticketId: string | null) => void
  onTicketKeyDown: (event: React.KeyboardEvent<HTMLElement>, ticketId: string) => void
  onChangeLineQuantity: (lineId: string, delta: number) => void
  onSubmitLineQuantityUpdate: (lineId: string) => void
  onCancelLine: (lineId: string) => void
  onHandyItemChange: (value: string) => void
  onHandyQtyChange: (value: string) => void
  onCreateHandyOrder: (itemId?: string, qty?: string) => void
  onNewTicketMenuBookChange: (value: string) => void
  onCreateTicket: (tableRefId: string, menuBookId: string, customerCount: number | null) => Promise<boolean>
  onSavePaymentEntry: (payload: {
    paymentType: PaymentKind
    discountAmount: number
    couponAmount: number
    voucherAmount: number
    finalAmount: number
    receivedAmount: number
  }) => Promise<boolean>
  onCloseTicket: () => Promise<boolean>
  onAbortPayment: () => void
  directAction?: 'HANDY' | 'PAYMENT' | null
  onClearDirectAction?: () => void
  terminalName?: string
  isHandyMode?: boolean
  onOpenLauncher?: () => void
}

// Payment method mapping
const METHOD_MAP: Record<string, PaymentKind> = {
  '現金': 'CASH',
  'クレジットカード': 'CARD',
  'QR決済': 'OTHER',
  '商品券': 'OTHER'
};

export function StaffScreen({
  staffReadOnlyMode,
  staffPrototypeDebug,
  storeName,
  lastUpdatedText,
  ticketCount,
  selectedTicketExists,
  selectedTicketId,
  handyItemId,
  handyQty,
  staffMessage,
  selectedSummary,
  liveTicketSummaries,
  selectedLines,
  cancelledLineCount,
  draftQuantities,
  liveItems,
  handyTopCategories,
  handySubCategories,
  handyItems,
  roleType,
  mutationBusy,
  selectedPaymentEntries,
  availableTables,
  liveMenuBooks,
  newTicketMenuBookId,
  selectedCustomerUrl,
  yen,
  kdsStatusLabel,
  messageTone,
  onSelectTicket,
  onTicketKeyDown,
  onChangeLineQuantity,
  onSubmitLineQuantityUpdate,
  onCancelLine,
  onHandyItemChange,
  onHandyQtyChange,
  onCreateHandyOrder,
  onNewTicketMenuBookChange,
  onCreateTicket,
  onSavePaymentEntry,
  onCloseTicket,
  onAbortPayment,
  directAction,
  onClearDirectAction,
  terminalName,
  isHandyMode,
  onOpenLauncher,
}: StaffScreenProps) {
  const [filter, setFilter] = useState<TicketFilter>('all')
  const [keyword, setKeyword] = useState('')
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')
  
  // Independent Full Screens overrides
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showHandyModal, setShowHandyModal] = useState(false)
  
  // Create Ticket Data
  const [newTicketTableId, setNewTicketTableId] = useState('')
  const [newTicketCustomerCount, setNewTicketCustomerCount] = useState('1')
  
  // Handy Data (Shopping Cart Style)
  const [handyTopCategoryId, setHandyTopCategoryId] = useState<string | null>(null)
  const [handySubCategoryId, setHandySubCategoryId] = useState<string | null>(null)
  const [handyCart, setHandyCart] = useState<Array<{id:string, name:string, price:number, qty:number}>>([])

  // Payment Data
  const [currentPaymentInput, setCurrentPaymentInput] = useState('')
  const [payments, setPayments] = useState<Array<{
    id: number
    method: string
    amount: number
    received: number
    change: number
    items?: Array<{ name: string; qty: number; subtotal: number }>
    label?: string
  }>>([])
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [discountRate, setDiscountRate] = useState<number>(0)
  const [paymentFinalized, setPaymentFinalized] = useState(false)
  const [finalizedSummary, setFinalizedSummary] = useState<TicketSummaryView | null>(null)
  const [finalizedLines, setFinalizedLines] = useState<LiveLine[]>([])
  const [finalizedPayments, setFinalizedPayments] = useState<Array<{
    id: number
    method: string
    amount: number
    received: number
    change: number
    items?: Array<{ name: string; qty: number; subtotal: number }>
    label?: string
  }>>([])
  const [finalizedDiscountAmount, setFinalizedDiscountAmount] = useState<number>(0)
  const [finalizedDiscountRate, setFinalizedDiscountRate] = useState<number>(0)
  const [showQrModal, setShowQrModal] = useState(false)
  
  const [calcMode, setCalcMode] = useState<'normal' | 'split' | 'itemized'>('normal')
  // Track source of currentPaymentInput to decide whether next numpad entry should replace or append
  const [inputSource, setInputSource] = useState<'modal' | 'manual'>('manual')
  const [splitCount, setSplitCount] = useState<number>(2)
  const [calculatingLineQtys, setCalculatingLineQtys] = useState<Record<string, number>>({})
  const [paidLineQtys, setPaidLineQtys] = useState<Record<string, number>>({})

  const [targetPaymentAmount, setTargetPaymentAmount] = useState<number | null>(null)
  const [pendingPaymentItems, setPendingPaymentItems] = useState<Array<{ name: string; qty: number; subtotal: number }>>([])

  // Synchronize paidLineQtys with payments and pendingPaymentItems
  useEffect(() => {
    const newPaid: Record<string, number> = {}
    
    const allocate = (name: string, qty: number) => {
      const matchingLines = selectedLines.filter(l => l.item_name_snapshot === name)
      let remainingQty = qty
      for (const line of matchingLines) {
        if (remainingQty <= 0) break
        const currentAllocated = newPaid[line.id] || 0
        const available = Math.max(0, line.quantity - currentAllocated)
        const toAlloc = Math.min(remainingQty, available)
        newPaid[line.id] = currentAllocated + toAlloc
        remainingQty -= toAlloc
      }
      if (remainingQty > 0 && matchingLines.length > 0) {
        const firstLine = matchingLines[0]
        newPaid[firstLine.id] = (newPaid[firstLine.id] || 0) + remainingQty
      }
    }

    for (const p of payments) {
      if (p.items) {
        for (const item of p.items) {
          allocate(item.name, item.qty)
        }
      }
    }

    for (const item of pendingPaymentItems) {
      allocate(item.name, item.qty)
    }

    setPaidLineQtys(newPaid)
  }, [payments, pendingPaymentItems, selectedLines])

  // Clear calculatingLineQtys when payments and pendingPaymentItems are reset
  useEffect(() => {
    if (payments.length === 0 && pendingPaymentItems.length === 0) {
      setCalculatingLineQtys({})
    }
  }, [payments, pendingPaymentItems])

  const waitingCount = liveTicketSummaries.filter((ticket) => ticket.status === 'NEW').length
  const cookingCount = liveTicketSummaries.filter((ticket) => ticket.status === 'COOKING').length
  
  const filteredTickets = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    return liveTicketSummaries.filter((ticket) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'new' && ticket.status === 'NEW') ||
        (filter === 'progress' && ticket.status === 'COOKING') ||
        (filter === 'served' && ticket.status === 'SERVED')
      const matchesKeyword = normalized.length === 0 || ticket.tableName.toLowerCase().includes(normalized) || ticket.ticketNo.toLowerCase().includes(normalized)
      return matchesFilter && matchesKeyword
    })
  }, [filter, keyword, liveTicketSummaries])

  useEffect(() => {
    if (availableTables.length === 0) { setNewTicketTableId(''); return }
    setNewTicketTableId((current) => current && availableTables.some((table) => table.id === current) ? current : availableTables[0].id)
  }, [availableTables])

  useEffect(() => {
    const nextTopCategoryId = handyTopCategories[0]?.id ?? null
    setHandyTopCategoryId((current) => current && handyTopCategories.some((category) => category.id === current) ? current : nextTopCategoryId)
  }, [handyTopCategories])

  const visibleHandySubCategories = useMemo(() => handySubCategories.filter((category) => category.parentId === handyTopCategoryId), [handySubCategories, handyTopCategoryId])
  const visibleHandyItems = useMemo(() => handyItems.filter((item) => item.subcategoryId === handySubCategoryId), [handyItems, handySubCategoryId])

  useEffect(() => {
    const nextSubCategoryId = visibleHandySubCategories[0]?.id ?? null
    setHandySubCategoryId((current) => current && visibleHandySubCategories.some((category) => category.id === current) ? current : nextSubCategoryId)
  }, [visibleHandySubCategories])

  useEffect(() => {
    // Reset payment / handy session when opened/closed or changed ticket
    setPayments([])
    setCurrentPaymentInput('')
    setDiscountAmount(0)
    setDiscountRate(0)
    setCalcMode('normal')
    setSplitCount(2)
    setCalculatingLineQtys({})
    setTargetPaymentAmount(null)
    setPendingPaymentItems([])
    setPaymentFinalized(false)
    setShowPaymentModal(false)  // ← 新規伝票起票/チケット切替時に会計画面を閉じる
    setHandyCart([])
    setShowQrModal(false)
    if (selectedTicketId) setMobileView('detail')
  }, [selectedTicketId])


  /* Create Ticket Handlers */
  function openCreateTicketModal() {
    if (!newTicketTableId && availableTables.length > 0) setNewTicketTableId(availableTables[0].id)
    setShowCreateTicketModal(true)
  }
  const canSubmitCreateTicket = Boolean(newTicketTableId) && (staffReadOnlyMode || Boolean(newTicketMenuBookId))
  async function handleCreateTicket() {
    if (!canSubmitCreateTicket) return
    const count = parseInt(newTicketCustomerCount, 10)
    const ok = await onCreateTicket(newTicketTableId, newTicketMenuBookId, isNaN(count) || count < 1 ? null : count)
    if (ok) {
      setShowCreateTicketModal(false)
      setNewTicketCustomerCount('1')
    }
  }

  /* Handy Cart Handlers */
  const handleAddHandyItem = (item: StaffPrototypeItem) => {
    setHandyCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }]
    })
  }
  const updateHandyQty = (id: string, delta: number) => {
    setHandyCart(prev => prev.map(i => {
      if (i.id === id) return { ...i, qty: i.qty + delta }
      return i
    }).filter(i => i.qty > 0))
  }
  const submitHandyCartToKitchen = async () => {
    if (handyCart.length === 0) return;
    
    const summary = handyCart.map(i => `${i.name} x ${i.qty}`).join('\n')
    if (!window.confirm(`以下の内容で厨房に送信しますか？\n\n${summary}`)) return

    for (const item of handyCart) {
      await onCreateHandyOrder(item.id, String(item.qty))
    }
    setHandyCart([])
    setShowHandyModal(false)
  }

  /* Payment Handlers */
  const selectedSubtotal = selectedSummary?.subtotal ?? 0
  const discountFromRate = Math.floor(selectedSubtotal * (discountRate / 100))
  const totalDiscount = discountAmount + discountFromRate
  const finalBilledAmount = Math.max(0, selectedSubtotal - totalDiscount)

  const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0)
  const remainingTotal = Math.max(0, finalBilledAmount - paidTotal)
  const changeTotal = Math.max(0, payments.reduce((sum, p) => sum + p.change, 0))
  
  const updateCalculatingQty = (id: string, delta: number) => {
    if (id === '__clear__') {
      setCalculatingLineQtys({})
      return
    }
    setCalculatingLineQtys(prev => {
      const current = prev[id] || 0
      return { ...prev, [id]: Math.max(0, current + delta) }
    })
  }

  const getItemUnitPrice = (id: string) => {
    const l = selectedLines.find(x => x.id === id)
    if (!l) return 0
    return Math.round(l.line_subtotal / l.quantity)
  }

  const currentItemizedTotal = Object.entries(calculatingLineQtys).reduce((sum, [id, qty]) => sum + (qty * getItemUnitPrice(id)), 0)

  const processItemizedCalculation = () => {
    if (currentItemizedTotal <= 0) return
    setCurrentPaymentInput(String(currentItemizedTotal))
    setTargetPaymentAmount(currentItemizedTotal)

    const items: Array<{ name: string; qty: number; subtotal: number }> = []
    for (const [id, qty] of Object.entries(calculatingLineQtys)) {
      if (qty > 0) {
        const line = selectedLines.find(x => x.id === id)
        if (line) {
          items.push({
            name: line.item_name_snapshot,
            qty,
            subtotal: qty * getItemUnitPrice(id)
          })
        }
      }
    }
    setPendingPaymentItems(items)
    setCalculatingLineQtys({})
  }

  const handleNumpadPayment = (num: string) => {
    if (num === 'C') {
      setCurrentPaymentInput('')
      setInputSource('manual')
    } else if (inputSource === 'modal') {
      // Replace the whole input when the previous value came from a modal action
      setCurrentPaymentInput(num)
      setInputSource('manual')
    } else if (currentPaymentInput === '0' && num !== '00') {
      setCurrentPaymentInput(num)
    } else {
      setCurrentPaymentInput(prev => prev + num)
    }
  }
  const addPaymentMethod = (methodStr: string) => {
    if (remainingTotal === 0) return
    let inputVal = currentPaymentInput && parseInt(currentPaymentInput) > 0 ? parseInt(currentPaymentInput) : 0
    if (inputVal <= 0) return // Force user to input amount first

    let billedAmt = inputVal
    let receivedAmt = inputVal

    if (targetPaymentAmount !== null) {
      billedAmt = Math.min(targetPaymentAmount, remainingTotal)
      receivedAmt = Math.max(inputVal, billedAmt)
    } else {
      if (inputVal > remainingTotal) {
        billedAmt = remainingTotal
        receivedAmt = inputVal
      }
    }

    const changeAmt = Math.max(0, receivedAmt - billedAmt)

    const isItemizedHistory = payments.some(p => p.label && p.label.includes('個別会計'))
    const isSplitHistory = payments.some(p => p.label && p.label.includes('割勘分'))
    const activeCalcMode = calcMode !== 'normal' ? calcMode : 
                           isItemizedHistory ? 'itemized' :
                           isSplitHistory ? 'split' : 'normal'

    let label = ''
    let items: Array<{ name: string; qty: number; subtotal: number }> = []
    if (pendingPaymentItems.length > 0) {
      items = [...pendingPaymentItems]
      setPendingPaymentItems([])
      label = `個別会計 (${payments.length + 1}人目)`
    } else if (activeCalcMode === 'itemized') {
      const remainingMap: Record<string, { qty: number; unitPrice: number }> = {}
      for (const line of selectedLines) {
        const name = line.item_name_snapshot
        const unitPrice = line.quantity > 0 ? Math.round(line.line_subtotal / line.quantity) : 0
        if (!remainingMap[name]) {
          remainingMap[name] = { qty: 0, unitPrice }
        }
        remainingMap[name].qty += line.quantity
      }
      for (const p of payments) {
        if (p.items) {
          for (const item of p.items) {
            if (remainingMap[item.name]) {
              remainingMap[item.name].qty = Math.max(0, remainingMap[item.name].qty - item.qty)
            }
          }
        }
      }
      for (const [name, info] of Object.entries(remainingMap)) {
        if (info.qty > 0) {
          items.push({
            name,
            qty: info.qty,
            subtotal: info.qty * info.unitPrice
          })
        }
      }
      label = `個別会計 (${payments.length + 1}人目)`
    } else if (targetPaymentAmount !== null || activeCalcMode === 'split') {
      label = `割勘分 (${payments.length + 1}人目)`
    } else {
      label = ''
    }

    setPayments(prev => [
      ...prev,
      {
        id: Date.now(),
        method: methodStr,
        amount: billedAmt,
        received: receivedAmt,
        change: changeAmt,
        items,
        label
      }
    ])
    setCurrentPaymentInput('')
    setTargetPaymentAmount(null)
  }
  
  const applyDiscountAmount = () => {
    const val = parseInt(currentPaymentInput || '0')
    if (val > 0) setDiscountAmount(val)
    setCurrentPaymentInput('')
  }

  const applyDiscountRate = () => {
    const val = parseInt(currentPaymentInput || '0')
    if (val > 0 && val <= 100) setDiscountRate(val)
    setCurrentPaymentInput('')
  }

  const commitPaymentToDB = async () => {
    if (!selectedSummary) return
    if (paidTotal < finalBilledAmount) {
      alert('預かり金額が請求額に達していません。')
      return
    }
    
    // Process each payment method separately
    let remainingDiscountToSave = totalDiscount
    
    for (const p of payments) {
       const saved = await onSavePaymentEntry({
         paymentType: METHOD_MAP[p.method] || 'CASH',
         discountAmount: remainingDiscountToSave,
         couponAmount: 0,
         voucherAmount: 0,
         finalAmount: p.amount,
         receivedAmount: p.received,
       })
       if (!saved) return
       remainingDiscountToSave = 0 // Only apply discount to the first entry to avoid double counting
    }
    
    const closed = await onCloseTicket()
    if (closed) {
      setFinalizedSummary(selectedSummary)
      setFinalizedLines(selectedLines)
      setFinalizedPayments(payments)
      setFinalizedDiscountAmount(discountAmount)
      setFinalizedDiscountRate(discountRate)
      setPaymentFinalized(true)
    }
  }

  /* =======================================
     FULL SCREEN OVERRIDE: Direct Action Selection Grid
     ======================================= */
  if (directAction) {
    return (
      <DirectActionView
        directAction={directAction}
        liveTicketSummaries={liveTicketSummaries}
        onSelectTicket={onSelectTicket}
        onClearDirectAction={() => onClearDirectAction?.()}
        setShowHandyModal={setShowHandyModal}
        setShowPaymentModal={setShowPaymentModal}
        yen={yen}
      />
    )
  }

  const displaySummary = paymentFinalized && finalizedSummary ? finalizedSummary : selectedSummary;
  const displayLines = paymentFinalized && finalizedLines.length > 0 ? finalizedLines : selectedLines;

  if (showPaymentModal && displaySummary) {
    const displayPayments = paymentFinalized ? finalizedPayments : payments;
    const displayDiscountAmount = paymentFinalized ? finalizedDiscountAmount : discountAmount;
    const displayDiscountRate = paymentFinalized ? finalizedDiscountRate : discountRate;

    const subtotal = displaySummary.subtotal ?? 0;
    const rateDiscount = Math.floor(subtotal * (displayDiscountRate / 100));
    const totalDisc = displayDiscountAmount + rateDiscount;
    const billed = Math.max(0, subtotal - totalDisc);
    const paid = displayPayments.reduce((sum, p) => sum + p.amount, 0);
    const change = Math.max(0, displayPayments.reduce((sum, p) => sum + p.change, 0));
    const remaining = Math.max(0, billed - paid);

    return (
      <StaffPaymentView
        selectedSummary={displaySummary}
        selectedLines={displayLines}
        payments={displayPayments as any}
        currentPaymentInput={paymentFinalized ? '' : currentPaymentInput}
        discountAmount={displayDiscountAmount}
        discountRate={displayDiscountRate}
        paymentFinalized={paymentFinalized}
        mutationBusy={mutationBusy}
        storeName={storeName}
        yen={yen}
        setShowPaymentModal={setShowPaymentModal}
        setPayments={setPayments as any}
        setCurrentPaymentInput={setCurrentPaymentInput}
        setDiscountAmount={setDiscountAmount}
        setDiscountRate={setDiscountRate}
        setPaymentFinalized={setPaymentFinalized}
        onSavePaymentEntry={onSavePaymentEntry}
        onCloseTicket={onCloseTicket}
        handleNumpadPayment={handleNumpadPayment}
        addPaymentMethod={addPaymentMethod}
        applyDiscountAmount={applyDiscountAmount}
        applyDiscountRate={applyDiscountRate}
        commitPaymentToDB={commitPaymentToDB}
        calcMode={calcMode}
        setCalcMode={setCalcMode}
        splitCount={splitCount}
        setSplitCount={setSplitCount}
        calculatingLineQtys={calculatingLineQtys}
        updateCalculatingQty={updateCalculatingQty}
        getItemUnitPrice={getItemUnitPrice}
        currentItemizedTotal={currentItemizedTotal}
        processItemizedCalculation={processItemizedCalculation}
        remainingTotal={remaining}
        paidTotal={paid}
        finalBilledAmount={billed}
        discountFromRate={rateDiscount}
        totalDiscount={totalDisc}
        changeTotal={change}
        paidLineQtys={paidLineQtys}
        setInputSource={setInputSource}
        onAbortPayment={onAbortPayment}
        onReceiptClosed={() => {
          const nextTicket = liveTicketSummaries.find(t => t.ticketId !== selectedTicketId)
          onSelectTicket(nextTicket?.ticketId || null)
        }}
        targetPaymentAmount={targetPaymentAmount}
        setTargetPaymentAmount={setTargetPaymentAmount}
        setPendingPaymentItems={setPendingPaymentItems as any}
      />
    )
  }

  const shouldRenderHandy = (showHandyModal || isHandyMode) && selectedSummary;

  if (shouldRenderHandy && selectedSummary) {
    return (
      <StaffHandyView
        selectedSummary={selectedSummary}
        selectedLines={selectedLines}
        handyCart={handyCart}
        handyTopCategories={handyTopCategories}
        visibleHandySubCategories={visibleHandySubCategories}
        visibleHandyItems={visibleHandyItems}
        handyTopCategoryId={handyTopCategoryId}
        handySubCategoryId={handySubCategoryId}
        mutationBusy={mutationBusy}
        yen={yen}
        setShowHandyModal={(v) => {
          if (isHandyMode) {
            onSelectTicket(null)
          } else {
            setShowHandyModal(v)
          }
        }}
        setHandyTopCategoryId={setHandyTopCategoryId}
        setHandySubCategoryId={setHandySubCategoryId}
        handleAddHandyItem={handleAddHandyItem}
                updateHandyQty={updateHandyQty}
        submitHandyCartToKitchen={submitHandyCartToKitchen}
      />
    )
  }

  /* =======================================
     DEFAULT: Staff POS Core Screen
     ======================================= */
  return (
    <div className="staff-app dark-mode" data-testid="staff-screen">
      <header className="staff-header">
        <div className="logo-area">
          <button className="menu-trigger" onClick={onOpenLauncher} aria-label="Open Menu">
            <span className="material-icons">menu</span>
          </button>
          <h2>{storeName} {isHandyMode ? 'Handy' : 'Staff'}</h2>
          <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
            <span className="staff-badge">{isHandyMode ? 'Handyモード' : '稼働中'}</span>
            {terminalName && <span className="staff-badge" style={{background:'#5d7281'}}>{terminalName}</span>}
          </div>
        </div>
        <div className="header-actions">
          {roleType !== 'KDS' && (
            <button className="btn-secondary" onClick={openCreateTicketModal} disabled={mutationBusy === 'create-ticket'}>伝票発行</button>
          )}
        </div>
      </header>

      {staffMessage && <div style={{background:'#ff5a5f', color:'white', padding:'8px', textAlign:'center', zIndex:1000}}>{staffMessage}</div>}

      <div className={`staff-layout ${mobileView === 'detail' ? 'show-detail' : 'show-list'}`}>
        <aside className="ticket-list-pane">
          <div className="pane-header">
            <h3>稼働状況</h3>
            <div className="filter-chips">
              <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>すべて ({liveTicketSummaries.length})</button>
              <button className={`chip ${filter === 'new' ? 'active' : ''}`} onClick={() => setFilter('new')}>新規 ({waitingCount})</button>
              <button className={`chip ${filter === 'progress' ? 'active' : ''}`} onClick={() => setFilter('progress')}>調理中 ({cookingCount})</button>
            </div>
            <input type="search" placeholder="卓番検索" value={keyword} onChange={e => setKeyword(e.target.value)} style={{marginTop:'8px', padding:'6px', borderRadius:'4px', background:'#333', color:'white', border:'none'}} />
          </div>
          <div className="ticket-list">
            {filteredTickets.length === 0 ? <div className="empty-state">表示する伝票がありません</div> : null}
            {filteredTickets.map(t => (
              <div key={t.ticketId} className={`ticket-card ${t.ticketId === selectedTicketId ? 'active' : ''}`} onClick={() => { onSelectTicket(t.ticketId); setMobileView('detail'); }}>
                <div className="ticket-head">
                  <span className="table-name">{t.tableName}</span>
                  <span className={`status-badge ${t.status.toLowerCase()}`}>{t.status === 'NEW' ? '新規' : t.status === 'COOKING' ? '調理中' : '提供済'}</span>
                </div>
                <div className="ticket-meta">
                  <span>{t.orderedAt} / {t.customerCount || 1}名</span>
                  <span>{t.lineCount}点 / {yen(t.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="ticket-detail-pane">
          {selectedSummary ? (
            <>
              <div className="detail-header">
                <div className="title-group">
                  <h2 className="detail-title">
                    <button className="btn-secondary mobile-only" onClick={() => setMobileView('list')} style={{marginRight:'12px', padding:'4px 8px'}}>← 戻る</button>
                    {selectedSummary.tableName} 詳細
                  </h2>
                  <span className="order-time">注文時刻: {selectedSummary.orderedAt} / 伝票: {selectedSummary.ticketNo} / 客数: {selectedSummary.customerCount || 1}名</span>
                </div>
                <div className="action-group">
                  {selectedCustomerUrl && (
                    <button className="btn-secondary" onClick={() => setShowQrModal(true)}>
                      客用QR表示
                    </button>
                  )}
                  <button className="btn-secondary" onClick={() => setShowHandyModal(true)}>注文</button>
                  <button className="btn-primary" onClick={() => setShowPaymentModal(true)}>会計へ進む</button>
                </div>
              </div>

              <div className="order-lines">
                <div className="lines-header">
                  <span>商品名</span>
                  <span>数量</span>
                  <span>小計</span>
                  <span>状態</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                  {selectedLines.map(line => (
                    <div key={line.id} className="line-row">
                      <span className="line-name">{line.item_name_snapshot}</span>
                      <span className="line-qty">
                        <div className="stepper compact" style={{gap:'4px'}}>
                          <button onClick={() => onChangeLineQuantity(line.id, -1)}>-</button>
                          <span>{draftQuantities[line.id] ?? line.quantity}</span>
                          <button onClick={() => onChangeLineQuantity(line.id, 1)}>+</button>
                        </div>
                        {draftQuantities[line.id] !== undefined && draftQuantities[line.id] !== line.quantity && (
                           <button style={{marginLeft:'8px', padding:'2px 6px', background:'#4dabf7', color:'white', border:'none', borderRadius:'4px'}} onClick={() => onSubmitLineQuantityUpdate(line.id)}>更新</button>
                        )}
                      </span>
                      <span className="line-price">{yen(line.line_subtotal)}</span>
                      <span className="line-status">
                        <span className={`status-badge ${line.kds_status.toLowerCase()}`}>{kdsStatusLabel(line.kds_status)}</span>
                        <button style={{marginLeft:'8px', padding:'4px 8px', background:'transparent', color:'#ff5a5f', border:'1px solid #ff5a5f', borderRadius:'4px'}} onClick={() => onCancelLine(line.id)}>取消</button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="summary-box">
                <div className="summary-row total-row">
                  <span>合計</span>
                  <span className="total-price">{yen(selectedSummary.subtotal)}</span>
                </div>
              </div>
            </>
          ) : (
            <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#888', fontSize:'1.2rem'}}>左側のリストから伝票を選択してください</div>
          )}
        </main>
      </div>

      {showCreateTicketModal && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 1000}}>
          <div style={{background:'#222', padding:'32px', borderRadius:'12px', width:'400px', color:'white'}}>
            <h2 style={{fontSize:'1.5rem', marginBottom:'24px', borderBottom:'1px solid #444', paddingBottom:'12px'}}>伝票発行 (テーブル指定)</h2>
            <div style={{display:'flex', flexDirection:'column', gap:'16px', marginBottom:'32px'}}>
              <label>
                <div style={{marginBottom:'8px', color:'#aaa'}}>テーブル選択</div>
                <select value={newTicketTableId} onChange={e => setNewTicketTableId(e.target.value)} style={{width:'100%', padding:'12px', background:'#111', color:'white', border:'1px solid #444', borderRadius:'8px', fontSize:'1.1rem'}}>
                  {availableTables.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </label>
              <label>
                <div style={{marginBottom:'8px', color:'#aaa'}}>メニューブック選択</div>
                <select value={newTicketMenuBookId} onChange={e => onNewTicketMenuBookChange(e.target.value)} style={{width:'100%', padding:'12px', background:'#111', color:'white', border:'1px solid #444', borderRadius:'8px', fontSize:'1.1rem'}}>
                  {liveMenuBooks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
              <label>
                <div style={{marginBottom:'8px', color:'#aaa'}}>客数</div>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <button 
                    type="button" 
                    onClick={() => setNewTicketCustomerCount(prev => String(Math.max(1, (parseInt(prev) || 1) - 1)))}
                    style={{
                      width: '48px',
                      height: '48px',
                      background: '#333',
                      color: 'white',
                      border: '1px solid #444',
                      borderRadius: '8px',
                      fontSize: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    min="1" 
                    value={newTicketCustomerCount} 
                    onChange={e => setNewTicketCustomerCount(e.target.value)} 
                    style={{
                      flex: 1, 
                      padding: '12px', 
                      background: '#111', 
                      color: 'white', 
                      border: '1px solid #444', 
                      borderRadius: '8px', 
                      fontSize: '1.1rem',
                      textAlign: 'center',
                      height: '48px',
                      boxSizing: 'border-box'
                    }} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setNewTicketCustomerCount(prev => String((parseInt(prev) || 1) + 1))}
                    style={{
                      width: '48px',
                      height: '48px',
                      background: '#333',
                      color: 'white',
                      border: '1px solid #444',
                      borderRadius: '8px',
                      fontSize: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    +
                  </button>
                </div>
              </label>
            </div>
            <div style={{display:'flex', gap:'16px'}}>
              <button style={{flex:1, padding:'12px', background:'transparent', color:'white', border:'1px solid #444', borderRadius:'8px'}} onClick={() => setShowCreateTicketModal(false)}>キャンセル</button>
              <button style={{flex:1, padding:'12px', background:'#4dabf7', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold'}} disabled={mutationBusy === 'create-ticket'} onClick={handleCreateTicket}>発行する</button>
            </div>
          </div>
        </div>
      )}
      {showQrModal && selectedCustomerUrl && (
        <div 
          style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 2000}}
          onClick={() => setShowQrModal(false)}
        >
          <div 
            style={{background:'white', padding:'24px', borderRadius:'16px', textAlign:'center', color:'#333', maxWidth:'90vw'}}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{marginBottom:'16px'}}>注文用QRコード</h3>
            <p style={{marginBottom:'24px', color:'#666'}}>{selectedSummary?.tableName} / 伝票: {selectedSummary?.ticketNo}</p>
            <div style={{background:'#f8f9fa', padding:'16px', borderRadius:'12px', marginBottom:'24px'}}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(selectedCustomerUrl)}`} 
                alt="Customer QR" 
                style={{display:'block', margin:'0 auto', maxWidth:'100%'}}
              />
            </div>
            <div style={{display:'flex', gap:'12px'}}>
               <button 
                className="btn-secondary" 
                style={{flex:1, color:'#333', borderColor:'#ccc'}}
                onClick={() => window.print()}
              >
                印刷する
              </button>
              <button 
                className="btn-primary" 
                style={{flex:1}}
                onClick={() => setShowQrModal(false)}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

