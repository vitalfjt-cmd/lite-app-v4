import type { LiveLine, LiveTicket, LiveStore, LiveTableRef, LiveMenuBook, StaffProfile } from '../types'
import { formatError } from '../lib/appUtils'
import {
  staffReadApiEnabled,
  staffReadStoreSlugOverride,
  updateStaffPrototypeLineQuantity,
  cancelStaffPrototypeLine,
  updateStaffPrototypeLineStatus,
  addStaffPrototypeOrder,
  createStaffPrototypeTicket,
  addStaffPrototypePaymentEntry,
  closeStaffPrototypeTicket,
  staffAuditLog,
} from '../lib/staffReadApi'
import { nextKdsStatus, messageFromStaffApiError } from '../lib/staffUtils'

export type StaffOperationsDeps = {
  session: any | null
  profile: StaffProfile | null
  liveLines: LiveLine[]
  liveStore: LiveStore | null
  liveTickets: LiveTicket[]
  liveTables: LiveTableRef[]
  liveMenuBooks: LiveMenuBook[]
  staffHandyItems: any[]
  selectedTicketId: string | null
  selectedTicket: LiveTicket | null
  handyItemId: string
  handyQty: string
  draftQuantities: Record<string, number>
  setMutationBusy: (busy: string | null) => void
  setError: (error: string | null) => void
  setStaffMessage: (message: string | null) => void
  setLiveLines: (updater: (current: LiveLine[]) => LiveLine[]) => void
  setDraftQuantities: (updater: (current: Record<string, number>) => Record<string, number>) => void
  setLiveTickets: (updater: (current: LiveTicket[]) => LiveTicket[]) => void
  setLivePaymentEntries: (updater: (current: any[]) => any[]) => void
  setSelectedTicketId: (id: string | null) => void
  setHandyQty: (qty: string) => void
  loadLiveData: (session: any) => Promise<void>
}

export function useStaffOperations(deps: StaffOperationsDeps) {
  const {
    session, profile, liveLines, liveStore, liveTickets, liveTables, liveMenuBooks,
    staffHandyItems, selectedTicketId, selectedTicket, handyItemId, handyQty, draftQuantities,
    setMutationBusy, setError, setStaffMessage, setLiveLines, setDraftQuantities, setLiveTickets,
    setLivePaymentEntries, setSelectedTicketId, setHandyQty, loadLiveData
  } = deps

  const changeLineQuantity = (lineId: string, delta: number) => {
    setDraftQuantities((current) => ({ ...current, [lineId]: Math.max((current[lineId] ?? 1) + delta, 1) }))
  }

  const submitLineQuantityUpdate = async (lineId: string) => {
    const currentLine = liveLines.find((line) => line.id === lineId)
    if (!currentLine) return
    const nextQty = draftQuantities[lineId] ?? currentLine.quantity
    if (nextQty === currentLine.quantity) {
      setStaffMessage('Quantity is unchanged.')
      return
    }
    if (!window.confirm(`Change quantity from ${currentLine.quantity} to ${nextQty}?`)) return
    if (staffReadApiEnabled) {
      setMutationBusy(lineId)
      setStaffMessage(null)
      setError(null)
      try {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        const updated = await updateStaffPrototypeLineQuantity(storeSlug, lineId, nextQty)
        setLiveLines((current) =>
          current.map((line) =>
            line.id === lineId
              ? {
                  ...line,
                  quantity: updated.line.quantity,
                  line_subtotal: updated.line.line_subtotal,
                }
              : line,
          ),
        )
      } catch (err) {
        setError(formatError(err))
        return
      } finally {
        setMutationBusy(null)
      }
    }
    setStaffMessage('Quantity updated.')
  }

  const cancelLine = async (lineId: string) => {
    const currentLine = liveLines.find((line) => line.id === lineId)
    if (!currentLine) return
    if (!window.confirm(`Cancel "${currentLine.item_name_snapshot}"?`)) return
    if (staffReadApiEnabled) {
      setMutationBusy(lineId)
      setStaffMessage(null)
      setError(null)
      try {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await cancelStaffPrototypeLine(storeSlug, lineId)
        setLiveLines((current) =>
          current.map((line) =>
            line.id === lineId
              ? {
                  ...line,
                  kds_status: 'CANCELLED',
                }
              : line,
          ),
        )
      } catch (err) {
        setError(formatError(err))
      } finally {
        setMutationBusy(null)
      }
    }
    setStaffMessage('Line cancelled.')
  }

  const advanceLineStatus = async (lineId: string) => {
    const currentLine = liveLines.find((line) => line.id === lineId)
    if (!currentLine) return
    const nextStatus = nextKdsStatus(currentLine.kds_status)
    if (staffReadApiEnabled) {
      setMutationBusy(lineId)
      setError(null)
      setStaffMessage(null)
      try {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        const updated = await updateStaffPrototypeLineStatus(storeSlug, lineId, nextStatus)
        setLiveLines((current) =>
          current.map((line) =>
            line.id === lineId
              ? {
                  ...line,
                  kds_status: updated.line.kds_status,
                }
              : line,
          ),
        )
      } catch (err) {
        setError(formatError(err))
      } finally {
        setMutationBusy(null)
      }
      return
    }
    setStaffMessage(null)
  }

  const createHandyOrder = async (overrideItemId?: string, overrideQty?: string) => {
    const targetItemId = overrideItemId || handyItemId
    const targetQty = overrideQty || handyQty
    if (!profile || !selectedTicket || !targetItemId) return
    const menuItem = staffHandyItems.find((item) => item.id === targetItemId)
    if (!menuItem) return
    const quantity = Math.max(Number(targetQty) || 1, 1)
    setMutationBusy('handy-order')
    setStaffMessage(null)
    setError(null)
    try {
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        const added = await addStaffPrototypeOrder(storeSlug, selectedTicket.id, menuItem.id, quantity)
        setLiveLines((current) => [
          ...current,
          {
            id: added.line.id,
            order_ticket_id: selectedTicket.id,
            item_name_snapshot: menuItem.name,
            quantity: added.line.quantity,
            line_subtotal: added.line.line_subtotal,
            kds_status: 'NEW',
            customer_note: null,
            created_at: new Date().toISOString(),
          },
        ])
      }
      setHandyQty('1')
      setStaffMessage('Staff order added.')
    } catch (err) {
      setError(formatError(err))
    } finally {
      setMutationBusy(null)
    }
  }

  const createStaffTicket = async (tableRefId: string, menuBookId: string, customerCount: number | null = null): Promise<boolean> => {
    if (!profile) {
      const message = 'スタッフ情報の読み込みが完了していません。再読み込み後にもう一度お試しください。'
      setError(message)
      setStaffMessage(message)
      return false
    }
    setMutationBusy('create-ticket')
    setStaffMessage(null)
    setError(null)
    try {
      const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
      const table = liveTables.find((candidate) => candidate.id === tableRefId)
      const menuBook = liveMenuBooks.find((candidate) => candidate.id === menuBookId)
      if (!storeSlug) throw new Error('staff_store_slug_missing')
      if (!table) throw new Error('staff_table_not_found')
      const created = await createStaffPrototypeTicket(storeSlug, table.label, menuBook?.code ?? null, customerCount)

      setLiveTickets((current) => [
        {
          id: created.ticket.id,
          ticket_no: created.ticket.ticket_no,
          table_ref_id: created.table.id,
          table_label: created.table.label,
          menu_book_id: created.ticket.menu_book_id,
          customer_access_token: created.ticket.customer_access_token,
          customer_count: created.ticket.customer_count ?? null,
          ordered_at: created.ticket.ordered_at,
          status: 'OPEN',
        },
        ...current,
      ])
      setSelectedTicketId(created.ticket.id)
      const message = `${created.table.label} の伝票 ${created.ticket.ticket_no} を発行しました。`
      window.alert(message)
      return true
    } catch (err) {
      const message = messageFromStaffApiError(err)
      setError(message)
      setStaffMessage(message)
      return false
    } finally {
      setMutationBusy(null)
    }
  }

  const savePaymentEntry = async (payload: {
    paymentType: 'CASH' | 'CARD' | 'OTHER'
    discountAmount: number
    couponAmount: number
    voucherAmount: number
    finalAmount: number
    receivedAmount: number
  }): Promise<boolean> => {
    if (!selectedTicket) return false
    if (payload.receivedAmount < payload.finalAmount) {
      const message = '預かり金額が会計金額以上になるように入力してください。'
      setError(message)
      setStaffMessage(message)
      return false
    }
    setMutationBusy('payment-entry')
    setStaffMessage(null)
    setError(null)
    try {
      const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
      if (!storeSlug) throw new Error('staff_store_slug_missing')
      const saved = await addStaffPrototypePaymentEntry(storeSlug, {
        ticketId: selectedTicket.id,
        paymentType: payload.paymentType,
        discountAmount: payload.discountAmount,
        couponAmount: payload.couponAmount,
        voucherAmount: payload.voucherAmount,
        finalAmount: payload.finalAmount,
        receivedAmount: payload.receivedAmount,
      })
      setLivePaymentEntries((current: any) => [
        ...current,
        {
          id: saved.payment_entry.id,
          order_ticket_id: saved.payment_entry.order_ticket_id,
          payment_seq: saved.payment_entry.payment_seq,
          payment_type: saved.payment_entry.payment_type,
          discount_amount: saved.payment_entry.discount_amount,
          coupon_amount: saved.payment_entry.coupon_amount,
          voucher_amount: saved.payment_entry.voucher_amount,
          received_amount: saved.payment_entry.received_amount,
          change_amount: saved.payment_entry.change_amount,
          final_amount: saved.payment_entry.final_amount,
          entry_status: saved.payment_entry.entry_status,
          memo: saved.payment_entry.memo,
          paid_at: saved.payment_entry.paid_at,
        },
      ])
      return true
    } catch (err) {
      const message = messageFromStaffApiError(err)
      setError(message)
      setStaffMessage(message)
      return false
    } finally {
      setMutationBusy(null)
    }
  }

  const settleTicket = async (): Promise<boolean> => {
    if (!selectedTicket) return false
    const closingTicketId = selectedTicket.id
    setMutationBusy('close-ticket')
    setStaffMessage(null)
    setError(null)
    try {
      const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
      if (!storeSlug) throw new Error('staff_store_slug_missing')
      await closeStaffPrototypeTicket(storeSlug, selectedTicket.id, selectedTicket.ticket_no)
      setLiveTickets((current) => current.map((ticket) => (ticket.id === closingTicketId ? { ...ticket, status: 'CLOSED' } : ticket)))
      setStaffMessage(null)
      return true
    } catch (err) {
      const message = messageFromStaffApiError(err)
      setError(message)
      setStaffMessage(message)
      return false
    } finally {
      setMutationBusy(null)
    }
  }


  const logPaymentAbort = async () => {
    if (!selectedTicket) return
    const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
    if (!storeSlug) return
    try {
      await staffAuditLog(storeSlug, 'PAYMENT_ABORT', selectedTicket.id, JSON.stringify({ ticket_no: selectedTicket.ticket_no }))
    } catch (err) {
      console.error('Failed to log payment abort', err)
    }
  }

  return {
    changeLineQuantity,
    submitLineQuantityUpdate,
    cancelLine,
    advanceLineStatus,
    createHandyOrder,
    createStaffTicket,
    savePaymentEntry,
    settleTicket,
    logPaymentAbort,
  }
}
