import { useState, useMemo } from 'react'
import type { LiveTicket, LiveLine, LivePaymentEntry, LiveStore, LiveTableRef, LiveMenuBook, LiveCategory, LiveSubcategory, LiveStaffUser, TicketSummaryView, StaffPrototypeTopCategory, StaffPrototypeSubCategory, StaffPrototypeItem, LiveMenuBookItem, LiveBookCategory, LiveBookCategorySubcategory, LiveBookSubcategoryItem, LiveMenuItem } from '../types'
import { ticketStatusFromLines } from '../lib/staffUtils'

export function useStaffData() {
  const [liveStore, setLiveStore] = useState<LiveStore | null>(null)
  const [liveTickets, setLiveTickets] = useState<LiveTicket[]>([])
  const [liveLines, setLiveLines] = useState<LiveLine[]>([])
  const [livePaymentEntries, setLivePaymentEntries] = useState<LivePaymentEntry[]>([])
  const [liveTables, setLiveTables] = useState<LiveTableRef[]>([])
  const [liveMenuBooks, setLiveMenuBooks] = useState<LiveMenuBook[]>([])
  const [liveMenuBookItems, setLiveMenuBookItems] = useState<LiveMenuBookItem[]>([])
  const [liveCategories, setLiveCategories] = useState<LiveCategory[]>([])
  const [liveSubcategories, setLiveSubcategories] = useState<LiveSubcategory[]>([])
  const [liveBookCategories, setLiveBookCategories] = useState<LiveBookCategory[]>([])
  const [liveBookCategorySubcategories, setLiveBookCategorySubcategories] = useState<LiveBookCategorySubcategory[]>([])
  const [liveBookSubcategoryItems, setLiveBookSubcategoryItems] = useState<LiveBookSubcategoryItem[]>([])
  const [liveStaffUsers, setLiveStaffUsers] = useState<LiveStaffUser[]>([])
  const [liveItems, setLiveItems] = useState<LiveMenuItem[]>([])

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [staffDirectAction, setStaffDirectAction] = useState<'HANDY' | 'PAYMENT' | null>(null)

  // Prototype specific staff data
  const [staffHandyTopCategories, setStaffHandyTopCategories] = useState<StaffPrototypeTopCategory[]>([])
  const [staffHandySubCategories, setStaffHandySubCategories] = useState<StaffPrototypeSubCategory[]>([])
  const [staffHandyItems, setStaffHandyItems] = useState<StaffPrototypeItem[]>([])

  const selectedTicket = useMemo(() => liveTickets.find((t) => t.id === selectedTicketId) || null, [liveTickets, selectedTicketId])
  
  const selectedLines = useMemo(() => liveLines.filter((l) => l.order_ticket_id === selectedTicketId), [liveLines, selectedTicketId])
  
  const selectedPaymentEntries = useMemo(() => livePaymentEntries.filter((p) => p.order_ticket_id === selectedTicketId), [livePaymentEntries, selectedTicketId])

  const cancelledLines = useMemo(() => selectedLines.filter((l) => l.kds_status === 'CANCELLED'), [selectedLines])
  
  const activeLines = useMemo(() => selectedLines.filter((l) => l.kds_status !== 'CANCELLED'), [selectedLines])

  const selectedSummary = useMemo(() => {
    if (!selectedTicket) return null
    const subtotal = activeLines.reduce((sum, l) => sum + l.line_subtotal, 0)
    return {
      ticketId: selectedTicket.id,
      ticketNo: selectedTicket.ticket_no,
      tableName: selectedTicket.table_label || 'Table',
      orderedAt: selectedTicket.ordered_at,
      subtotal,
      lineCount: activeLines.length,
      status: ticketStatusFromLines(activeLines),
      customerUrl: selectedTicket.customer_access_token || null,
      customerCount: selectedTicket.customer_count,
    }
  }, [selectedTicket, activeLines])

  const activeLiveTickets = useMemo(() => liveTickets.filter((t) => t.status === 'OPEN'), [liveTickets])

  const staffHandyTopCategoriesMemo = useMemo(() => {
    if (staffHandyTopCategories.length > 0) return staffHandyTopCategories
    const menuBookId = selectedTicket?.menu_book_id
    if (!menuBookId) return []
    return liveBookCategories
      .filter((relation) => relation.menu_book_id === menuBookId && relation.is_active)
      .map((relation) => liveCategories.find((category) => category.id === relation.menu_category_id && category.is_active))
      .filter((category): category is LiveCategory => Boolean(category))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((category) => ({ id: category.id, name: category.name }))
  }, [liveBookCategories, liveCategories, selectedTicket, staffHandyTopCategories])

  const staffHandySubCategoriesMemo = useMemo(() => {
    if (staffHandySubCategories.length > 0) return staffHandySubCategories
    const menuBookId = selectedTicket?.menu_book_id
    if (!menuBookId) return []
    return liveBookCategorySubcategories
      .filter((relation) => relation.menu_book_id === menuBookId && relation.is_active)
      .map((relation) => {
        const subcategory = liveSubcategories.find((item) => item.id === relation.menu_subcategory_id && item.is_active)
        if (!subcategory) return null
        return {
          id: subcategory.id,
          name: subcategory.name,
          parentId: relation.menu_category_id,
          sortOrder: relation.sort_order,
        }
      })
      .filter((item): item is { id: string; name: string; parentId: string; sortOrder: number } => Boolean(item))
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }, [liveBookCategorySubcategories, liveSubcategories, selectedTicket, staffHandySubCategories])

  const staffHandyItemsMemo = useMemo(() => {
    if (staffHandyItems.length > 0) return staffHandyItems
    const menuBookId = selectedTicket?.menu_book_id
    if (!menuBookId) return []
    return liveBookSubcategoryItems
      .filter((relation) => relation.menu_book_id === menuBookId && relation.is_active)
      .map((relation) => {
        const item = liveItems.find((candidate) => candidate.id === relation.menu_item_id && candidate.is_active && !candidate.is_sold_out)
        if (!item) return null
        return {
          id: item.id,
          name: relation.display_name_override || item.name,
          price: item.price,
          isActive: item.is_active,
          isSoldOut: item.is_sold_out,
          subcategoryId: relation.menu_subcategory_id,
        }
      })
      .filter(
        (item): item is StaffPrototypeItem =>
          Boolean(item),
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'ja'))
  }, [liveBookSubcategoryItems, liveItems, selectedTicket, staffHandyItems])

  const liveTicketSummaries = useMemo<TicketSummaryView[]>(() => {
    return activeLiveTickets
      .map((t) => {
        const lines = liveLines.filter((l) => l.order_ticket_id === t.id && l.kds_status !== 'CANCELLED')
        const subtotal = lines.reduce((sum, l) => sum + l.line_subtotal, 0)
        return {
          ticketId: t.id,
          ticketNo: t.ticket_no,
          tableName: t.table_label || 'Table',
          orderedAt: t.ordered_at,
          subtotal,
          lineCount: lines.length,
          status: ticketStatusFromLines(lines),
          customerUrl: t.customer_access_token || null,
          customerCount: t.customer_count,
        }
      })
  }, [activeLiveTickets, liveLines])

  return {
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
    staffHandyTopCategories: staffHandyTopCategoriesMemo, setStaffHandyTopCategories,
    staffHandySubCategories: staffHandySubCategoriesMemo, setStaffHandySubCategories,
    staffHandyItems: staffHandyItemsMemo, setStaffHandyItems,
    selectedTicket,
    selectedLines,
    selectedPaymentEntries,
    cancelledLines,
    activeLines,
    selectedSummary,
    activeLiveTickets,
    liveTicketSummaries,
  }
}

