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

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [adminCategoryName, setAdminCategoryName] = useState('')
  const [adminCategorySortOrder, setAdminCategorySortOrder] = useState('10')

  const [editingSubCategoryId, setEditingSubCategoryId] = useState<string | null>(null)
  const [adminSubCategoryName, setAdminSubCategoryName] = useState('')
  const [adminSubCategorySortOrder, setAdminSubCategorySortOrder] = useState('10')
  const [adminCategoryParentId, setAdminCategoryParentId] = useState('')

  const [editingMenuItemId, setEditingMenuItemId] = useState<string | null>(null)
  const [adminItemCategoryId, setAdminItemCategoryId] = useState('')
  const [adminItemCode, setAdminItemCode] = useState('')
  const [adminItemName, setAdminItemName] = useState('')
  const [adminItemPrice, setAdminItemPrice] = useState('500')
  const [adminItemTaxType, setAdminItemTaxType] = useState<'INCLUDED' | 'EXCLUDED' | 'NONE'>('INCLUDED')
  const [adminItemImageUrl, setAdminItemImageUrl] = useState('')
  const [adminItemSortOrder, setAdminItemSortOrder] = useState('10')
  const [adminItemIsActive, setAdminItemIsActive] = useState(true)
  const [adminItemIsSoldOut, setAdminItemIsSoldOut] = useState(false)
  const [adminItemToppingIds, setAdminItemToppingIds] = useState<string[]>([])

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
  const [adminTableSortOrder, setAdminTableSortOrder] = useState('10')
  const [adminTableIsActive, setAdminTableIsActive] = useState(true)

  const [editingPaymentMethodId, setEditingPaymentMethodId] = useState<string | null>(null)
  const [adminPaymentMethodName, setAdminPaymentMethodName] = useState('')
  const [adminPaymentMethodSortOrder, setAdminPaymentMethodSortOrder] = useState('10')
  const [adminPaymentMethodIsActive, setAdminPaymentMethodIsActive] = useState(true)

  const [editingStaffUserId, setEditingStaffUserId] = useState<string | null>(null)
  const [adminStaffEmail, setAdminStaffEmail] = useState('')
  const [adminStaffPassword, setAdminStaffPassword] = useState('')
  const [adminStaffDisplayName, setAdminStaffDisplayName] = useState('')
  const [adminStaffRoleType, setAdminStaffRoleType] = useState<'ADMIN' | 'STAFF' | 'KDS'>('STAFF')
  const [adminStaffIsActive, setAdminStaffIsActive] = useState(true)

  const [adminStoreName, setAdminStoreName] = useState('')
  const [adminStoreSlug, setAdminStoreSlug] = useState('')
  const [adminStoreTimezone, setAdminStoreTimezone] = useState('Asia/Tokyo')
  const [adminStoreBusinessOffsetMinutes, setAdminStoreBusinessOffsetMinutes] = useState(0)
  const [adminStorePaymentTimingMode, setAdminStorePaymentTimingMode] = useState<'PREPAID' | 'POSTPAID'>('POSTPAID')
  const [adminStoreTicketNoResetMode, setAdminStoreTicketNoResetMode] = useState<'DAILY' | 'SEQUENCE'>('DAILY')
  const [adminStoreTicketNoDigits, setAdminStoreTicketNoDigits] = useState(4)
  const [itemImageUploadBusy, setItemImageUploadBusy] = useState(false)

  const resetBook = () =>
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

  const resetCategory = () => resetAdminCategoryForm(setEditingCategoryId, setAdminCategoryName, setAdminCategorySortOrder)

  const resetSubCategory = () =>
    resetAdminSubCategoryForm(setEditingSubCategoryId, setAdminSubCategoryName, setAdminSubCategorySortOrder, setAdminCategoryParentId)

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
    setAdminItemToppingIds([])
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
    setAdminTableSortOrder('10')
    setAdminTableIsActive(true)
  }

  const resetPaymentMethod = () => {
    setEditingPaymentMethodId(null)
    setAdminPaymentMethodName('')
    setAdminPaymentMethodSortOrder('10')
    setAdminPaymentMethodIsActive(true)
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
  }

  const startEditCategory = (category: any) => {
    setEditingCategoryId(category.id)
    setAdminCategoryName(category.name)
    setAdminCategorySortOrder(String(category.sort_order))
  }

  const startEditSubCategory = (subcategory: any) => {
    setEditingSubCategoryId(subcategory.id)
    setAdminSubCategoryName(subcategory.name)
    setAdminSubCategorySortOrder(String(subcategory.sort_order))
    setAdminCategoryParentId(subcategory.parent_category_id ?? '')
  }

  const startEditMenuItem = (item: any) => {
    setEditingMenuItemId(item.id)
    setAdminItemCode(item.code ?? '')
    setAdminItemCategoryId(item.category_id)
    setAdminItemName(item.name)
    setAdminItemPrice(String(item.price))
    setAdminItemTaxType(item.tax_type ?? 'INCLUDED')
    setAdminItemImageUrl(item.image_url ?? '')
    setAdminItemSortOrder(String(item.sort_order))
    setAdminItemIsActive(item.is_active)
    setAdminItemIsSoldOut(item.is_sold_out)
    setAdminItemToppingIds(item.toppings?.map((t: any) => t.id) || [])
  }

  const startEditPlacement = (placement: any) => {
    setEditingPlacementId(placement.id)
    setAdminPlacementMenuBookId(placement.menu_book_id)
    setAdminPlacementTopCategoryId(placement.menu_category_id)
    setAdminPlacementCategoryId(placement.menu_subcategory_id)
    setAdminPlacementItemId(placement.menu_item_id)
    setAdminPlacementDisplayNameOverride(placement.display_name_override ?? '')
    setAdminPlacementDescriptionOverride(placement.description_override ?? '')
  }

  const startEditTable = (tableRef: any) => {
    setEditingTableId(tableRef.id)
    setAdminTableLabel(tableRef.label)
    setAdminTableQrToken(tableRef.qr_token)
    setAdminTableGroupName(tableRef.group_name ?? '')
    setAdminTableSortOrder(String(tableRef.sort_order ?? 0))
    setAdminTableIsActive(tableRef.is_active)
  }

  const beginEditPaymentMethod = (pm: any) => {
    setEditingPaymentMethodId(pm.id)
    setAdminPaymentMethodName(pm.name)
    setAdminPaymentMethodSortOrder(String(pm.sort_order ?? 0))
    setAdminPaymentMethodIsActive(pm.is_active)
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
    resetBook,

    editingCategoryId, setEditingCategoryId,
    adminCategoryName, setAdminCategoryName,
    adminCategorySortOrder, setAdminCategorySortOrder,
    resetCategory,

    editingSubCategoryId, setEditingSubCategoryId,
    adminSubCategoryName, setAdminSubCategoryName,
    adminSubCategorySortOrder, setAdminSubCategorySortOrder,
    adminCategoryParentId, setAdminCategoryParentId,
    resetSubCategory,

    editingMenuItemId, setEditingMenuItemId,
    adminItemCategoryId, setAdminItemCategoryId,
    adminItemCode, setAdminItemCode,
    adminItemName, setAdminItemName,
    adminItemPrice, setAdminItemPrice,
    adminItemTaxType, setAdminItemTaxType,
    adminItemImageUrl, setAdminItemImageUrl,
    adminItemSortOrder, setAdminItemSortOrder,
    adminItemIsActive, setAdminItemIsActive,
    adminItemIsSoldOut, setAdminItemIsSoldOut,
    adminItemToppingIds, setAdminItemToppingIds,
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
    resetTable,

    editingPaymentMethodId, setEditingPaymentMethodId,
    adminPaymentMethodName, setAdminPaymentMethodName,
    adminPaymentMethodSortOrder, setAdminPaymentMethodSortOrder,
    adminPaymentMethodIsActive, setAdminPaymentMethodIsActive,
    resetPaymentMethod,

    editingStaffUserId, setEditingStaffUserId,
    adminStaffEmail, setAdminStaffEmail,
    adminStaffPassword, setAdminStaffPassword,
    adminStaffDisplayName, setAdminStaffDisplayName,
    adminStaffRoleType, setAdminStaffRoleType,
    adminStaffIsActive, setAdminStaffIsActive,
    resetStaffUser,

    adminStoreName, setAdminStoreName,
    adminStoreSlug, setAdminStoreSlug,
    adminStoreTimezone, setAdminStoreTimezone,
    adminStoreBusinessOffsetMinutes, setAdminStoreBusinessOffsetMinutes,
    adminStorePaymentTimingMode, setAdminStorePaymentTimingMode,
    adminStoreTicketNoResetMode, setAdminStoreTicketNoResetMode,
    adminStoreTicketNoDigits, setAdminStoreTicketNoDigits,
    itemImageUploadBusy, setItemImageUploadBusy,
    startEditMenuBook,
    startEditCategory,
    startEditSubCategory,
    startEditMenuItem,
    startEditPlacement,
    startEditTable,
    beginEditPaymentMethod,
    startEditStaffUser,
  }
}
