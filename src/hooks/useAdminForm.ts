import type { AdminPlacementRow } from '../screens/admin/types'
import { useState } from 'react'
import {
  resetAdminBookForm,
  resetAdminCategoryForm,
  resetAdminItemForm,
  resetAdminPlacementForm,
  resetAdminSubCategoryForm,
} from '../lib/adminUtils'

export function useAdminForm() {
  const [editingMenuBookId, setEditingMenuBookId] = useState<string | null>(null)
  const [adminMenuBookId, setAdminMenuBookId] = useState('')
  const [adminMenuBookName, setAdminMenuBookName] = useState('')
  const [adminMenuBookCode, setAdminMenuBookCode] = useState('')
  const [adminMenuBookDescription, setAdminMenuBookDescription] = useState('')
  const [adminMenuBookSortOrder, setAdminMenuBookSortOrder] = useState('10')
  const [adminMenuBookIsActive, setAdminMenuBookIsActive] = useState(true)
  const [adminMenuBookAvailableFromTime, setAdminMenuBookAvailableFromTime] = useState('')
  const [adminMenuBookAvailableToTime, setAdminMenuBookAvailableToTime] = useState('')
  const [adminMenuBookValidFrom, setAdminMenuBookValidFrom] = useState('')
  const [adminMenuBookValidTo, setAdminMenuBookValidTo] = useState('')
  const [adminMenuBookTimeLimit, setAdminMenuBookTimeLimit] = useState('')
  const [adminMenuBookLastOrderOffset, setAdminMenuBookLastOrderOffset] = useState('')

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [adminCategoryCode, setAdminCategoryCode] = useState('')
  const [adminCategoryName, setAdminCategoryName] = useState('')
  const [adminCategorySortOrder, setAdminCategorySortOrder] = useState('10')

  const [editingSubCategoryId, setEditingSubCategoryId] = useState<string | null>(null)
  const [adminSubCategoryCode, setAdminSubCategoryCode] = useState('')
  const [adminSubCategoryName, setAdminSubCategoryName] = useState('')
  const [adminSubCategorySortOrder, setAdminSubCategorySortOrder] = useState('10')
  const [adminCategoryParentId, setAdminCategoryParentId] = useState('')

  const [editingMenuItemId, setEditingMenuItemId] = useState<string | null>(null)
  const [adminItemCategoryId, setAdminItemCategoryId] = useState('')
  const [adminItemCode, setAdminItemCode] = useState('')
  const [adminItemName, setAdminItemName] = useState('')
  const [adminItemNameEn, setAdminItemNameEn] = useState('')
  const [adminItemPrice, setAdminItemPrice] = useState('500')
  const [adminItemTaxType, setAdminItemTaxType] = useState<'INCLUDED' | 'EXCLUDED' | 'NONE'>('INCLUDED')
  const [adminItemTaxRateType, setAdminItemTaxRateType] = useState<'STANDARD' | 'REDUCED' | 'NONE'>('STANDARD')
  const [adminItemImageUrl, setAdminItemImageUrl] = useState('')
  const [adminItemSortOrder, setAdminItemSortOrder] = useState('10')
  const [adminItemIsActive, setAdminItemIsActive] = useState(true)
  const [adminItemIsSoldOut, setAdminItemIsSoldOut] = useState(false)
  const [adminItemToppingIds, setAdminItemToppingIds] = useState<string[]>([])
  const [adminItemLogicalPrinterIds, setAdminItemLogicalPrinterIds] = useState<string[]>([])

  const [editingPlacementId, setEditingPlacementId] = useState<string | null>(null)
  const [adminPlacementMenuBookId, setAdminPlacementMenuBookId] = useState('')
  const [adminPlacementTopCategoryId, setAdminPlacementTopCategoryId] = useState('')
  const [adminPlacementCategoryId, setAdminPlacementCategoryId] = useState('')
  const [adminPlacementItemId, setAdminPlacementItemId] = useState('')
  const [adminPlacementDisplayNameOverride, setAdminPlacementDisplayNameOverride] = useState('')
  const [adminPlacementDescriptionOverride, setAdminPlacementDescriptionOverride] = useState('')

  const [editingTableId, setEditingTableId] = useState<string | null>(null)
  const [adminTableLabel, setAdminTableLabel] = useState('')
  const [adminTableQrToken, setAdminTableQrToken] = useState('')
  const [adminTableGroupName, setAdminTableGroupName] = useState('')
  const [adminTableFloorId, setAdminTableFloorId] = useState('')
  const [adminTableSortOrder, setAdminTableSortOrder] = useState('10')
  const [adminTableIsActive, setAdminTableIsActive] = useState(true)

  const [editingPaymentMethodId, setEditingPaymentMethodId] = useState<string | null>(null)
  const [adminPaymentMethodName, setAdminPaymentMethodName] = useState('')
  const [adminPaymentMethodSortOrder, setAdminPaymentMethodSortOrder] = useState('10')
  const [adminPaymentMethodIsActive, setAdminPaymentMethodIsActive] = useState(true)
  const [adminPaymentMethodIsChangeAllowed, setAdminPaymentMethodIsChangeAllowed] = useState(true)

  const [editingStaffUserId, setEditingStaffUserId] = useState<string | null>(null)
  const [adminStaffEmail, setAdminStaffEmail] = useState('')
  const [adminStaffPassword, setAdminStaffPassword] = useState('')
  const [adminStaffDisplayName, setAdminStaffDisplayName] = useState('')
  const [adminStaffRoleType, setAdminStaffRoleType] = useState<'ADMIN' | 'STAFF' | 'KDS'>('STAFF')
  const [adminStaffIsActive, setAdminStaffIsActive] = useState(true)
 
  const [editingPhysicalPrinterId, setEditingPhysicalPrinterId] = useState<string | null>(null)
  const [adminPrinterName, setAdminPrinterName] = useState('')
  const [adminPrinterIp, setAdminPrinterIp] = useState('')
  const [adminPrinterPort, setAdminPrinterPort] = useState('9100')
  const [adminPrinterIsActive, setAdminPrinterIsActive] = useState(true)
  const [adminPrinterBackupPrinterId, setAdminPrinterBackupPrinterId] = useState('')
  const [adminPrinterIsDefaultFallback, setAdminPrinterIsDefaultFallback] = useState(false)

  const [editingPrinterRoutingRuleId, setEditingPrinterRoutingRuleId] = useState<string | null>(null)
  const [adminRuleAreaGroup, setAdminRuleAreaGroup] = useState('')
  const [adminRuleFloorId, setAdminRuleFloorId] = useState('')
  const [adminRuleLogicalPrinterCode, setAdminRuleLogicalPrinterCode] = useState('KP1')
  const [adminRuleLogicalPrinterId, setAdminRuleLogicalPrinterId] = useState('')
  const [adminRulePhysicalPrinterId, setAdminRulePhysicalPrinterId] = useState('')

  const [editingLogicalPrinterId, setEditingLogicalPrinterId] = useState<string | null>(null)
  const [adminLogicalPrinterCode, setAdminLogicalPrinterCode] = useState('KP1')
  const [adminLogicalPrinterName, setAdminLogicalPrinterName] = useState('')
  const [adminLogicalPrinterSortOrder, setAdminLogicalPrinterSortOrder] = useState('10')
  const [adminLogicalPrinterIsReceiptPrinter, setAdminLogicalPrinterIsReceiptPrinter] = useState(false)

  const [editingFloorId, setEditingFloorId] = useState<string | null>(null)
  const [adminFloorName, setAdminFloorName] = useState('')
  const [adminFloorSortOrder, setAdminFloorSortOrder] = useState('10')
  const [adminFloorIsActive, setAdminFloorIsActive] = useState(true)

  const [adminStoreName, setAdminStoreName] = useState('')
  const [adminStoreCode, setAdminStoreCode] = useState('')
  const [adminStoreSlug, setAdminStoreSlug] = useState('')
  const [adminStoreTimezone, setAdminStoreTimezone] = useState('Asia/Tokyo')
  const [adminStoreBusinessOffsetMinutes, setAdminStoreBusinessOffsetMinutes] = useState(0)
  const [adminStorePaymentTimingMode, setAdminStorePaymentTimingMode] = useState<'PREPAID' | 'POSTPAID'>('POSTPAID')
  const [adminStoreTicketNoResetMode, setAdminStoreTicketNoResetMode] = useState<'DAILY' | 'SEQUENCE'>('DAILY')
  const [adminStoreTicketNoDigits, setAdminStoreTicketNoDigits] = useState(4)
  const [adminStoreTaxRate, setAdminStoreTaxRate] = useState(10)
  const [adminStoreReducedTaxRate, setAdminStoreReducedTaxRate] = useState(8)
  const [adminStoreTaxDisplayMode, setAdminStoreTaxDisplayMode] = useState<'INCLUDED' | 'EXCLUDED'>('INCLUDED')
  const [itemImageUploadBusy, setItemImageUploadBusy] = useState(false)

  const resetBook = () => {
    resetAdminBookForm(
      setEditingMenuBookId,
      setAdminMenuBookName,
      setAdminMenuBookCode,
      setAdminMenuBookDescription,
      setAdminMenuBookSortOrder,
      setAdminMenuBookIsActive,
      setAdminMenuBookAvailableFromTime,
      setAdminMenuBookAvailableToTime,
      setAdminMenuBookValidFrom,
      setAdminMenuBookValidTo,
    )
    setAdminMenuBookTimeLimit('')
    setAdminMenuBookLastOrderOffset('')
  }

  const resetCategory = () => resetAdminCategoryForm(setEditingCategoryId, setAdminCategoryCode, setAdminCategoryName, setAdminCategorySortOrder)

  const resetPhysicalPrinter = () => {
    setEditingPhysicalPrinterId(null)
    setAdminPrinterName('')
    setAdminPrinterIp('')
    setAdminPrinterPort('9100')
    setAdminPrinterIsActive(true)
    setAdminPrinterBackupPrinterId('')
    setAdminPrinterIsDefaultFallback(false)
  }

  const resetPrinterRoutingRule = () => {
    setEditingPrinterRoutingRuleId(null)
    setAdminRuleAreaGroup('')
    setAdminRuleFloorId('')
    setAdminRuleLogicalPrinterCode('KP1')
    setAdminRuleLogicalPrinterId('')
    setAdminRulePhysicalPrinterId('')
  }

  const resetLogicalPrinter = () => {
    setEditingLogicalPrinterId(null)
    setAdminLogicalPrinterCode('KP1')
    setAdminLogicalPrinterName('')
    setAdminLogicalPrinterSortOrder('10')
    setAdminLogicalPrinterIsReceiptPrinter(false)
  }

  const resetSubCategory = () =>
    resetAdminSubCategoryForm(setEditingSubCategoryId, setAdminSubCategoryCode, setAdminSubCategoryName, setAdminSubCategorySortOrder, setAdminCategoryParentId)

  const resetItem = () => {
    resetAdminItemForm(
      setEditingMenuItemId,
      setAdminItemCategoryId,
      setAdminItemCode,
      setAdminItemName,
      setAdminItemPrice,
      setAdminItemTaxType,
      setAdminItemImageUrl,
      setAdminItemSortOrder,
      setAdminItemIsActive,
      setAdminItemIsSoldOut,
    )
    setAdminItemNameEn('')
    setAdminItemTaxRateType('STANDARD')
    setAdminItemToppingIds([])
    setAdminItemLogicalPrinterIds([])
  }

  const resetPlacement = () =>
    resetAdminPlacementForm(
      setEditingPlacementId,
      setAdminPlacementMenuBookId,
      setAdminPlacementTopCategoryId,
      setAdminPlacementCategoryId,
      setAdminPlacementItemId,
      setAdminPlacementDisplayNameOverride,
      setAdminPlacementDescriptionOverride,
    )

  const resetTable = () => {
    setEditingTableId(null)
    setAdminTableLabel('')
    setAdminTableQrToken('')
    setAdminTableGroupName('')
    setAdminTableFloorId('')
    setAdminTableSortOrder('10')
    setAdminTableIsActive(true)
  }

  const resetFloor = () => {
    setEditingFloorId(null)
    setAdminFloorName('')
    setAdminFloorSortOrder('10')
    setAdminFloorIsActive(true)
  }

  const resetPaymentMethod = () => {
    setEditingPaymentMethodId(null)
    setAdminPaymentMethodName('')
    setAdminPaymentMethodSortOrder('10')
    setAdminPaymentMethodIsActive(true)
    setAdminPaymentMethodIsChangeAllowed(true)
  }

  const resetStaffUser = () => {
    setEditingStaffUserId(null)
    setAdminStaffEmail('')
    setAdminStaffPassword('')
    setAdminStaffDisplayName('')
    setAdminStaffRoleType('STAFF')
    setAdminStaffIsActive(true)
  }

  const startEditMenuBook = (menuBook: any) => {
    setEditingMenuBookId(menuBook.id)
    setAdminMenuBookName(menuBook.name)
    setAdminMenuBookCode(menuBook.code)
    setAdminMenuBookDescription(menuBook.description ?? '')
    setAdminMenuBookSortOrder(String(menuBook.sort_order))
    setAdminMenuBookIsActive(menuBook.is_active)
    setAdminMenuBookAvailableFromTime(menuBook.available_from_time ?? '')
    setAdminMenuBookAvailableToTime(menuBook.available_to_time ?? '')
    setAdminMenuBookValidFrom(menuBook.valid_from ?? '')
    setAdminMenuBookValidTo(menuBook.valid_to ?? '')
    const timeLimit = menuBook.time_limit_minutes ?? menuBook.timeLimitMinutes
    const lastOrderOffset = menuBook.last_order_offset_minutes ?? menuBook.lastOrderOffsetMinutes
    setAdminMenuBookTimeLimit(timeLimit !== undefined && timeLimit !== null && String(timeLimit).trim() !== '' ? String(timeLimit) : '')
    setAdminMenuBookLastOrderOffset(lastOrderOffset !== undefined && lastOrderOffset !== null && String(lastOrderOffset).trim() !== '' ? String(lastOrderOffset) : '')
  }

  const startEditCategory = (category: any) => {
    setEditingCategoryId(category.id)
    setAdminCategoryCode(category.code ?? '')
    setAdminCategoryName(category.name)
    setAdminCategorySortOrder(String(category.sort_order))
  }

  const startEditSubCategory = (subcategory: any) => {
    setEditingSubCategoryId(subcategory.id)
    setAdminSubCategoryCode(subcategory.code ?? '')
    setAdminSubCategoryName(subcategory.name)
    setAdminSubCategorySortOrder(String(subcategory.sort_order))
    setAdminCategoryParentId(subcategory.parent_category_id ?? '')
  }

  const startEditMenuItem = (item: any) => {
    setEditingMenuItemId(item.id)
    setAdminItemCode(item.code ?? '')
    setAdminItemCategoryId(item.category_id)
    setAdminItemName(item.name)
    setAdminItemNameEn(item.name_en ?? '')
    setAdminItemPrice(String(item.price))
    setAdminItemTaxType(item.tax_type ?? 'INCLUDED')
    setAdminItemTaxRateType(item.tax_rate_type ?? 'STANDARD')
    setAdminItemImageUrl(item.image_url ?? '')
    setAdminItemSortOrder(String(item.sort_order))
    setAdminItemIsActive(item.is_active)
    setAdminItemIsSoldOut(item.is_sold_out)
    setAdminItemToppingIds(item.toppings?.map((t: any) => t.id) || [])
    setAdminItemLogicalPrinterIds(item.logical_printer_ids || [])
  }

  const startEditPlacement = (placement: AdminPlacementRow) => {
    setEditingPlacementId(placement.id)
    setAdminPlacementMenuBookId(placement.menuBookId)
    setAdminPlacementTopCategoryId(placement.topCategoryId)
    setAdminPlacementCategoryId(placement.subcategoryId)
    setAdminPlacementItemId(placement.itemId)
    setAdminPlacementDisplayNameOverride(placement.displayNameOverride ?? '')
    setAdminPlacementDescriptionOverride(placement.descriptionOverride ?? '')
  }

  const startEditTable = (tableRef: any) => {
    setEditingTableId(tableRef.id)
    setAdminTableLabel(tableRef.label)
    setAdminTableQrToken(tableRef.qr_token)
    setAdminTableGroupName(tableRef.group_name ?? '')
    setAdminTableFloorId(tableRef.floor_id ?? '')
    setAdminTableSortOrder(String(tableRef.sort_order ?? 0))
    setAdminTableIsActive(tableRef.is_active)
  }

  const startEditPhysicalPrinter = (printer: any) => {
    setEditingPhysicalPrinterId(printer.id)
    setAdminPrinterName(printer.name)
    setAdminPrinterIp(printer.ip_address)
    setAdminPrinterPort(String(printer.port))
    setAdminPrinterIsActive(printer.is_active)
    setAdminPrinterBackupPrinterId(printer.backup_printer_id ?? '')
    setAdminPrinterIsDefaultFallback(Boolean(printer.is_default_fallback))
  }

  const startEditPrinterRoutingRule = (rule: any) => {
    setEditingPrinterRoutingRuleId(rule.id)
    setAdminRuleAreaGroup(rule.area_group)
    setAdminRuleFloorId(rule.floor_id ?? '')
    setAdminRuleLogicalPrinterCode(rule.logical_printer_code ?? '')
    setAdminRuleLogicalPrinterId(rule.logical_printer_id ?? '')
    setAdminRulePhysicalPrinterId(rule.physical_printer_id)
  }

  const startEditLogicalPrinter = (lp: any) => {
    setEditingLogicalPrinterId(lp.id)
    setAdminLogicalPrinterCode(lp.code)
    setAdminLogicalPrinterName(lp.name)
    setAdminLogicalPrinterSortOrder(String(lp.sort_order ?? 0))
    setAdminLogicalPrinterIsReceiptPrinter(Boolean(lp.is_receipt_printer))
  }

  const startEditFloor = (floor: any) => {
    setEditingFloorId(floor.id)
    setAdminFloorName(floor.name)
    setAdminFloorSortOrder(String(floor.sort_order ?? 0))
    setAdminFloorIsActive(floor.is_active)
  }

  const beginEditPaymentMethod = (pm: any) => {
    setEditingPaymentMethodId(pm.id)
    setAdminPaymentMethodName(pm.name)
    setAdminPaymentMethodSortOrder(String(pm.sort_order ?? 0))
    setAdminPaymentMethodIsActive(pm.is_active)
    setAdminPaymentMethodIsChangeAllowed(pm.is_change_allowed ?? true)
  }

  const startEditStaffUser = (staffUser: any) => {
    setEditingStaffUserId(staffUser.id)
    setAdminStaffPassword('')
    setAdminStaffEmail(staffUser.email ?? '')
    setAdminStaffDisplayName(staffUser.display_name)
    setAdminStaffRoleType(staffUser.role_type)
    setAdminStaffIsActive(staffUser.is_active !== false)
  }

  return {
    editingMenuBookId, setEditingMenuBookId,
    adminMenuBookId, setAdminMenuBookId,
    adminMenuBookName, setAdminMenuBookName,
    adminMenuBookCode, setAdminMenuBookCode,
    adminMenuBookDescription, setAdminMenuBookDescription,
    adminMenuBookSortOrder, setAdminMenuBookSortOrder,
    adminMenuBookIsActive, setAdminMenuBookIsActive,
    adminMenuBookAvailableFromTime, setAdminMenuBookAvailableFromTime,
    adminMenuBookAvailableToTime, setAdminMenuBookAvailableToTime,
    adminMenuBookValidFrom, setAdminMenuBookValidFrom,
    adminMenuBookValidTo, setAdminMenuBookValidTo,
    adminMenuBookTimeLimit, setAdminMenuBookTimeLimit,
    adminMenuBookLastOrderOffset, setAdminMenuBookLastOrderOffset,
    resetBook,

    editingCategoryId, setEditingCategoryId,
    adminCategoryCode, setAdminCategoryCode,
    adminCategoryName, setAdminCategoryName,
    adminCategorySortOrder, setAdminCategorySortOrder,
    resetCategory,

    editingSubCategoryId, setEditingSubCategoryId,
    adminSubCategoryCode, setAdminSubCategoryCode,
    adminSubCategoryName, setAdminSubCategoryName,
    adminSubCategorySortOrder, setAdminSubCategorySortOrder,
    adminCategoryParentId, setAdminCategoryParentId,
    resetSubCategory,

    editingMenuItemId, setEditingMenuItemId,
    adminItemCategoryId, setAdminItemCategoryId,
    adminItemCode, setAdminItemCode,
    adminItemName, setAdminItemName,
    adminItemNameEn, setAdminItemNameEn,
    adminItemPrice, setAdminItemPrice,
    adminItemTaxType, setAdminItemTaxType,
    adminItemTaxRateType, setAdminItemTaxRateType,
    adminItemImageUrl, setAdminItemImageUrl,
    adminItemSortOrder, setAdminItemSortOrder,
    adminItemIsActive, setAdminItemIsActive,
    adminItemIsSoldOut, setAdminItemIsSoldOut,
    adminItemToppingIds, setAdminItemToppingIds,
    adminItemLogicalPrinterIds, setAdminItemLogicalPrinterIds,
    resetItem,

    editingPlacementId, setEditingPlacementId,
    adminPlacementMenuBookId, setAdminPlacementMenuBookId,
    adminPlacementTopCategoryId, setAdminPlacementTopCategoryId,
    adminPlacementCategoryId, setAdminPlacementCategoryId,
    adminPlacementItemId, setAdminPlacementItemId,
    adminPlacementDisplayNameOverride, setAdminPlacementDisplayNameOverride,
    adminPlacementDescriptionOverride, setAdminPlacementDescriptionOverride,
    resetPlacement,

    editingTableId, setEditingTableId,
    adminTableLabel, setAdminTableLabel,
    adminTableQrToken, setAdminTableQrToken,
    adminTableGroupName, setAdminTableGroupName,
    adminTableSortOrder, setAdminTableSortOrder,
    adminTableIsActive, setAdminTableIsActive,
    adminTableFloorId, setAdminTableFloorId,
    resetTable,

    editingPaymentMethodId, setEditingPaymentMethodId,
    adminPaymentMethodName, setAdminPaymentMethodName,
    adminPaymentMethodSortOrder, setAdminPaymentMethodSortOrder,
    adminPaymentMethodIsActive, setAdminPaymentMethodIsActive,
    adminPaymentMethodIsChangeAllowed, setAdminPaymentMethodIsChangeAllowed,
    resetPaymentMethod,

    editingStaffUserId, setEditingStaffUserId,
    adminStaffEmail, setAdminStaffEmail,
    adminStaffPassword, setAdminStaffPassword,
    adminStaffDisplayName, setAdminStaffDisplayName,
    adminStaffRoleType, setAdminStaffRoleType,
    adminStaffIsActive, setAdminStaffIsActive,
    resetStaffUser,

    adminStoreName, setAdminStoreName,
    adminStoreCode, setAdminStoreCode,
    adminStoreSlug, setAdminStoreSlug,
    adminStoreTimezone, setAdminStoreTimezone,
    adminStoreBusinessOffsetMinutes, setAdminStoreBusinessOffsetMinutes,
    adminStorePaymentTimingMode, setAdminStorePaymentTimingMode,
    adminStoreTicketNoResetMode, setAdminStoreTicketNoResetMode,
    adminStoreTicketNoDigits, setAdminStoreTicketNoDigits,
    adminStoreTaxRate, setAdminStoreTaxRate,
    adminStoreReducedTaxRate, setAdminStoreReducedTaxRate,
    adminStoreTaxDisplayMode, setAdminStoreTaxDisplayMode,
    itemImageUploadBusy, setItemImageUploadBusy,
    startEditMenuBook,
    startEditCategory,
    startEditSubCategory,
    startEditMenuItem,
    startEditPlacement,
    startEditTable,
    beginEditPaymentMethod,
    startEditStaffUser,
 
    editingPhysicalPrinterId, setEditingPhysicalPrinterId,
    adminPrinterName, setAdminPrinterName,
    adminPrinterIp, setAdminPrinterIp,
    adminPrinterPort, setAdminPrinterPort,
    adminPrinterIsActive, setAdminPrinterIsActive,
    adminPrinterBackupPrinterId, setAdminPrinterBackupPrinterId,
    adminPrinterIsDefaultFallback, setAdminPrinterIsDefaultFallback,
    resetPhysicalPrinter,
    startEditPhysicalPrinter,

    editingPrinterRoutingRuleId, setEditingPrinterRoutingRuleId,
    adminRuleAreaGroup, setAdminRuleAreaGroup,
    adminRuleFloorId, setAdminRuleFloorId,
    adminRuleLogicalPrinterCode, setAdminRuleLogicalPrinterCode,
    adminRuleLogicalPrinterId, setAdminRuleLogicalPrinterId,
    adminRulePhysicalPrinterId, setAdminRulePhysicalPrinterId,
    resetPrinterRoutingRule,
    startEditPrinterRoutingRule,

    editingLogicalPrinterId, setEditingLogicalPrinterId,
    adminLogicalPrinterCode, setAdminLogicalPrinterCode,
    adminLogicalPrinterName, setAdminLogicalPrinterName,
    adminLogicalPrinterSortOrder, setAdminLogicalPrinterSortOrder,
    adminLogicalPrinterIsReceiptPrinter, setAdminLogicalPrinterIsReceiptPrinter,
    resetLogicalPrinter,
    startEditLogicalPrinter,

    editingFloorId, setEditingFloorId,
    adminFloorName, setAdminFloorName,
    adminFloorSortOrder, setAdminFloorSortOrder,
    adminFloorIsActive, setAdminFloorIsActive,
    resetFloor,
    startEditFloor,
  }
}
