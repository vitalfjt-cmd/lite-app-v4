import { StaffProfile, LiveStore, LiveTableRef, LiveStaffUser, LiveMenuItem } from '../types'
import {
  saveAdminPrototypeMenuBook,
  saveAdminPrototypeStore,
  saveAdminPrototypeTable,
  saveAdminPrototypeStaffUser,
  saveAdminPrototypeCategory,
  saveAdminPrototypeSubcategory,
  saveAdminPrototypeItem,
  saveAdminPrototypeBookCategory,
  saveAdminPrototypeBookCategorySubcategory,
  saveAdminPrototypePlacement,
  deleteAdminPrototypeMenuBook,
  deleteAdminPrototypeCategory,
  deleteAdminPrototypeSubcategory,
  deleteAdminPrototypeItem,
  deleteAdminPrototypeTable,
  deleteAdminPrototypeStaffUser,
  deleteAdminPrototypeBookCategory,
  deleteAdminPrototypeBookCategorySubcategory,
  deleteAdminPrototypePlacement,
  saveAdminPrototypePaymentMethod,
  deleteAdminPrototypePaymentMethod,
  staffReadApiEnabled,
  staffReadStoreSlugOverride
} from '../lib/staffReadApi'
import { toBookCode, toQrTokenPart, formatError, resizeMenuItemImage, fileToDataUrl } from '../lib/appUtils'

export type AdminOperationsDependencies = {
  profile: StaffProfile | null
  liveStore: LiveStore | null
  adminForm: any // useAdminForm return type
  liveItems: LiveMenuItem[]
  liveBookCategoryRows: any[]
  liveBookCategorySubcategoryRows: any[]
  livePlacements: any[]
  setMutationBusy: (busy: string | null) => void
  setItemImageUploadBusy: (busy: boolean) => void
  setAdminMessage: (msg: string | null) => void
  setError: (err: string | null) => void
  refreshAdminData: () => Promise<void>
  refreshLiveData: () => Promise<void>
}

export function useAdminOperations(deps: AdminOperationsDependencies) {
  const {
    profile, liveStore, adminForm,
    liveItems, liveBookCategoryRows, liveBookCategorySubcategoryRows, livePlacements,
    setMutationBusy, setItemImageUploadBusy, setAdminMessage, setError,
    refreshAdminData
  } = deps

  const createMenuBook = async () => {
    if (!profile || profile.role_type !== 'ADMIN' || !adminForm.adminMenuBookName.trim()) return
    setMutationBusy('admin-menu-book')
    setAdminMessage(null)
    try {
      const normalizedCode = toBookCode(adminForm.adminMenuBookCode || adminForm.adminMenuBookName)
      const sortOrder = Number(adminForm.adminMenuBookSortOrder)
      if (!normalizedCode) {
        setAdminMessage('メニューブックコードを入力してください。')
        return
      }
      if (!Number.isFinite(sortOrder)) {
        setAdminMessage('表示順を正しく入力してください。')
        return
      }
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await saveAdminPrototypeMenuBook(storeSlug, {
          menuBookId: adminForm.editingMenuBookId ?? undefined,
          code: normalizedCode,
          name: adminForm.adminMenuBookName.trim(),
          description: adminForm.adminMenuBookDescription.trim() || null,
          sortOrder: sortOrder,
          isActive: adminForm.adminMenuBookIsActive,
          availableFromTime: adminForm.adminMenuBookAvailableFromTime || null,
          availableToTime: adminForm.adminMenuBookAvailableToTime || null,
          validFrom: adminForm.adminMenuBookValidFrom || null,
          validTo: adminForm.adminMenuBookValidTo || null,
        })
        await refreshAdminData()
      }
      adminForm.resetBook()
      setAdminMessage(adminForm.editingMenuBookId ? 'メニューブックを更新しました。' : 'メニューブックを追加しました。')
    } catch (err) {
      const message = formatError(err)
      setError(message)
      window.alert(message)
    } finally {
      setMutationBusy(null)
    }
  }

  const saveStoreSettings = async () => {
    if (!profile || profile.role_type !== 'ADMIN' || !liveStore) return
    setMutationBusy('admin-store')
    setAdminMessage(null)
    try {
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore.slug
        await saveAdminPrototypeStore(storeSlug, {
          storeId: liveStore.id,
          name: adminForm.adminStoreName.trim(),
          slug: adminForm.adminStoreSlug.trim(),
          timezone: adminForm.adminStoreTimezone.trim() || 'Asia/Tokyo',
          businessDateOffsetMinutes: Number(adminForm.adminStoreBusinessOffsetMinutes) || 0,
          paymentTimingMode: adminForm.adminStorePaymentTimingMode,
          ticketNoResetMode: adminForm.adminStoreTicketNoResetMode,
          ticketNoDigits: Number(adminForm.adminStoreTicketNoDigits) || 4,
        })
        await refreshAdminData()
      }
      setAdminMessage('店舗設定を更新しました。')
    } catch (err) {
      const message = formatError(err)
      setError(message)
      setAdminMessage(message)
      window.alert(message)
    } finally {
      setMutationBusy(null)
    }
  }

  const saveTableRef = async () => {
    if (!profile || profile.role_type !== 'ADMIN' || !adminForm.adminTableLabel.trim()) return false
    setMutationBusy('admin-table')
    setAdminMessage(null)
    try {
      const generatedQrToken = adminForm.adminTableQrToken.trim() || (liveStore?.slug ? `qr-${liveStore.slug}-${toQrTokenPart(adminForm.adminTableLabel)}` : '')
      const nextSortOrder = Number.parseInt(adminForm.adminTableSortOrder || '0', 10)
      if (!generatedQrToken) {
        throw new Error('QRトークンを生成できませんでした。店舗 slug とテーブル名を確認してください。')
      }
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await saveAdminPrototypeTable(storeSlug, {
          tableId: adminForm.editingTableId ?? undefined,
          label: adminForm.adminTableLabel.trim(),
          qrToken: generatedQrToken,
          groupName: adminForm.adminTableGroupName.trim() || null,
          sortOrder: Number.isFinite(nextSortOrder) ? nextSortOrder : 0,
          isActive: adminForm.adminTableIsActive,
        })
        await refreshAdminData()
      }
      adminForm.resetTable()
      setAdminMessage(adminForm.editingTableId ? 'テーブルを更新しました。' : 'テーブルを追加しました。')
      return true
    } catch (err) {
      const message = formatError(err)
      setError(message)
      setAdminMessage(message)
      window.alert(message)
      return false
    } finally {
      setMutationBusy(null)
    }
  }

  const saveStaffUser = async () => {
    if (!profile || profile.role_type !== 'ADMIN' || !adminForm.adminStaffDisplayName.trim() || !liveStore) return false
    setMutationBusy('admin-staff-user')
    setAdminMessage(null)
    try {
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await saveAdminPrototypeStaffUser(storeSlug, {
          staffUserId: adminForm.editingStaffUserId || undefined,
          email: adminForm.adminStaffEmail.trim() || null,
          password: adminForm.adminStaffPassword.trim() || null,
          displayName: adminForm.adminStaffDisplayName.trim(),
          roleType: adminForm.adminStaffRoleType,
          isActive: adminForm.adminStaffIsActive,
        })
        await refreshAdminData()
      }
      adminForm.resetStaffUser()
      setAdminMessage(adminForm.editingStaffUserId ? 'スタッフを更新しました。' : 'スタッフを追加しました。')
      return true
    } catch (err) {
      const message = formatError(err)
      setError(message)
      setAdminMessage(message)
      window.alert(message)
      return false
    } finally {
      setMutationBusy(null)
    }
  }

  const savePaymentMethod = async () => {
    if (!profile || profile.role_type !== 'ADMIN' || !adminForm.adminPaymentMethodName.trim()) return false
    setMutationBusy('admin-payment-method')
    setAdminMessage(null)
    try {
      const nextSortOrder = Number.parseInt(adminForm.adminPaymentMethodSortOrder || '0', 10)
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await saveAdminPrototypePaymentMethod(storeSlug, {
          paymentMethodId: adminForm.editingPaymentMethodId ?? undefined,
          name: adminForm.adminPaymentMethodName.trim(),
          sortOrder: Number.isFinite(nextSortOrder) ? nextSortOrder : 0,
          isActive: adminForm.adminPaymentMethodIsActive,
        })
        await refreshAdminData()
      }
      adminForm.resetPaymentMethod()
      setAdminMessage(adminForm.editingPaymentMethodId ? '決済種別を更新しました。' : '決済種別を追加しました。')
      return true
    } catch (err) {
      const message = formatError(err)
      setError(message)
      setAdminMessage(message)
      window.alert(message)
      return false
    } finally {
      setMutationBusy(null)
    }
  }

  const deletePaymentMethod = async (id: string) => {
    if (!profile || profile.role_type !== 'ADMIN') return
    if (!window.confirm('この決済種別を削除しますか？')) return
    setMutationBusy('admin-payment-method')
    try {
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await deleteAdminPrototypePaymentMethod(storeSlug, id)
        await refreshAdminData()
      }
      setAdminMessage('決済種別を削除しました。')
    } catch (err) {
      window.alert(formatError(err))
    } finally {
      setMutationBusy(null)
    }
  }

  const createCategory = async () => {
    if (!profile || profile.role_type !== 'ADMIN' || !adminForm.adminCategoryName.trim()) return
    setMutationBusy('admin-category')
    setAdminMessage(null)
    try {
      const nextSortOrder = Number(adminForm.adminCategorySortOrder)
      if (!Number.isFinite(nextSortOrder)) {
        setAdminMessage('表示順を正しく入力してください。')
        return
      }
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await saveAdminPrototypeCategory(storeSlug, {
          categoryId: adminForm.editingCategoryId ?? undefined,
          name: adminForm.adminCategoryName.trim(),
          sortOrder: nextSortOrder,
          isActive: true,
          parentCategoryId: null,
        })
        await refreshAdminData()
      }
      adminForm.resetCategory()
      setAdminMessage(adminForm.editingCategoryId ? 'カテゴリを更新しました。' : 'カテゴリを追加しました。')
    } catch (err) {
      setError(formatError(err))
    } finally {
      setMutationBusy(null)
    }
  }

  const createSubCategory = async () => {
    if (!profile || profile.role_type !== 'ADMIN' || !adminForm.adminSubCategoryName.trim()) return
    setMutationBusy('admin-subcategory')
    setAdminMessage(null)
    try {
      const nextSortOrder = Number(adminForm.adminSubCategorySortOrder)
      if (!Number.isFinite(nextSortOrder)) {
        setAdminMessage('表示順を正しく入力してください。')
        return
      }
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await saveAdminPrototypeSubcategory(storeSlug, {
          subcategoryId: adminForm.editingSubCategoryId ?? undefined,
          name: adminForm.adminSubCategoryName.trim(),
          sortOrder: nextSortOrder,
          isActive: true,
        })
        await refreshAdminData()
      }
      adminForm.resetSubCategory()
      setAdminMessage(adminForm.editingSubCategoryId ? 'サブカテゴリを更新しました。' : 'サブカテゴリを追加しました。')
    } catch (err) {
      setError(formatError(err))
    } finally {
      setMutationBusy(null)
    }
  }

  const createMenuItem = async () => {
    if (!profile || profile.role_type !== 'ADMIN' || !adminForm.adminItemName.trim()) return false
    setMutationBusy('admin-item')
    setAdminMessage(null)
    try {
      const price = Number(adminForm.adminItemPrice)
      const sortOrder = Number(adminForm.adminItemSortOrder)
      if (!Number.isFinite(price) || !Number.isFinite(sortOrder)) {
        setAdminMessage('価格または表示順を正しく入力してください。')
        return false
      }
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await saveAdminPrototypeItem(storeSlug, {
          itemId: adminForm.editingMenuItemId ?? undefined,
          categoryId: adminForm.adminItemCategoryId,
          code: adminForm.adminItemCode.trim() || null,
          name: adminForm.adminItemName.trim(),
          nameEn: adminForm.adminItemNameEn.trim() || null,
          price,
          taxType: adminForm.adminItemTaxType,
          imageUrl: adminForm.adminItemImageUrl.trim() || null,
          sortOrder: sortOrder,
          isActive: adminForm.adminItemIsActive,
          isSoldOut: adminForm.adminItemIsSoldOut,
          toppingIds: adminForm.adminItemToppingIds,
        })
        await refreshAdminData()
      }
      adminForm.resetItem()
      setAdminMessage(adminForm.editingMenuItemId ? '商品情報を更新しました。' : '商品を追加しました。')
      return true
    } catch (err) {
      setError(formatError(err))
      return false
    } finally {
      setMutationBusy(null)
    }
  }

  const uploadMenuItemImage = async (file: File) => {
    if (!profile || profile.role_type !== 'ADMIN') {
      setAdminMessage('ADMIN 権限でログインしてください。')
      window.alert('ADMIN 権限でログインしてください。')
      return
    }

    setItemImageUploadBusy(true)
    setAdminMessage(null)
    try {
      const resizedFile = await resizeMenuItemImage(file)
      if (staffReadApiEnabled) {
        const dataUrl = await fileToDataUrl(resizedFile)
        adminForm.setAdminItemImageUrl(dataUrl)
        setAdminMessage('画像を設定しました。')
        window.alert('画像を設定しました。')
        return
      }
    } catch (err) {
      const message = formatError(err)
      setError(message)
      setAdminMessage(message)
      window.alert(message)
    } finally {
      setItemImageUploadBusy(false)
    }
  }

  const clearMenuItemImage = () => {
    adminForm.setAdminItemImageUrl('')
    setAdminMessage('画像を外しました。')
  }

  const createBookCategory = async () => {
    if (!profile || profile.role_type !== 'ADMIN' || !adminForm.adminPlacementMenuBookId || !adminForm.adminPlacementTopCategoryId) return false
    setMutationBusy('admin-book-category')
    setAdminMessage(null)
    try {
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await saveAdminPrototypeBookCategory(storeSlug, {
          menuBookId: adminForm.adminPlacementMenuBookId,
          categoryId: adminForm.adminPlacementTopCategoryId,
          sortOrder: 10,
          isActive: true,
        })
        await refreshAdminData()
      }
      setAdminMessage('メニューブックにカテゴリを追加しました。')
      return true
    } catch (err) {
      setError(formatError(err))
      return false
    } finally {
      setMutationBusy(null)
    }
  }

  const createBookCategorySubcategory = async () => {
    if (!profile || profile.role_type !== 'ADMIN' || !adminForm.adminPlacementMenuBookId || !adminForm.adminPlacementTopCategoryId || !adminForm.adminPlacementCategoryId) return false
    setMutationBusy('admin-book-subcategory')
    setAdminMessage(null)
    try {
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await saveAdminPrototypeBookCategorySubcategory(storeSlug, {
          menuBookId: adminForm.adminPlacementMenuBookId,
          categoryId: adminForm.adminPlacementTopCategoryId,
          subcategoryId: adminForm.adminPlacementCategoryId,
          sortOrder: 10,
          isActive: true,
        })
        await refreshAdminData()
      }
      setAdminMessage('メニューブックにサブカテゴリを追加しました。')
      return true
    } catch (err) {
      setError(formatError(err))
      return false
    } finally {
      setMutationBusy(null)
    }
  }

  const savePlacement = async () => {
    if (!profile || profile.role_type !== 'ADMIN' || !adminForm.adminPlacementMenuBookId || !adminForm.adminPlacementTopCategoryId || !adminForm.adminPlacementCategoryId || !adminForm.adminPlacementItemId) return false
    setMutationBusy('admin-placement')
    setAdminMessage(null)
    try {
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await saveAdminPrototypePlacement(storeSlug, {
          placementId: adminForm.editingPlacementId ?? undefined,
          menuBookId: adminForm.adminPlacementMenuBookId,
          categoryId: adminForm.adminPlacementTopCategoryId,
          subcategoryId: adminForm.adminPlacementCategoryId,
          itemId: adminForm.adminPlacementItemId,
          displayNameOverride: adminForm.adminPlacementDisplayNameOverride.trim() || null,
          descriptionOverride: adminForm.adminPlacementDescriptionOverride.trim() || null,
          sortOrder: 10,
          isActive: true,
        })
        await refreshAdminData()
      }
      adminForm.resetPlacement()
      setAdminMessage(adminForm.editingPlacementId ? '配置を更新しました。' : '配置を追加しました。')
      return true
    } catch (err) {
      setError(formatError(err))
      return false
    } finally {
      setMutationBusy(null)
    }
  }

  const deleteMenuBook = async (id: string) => {
    if (!profile || profile.role_type !== 'ADMIN') return
    if (!window.confirm('このメニューブックを削除しますか？')) return
    setMutationBusy('admin-menu-book')
    try {
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await deleteAdminPrototypeMenuBook(storeSlug, id)
        await refreshAdminData()
      }
      setAdminMessage('メニューブックを削除しました。')
    } catch (err) {
      window.alert(formatError(err))
    } finally {
      setMutationBusy(null)
    }
  }

  const toggleSoldOut = async (id: string, nextValue: boolean) => {
    if (!profile || profile.role_type !== 'ADMIN') return
    setMutationBusy('admin-item')
    try {
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        const item = liveItems.find((i) => i.id === id)
        if (!item) throw new Error('Item not found')
        await saveAdminPrototypeItem(storeSlug, {
          itemId: id,
          categoryId: item.category_id,
          name: item.name,
          nameEn: item.name_en ?? null,
          price: item.price,
          taxType: item.tax_type ?? 'INCLUDED',
          isSoldOut: nextValue,
          sortOrder: item.sort_order,
          isActive: item.is_active,
          toppingIds: item.toppings?.map((t: any) => t.id),
        })
        await refreshAdminData()
      }
      setAdminMessage(nextValue ? '商品を売切に設定しました。' : '商品の売切を解除しました。')
    } catch (err) {
      setError(formatError(err))
    } finally {
      setMutationBusy(null)
    }
  }

  const deleteCategory = async (id: string) => {
    if (!profile || profile.role_type !== 'ADMIN') return
    if (!window.confirm('このカテゴリを削除しますか？')) return
    setMutationBusy('admin-category')
    try {
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await deleteAdminPrototypeCategory(storeSlug, id)
        await refreshAdminData()
      }
      setAdminMessage('カテゴリを削除しました。')
    } catch (err) {
      window.alert(formatError(err))
    } finally {
      setMutationBusy(null)
    }
  }

  const deleteSubcategory = async (id: string) => {
    if (!profile || profile.role_type !== 'ADMIN') return
    if (!window.confirm('このサブカテゴリを削除しますか？')) return
    setMutationBusy('admin-subcategory')
    try {
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await deleteAdminPrototypeSubcategory(storeSlug, id)
        await refreshAdminData()
      }
      setAdminMessage('サブカテゴリを削除しました。')
    } catch (err) {
      window.alert(formatError(err))
    } finally {
      setMutationBusy(null)
    }
  }

  const deleteMenuItem = async (id: string) => {
    if (!profile || profile.role_type !== 'ADMIN') return
    if (!window.confirm('この商品を削除しますか？')) return
    setMutationBusy('admin-item')
    try {
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await deleteAdminPrototypeItem(storeSlug, id)
        await refreshAdminData()
      }
      setAdminMessage('商品を削除しました。')
    } catch (err) {
      window.alert(formatError(err))
    } finally {
      setMutationBusy(null)
    }
  }

  const deleteTable = async (id: string) => {
    if (!profile || profile.role_type !== 'ADMIN') return
    if (!window.confirm('このテーブルを削除しますか？')) return
    setMutationBusy('admin-table')
    try {
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await deleteAdminPrototypeTable(storeSlug, id)
        await refreshAdminData()
      }
      setAdminMessage('テーブルを削除しました。')
    } catch (err) {
      window.alert(formatError(err))
    } finally {
      setMutationBusy(null)
    }
  }

  const deleteStaffUser = async (id: string) => {
    if (!profile || profile.role_type !== 'ADMIN') return
    if (!window.confirm('このスタッフを削除しますか？')) return
    setMutationBusy('admin-staff-user')
    try {
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await deleteAdminPrototypeStaffUser(storeSlug, id)
        await refreshAdminData()
      }
      setAdminMessage('スタッフを削除しました。')
    } catch (err) {
      window.alert(formatError(err))
    } finally {
      setMutationBusy(null)
    }
  }

  const deleteBookCategory = async (id: string) => {
    if (!profile || profile.role_type !== 'ADMIN') return
    if (!window.confirm('このメニューブックカテゴリを削除しますか？')) return
    setMutationBusy('admin-book-category')
    try {
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await deleteAdminPrototypeBookCategory(storeSlug, id)
        await refreshAdminData()
      }
      setAdminMessage('メニューブックカテゴリを削除しました。')
    } catch (err) {
      window.alert(formatError(err))
    } finally {
      setMutationBusy(null)
    }
  }

  const deleteBookCategorySubcategory = async (id: string) => {
    if (!profile || profile.role_type !== 'ADMIN') return
    if (!window.confirm('このメニューブックサブカテゴリを削除しますか？')) return
    setMutationBusy('admin-book-subcategory')
    try {
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await deleteAdminPrototypeBookCategorySubcategory(storeSlug, id)
        await refreshAdminData()
      }
      setAdminMessage('メニューブックからサブカテゴリを削除しました。')
    } catch (err) {
      window.alert(formatError(err))
    } finally {
      setMutationBusy(null)
    }
  }

  const deletePlacement = async (id: string) => {
    if (!profile || profile.role_type !== 'ADMIN') return
    if (!window.confirm('この配置を削除しますか？')) return
    setMutationBusy('admin-placement')
    try {
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await deleteAdminPrototypePlacement(storeSlug, id)
        await refreshAdminData()
      }
      setAdminMessage('配置を削除しました。')
    } catch (err) {
      window.alert(formatError(err))
    } finally {
      setMutationBusy(null)
    }
  }

  const saveBookCategorySort = async (id: string, sortOrder: string) => {
    if (!profile || profile.role_type !== 'ADMIN') return
    const row = liveBookCategoryRows.find((r) => r.id === id)
    if (!row) return
    setMutationBusy('admin-book-category-sort')
    try {
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await saveAdminPrototypeBookCategory(storeSlug, {
          relationId: row.id,
          menuBookId: row.menuBookId,
          categoryId: row.topCategoryId,
          sortOrder: Number(sortOrder) || 0,
          isActive: true,
        })
        await refreshAdminData()
      }
      setAdminMessage('カテゴリの表示順を更新しました。')
    } catch (err) {
      window.alert(formatError(err))
    } finally {
      setMutationBusy(null)
    }
  }

  const saveBookCategorySubcategorySort = async (id: string, sortOrder: string) => {
    if (!profile || profile.role_type !== 'ADMIN') return
    const row = liveBookCategorySubcategoryRows.find((r) => r.id === id)
    if (!row) return
    setMutationBusy('admin-book-subcategory-sort')
    try {
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await saveAdminPrototypeBookCategorySubcategory(storeSlug, {
          relationId: row.id,
          menuBookId: row.menuBookId,
          categoryId: row.topCategoryId,
          subcategoryId: row.subcategoryId,
          sortOrder: Number(sortOrder) || 0,
          isActive: true,
        })
        await refreshAdminData()
      }
      setAdminMessage('サブカテゴリの表示順を更新しました。')
    } catch (err) {
      window.alert(formatError(err))
    } finally {
      setMutationBusy(null)
    }
  }

  const savePlacementSort = async (id: string, sortOrder: string) => {
    if (!profile || profile.role_type !== 'ADMIN') return
    const row = livePlacements.find((r) => r.id === id)
    if (!row) return
    setMutationBusy('admin-placement-sort')
    try {
      if (staffReadApiEnabled) {
        const storeSlug = staffReadStoreSlugOverride || liveStore?.slug
        if (!storeSlug) throw new Error('staff_store_slug_missing')
        await saveAdminPrototypePlacement(storeSlug, {
          placementId: row.id,
          menuBookId: row.menuBookId,
          categoryId: row.topCategoryId,
          subcategoryId: row.subcategoryId,
          itemId: row.itemId,
          sortOrder: Number(sortOrder) || 0,
          isActive: true,
          displayNameOverride: row.displayNameOverride,
          descriptionOverride: row.descriptionOverride,
        })
        await refreshAdminData()
      }
      setAdminMessage('メニューの表示順を更新しました。')
    } catch (err) {
      window.alert(formatError(err))
    } finally {
      setMutationBusy(null)
    }
  }

  return {
    createMenuBook,
    saveStoreSettings,
    saveTableRef,
    saveStaffUser,
    createCategory,
    createSubCategory,
    createMenuItem,
    uploadMenuItemImage,
    clearMenuItemImage,
    toggleSoldOut,
    createBookCategoryPlacement: createBookCategory,
    createBookCategorySubcategoryPlacement: createBookCategorySubcategory,
    createMenuPlacement: savePlacement,
    deleteMenuBook,
    deleteCategory,
    deleteSubcategory,
    deleteMenuItem,
    deleteTable,
    deleteStaffUser,
    savePaymentMethod,
    deletePaymentMethod,
    deleteBookCategory,
    deleteBookCategorySubcategory,
    deletePlacement,
    saveBookCategorySort,
    saveBookCategorySubcategorySort,
    savePlacementSort,
  }
}
