import { useMemo, useState } from 'react'
import { useEffect } from 'react'

import { AdminItemModal } from './admin/AdminItemModal'
import { AdminItemsTab } from './admin/AdminItemsTab'
import { AdminTableModal } from './admin/AdminTableModal'
import { AdminTablesTab } from './admin/AdminTablesTab'
import { AdminMenuBookModal } from './admin/AdminMenuBookModal'
import { AdminMenuBooksTab } from './admin/AdminMenuBooksTab'
import { AdminCategoryModal } from './admin/AdminCategoryModal'
import { AdminCategoriesTab } from './admin/AdminCategoriesTab'
import { AdminSubcategoryModal } from './admin/AdminSubcategoryModal'
import { AdminSubcategoriesTab } from './admin/AdminSubcategoriesTab'
import { AdminStaffModal } from './admin/AdminStaffModal'
import { AdminStaffTab } from './admin/AdminStaffTab'
import { AdminPlacementModal, AdminPlacementCategoryModal, AdminPlacementSubcategoryModal } from './admin/AdminPlacementModals'
import { AdminPlacementsTab } from './admin/AdminPlacementsTab'
import { AdminStoreTab } from './admin/AdminStoreTab'
import { AdminSalesTab } from './admin/AdminSalesTab'
import { AdminSalesHistoryTab } from './admin/AdminSalesHistoryTab'
import { AdminPaymentHistoryTab } from './admin/AdminPaymentHistoryTab'
import { AdminCategory, AdminMenuBook, AdminMenuItem, AdminPlacementRow, AdminBookCategoryRow, AdminBookCategorySubcategoryRow, AdminStoreSettings, AdminTableRow, AdminStaffUserRow, AdminTab } from './admin/types'


const ADMIN_TABS: Array<{ id: AdminTab; label: string; caption: string }> = [
  { id: 'menuBooks', label: 'メニューブック', caption: '時間帯・期間・公開設定' },
  { id: 'categories', label: 'カテゴリ', caption: '親カテゴリ管理' },
  { id: 'subcategories', label: 'サブカテゴリ', caption: '商品分類管理' },
  { id: 'items', label: 'メニュー', caption: '商品マスタ' },
  { id: 'placements', label: 'メニューブック構成', caption: '掲載カテゴリ・商品紐付け' },
  { id: 'sales', label: 'レジ締め・売上状況', caption: '営業日・本日売上' },
  { id: 'salesHistory', label: '売上データ照会', caption: '期間指定での売上・客数照会' },
  { id: 'paymentHistory', label: '会計種別データ照会', caption: '期間指定での決済別売上照会' },
  { id: 'store', label: '店舗', caption: '店舗設定' },
  { id: 'tables', label: 'テーブル', caption: '席・QR管理' },
  { id: 'staff', label: 'スタッフ', caption: '認証・権限管理' },
]

const D1_EDITABLE_ADMIN_TABS: AdminTab[] = ['menuBooks', 'categories', 'subcategories', 'items', 'placements', 'store', 'tables', 'staff', 'sales', 'salesHistory', 'paymentHistory']

type Props = {
  mode?: 'master' | 'sales'
  storeName: string
  categoryCount: number
  itemCount: number
  roleType: 'ADMIN' | 'STAFF' | 'KDS' | null
  adminReadOnlyMode?: boolean
  adminMessage: string | null
  mutationBusy: string | null
  liveStoreSettings: AdminStoreSettings
  liveMenuBooks: AdminMenuBook[]
  liveParentCategories: AdminCategory[]
  liveCategories: AdminCategory[]
  liveMenuItems: AdminMenuItem[]
  visibleItems: AdminMenuItem[]
  liveBookCategoryRows: AdminBookCategoryRow[]
  liveBookCategorySubcategoryRows: AdminBookCategorySubcategoryRow[]
  livePlacements: AdminPlacementRow[]
  liveTables: AdminTableRow[]
  liveStaffUsers: AdminStaffUserRow[]
  adminMenuBookName: string
  adminMenuBookCode: string
  adminMenuBookDescription: string
  adminMenuBookSortOrder: string
  adminMenuBookIsActive: boolean
  adminMenuBookAvailableFromTime: string
  adminMenuBookAvailableToTime: string
  adminMenuBookValidFrom: string
  adminMenuBookValidTo: string
  editingMenuBookId: string | null
  adminCategoryName: string
  adminCategorySortOrder: string
  editingCategoryId: string | null
  adminSubCategoryName: string
  adminSubCategorySortOrder: string
  adminSubCategoryParentCategoryId?: string
  editingSubCategoryId: string | null
  adminMenuBookId: string
  adminItemCategoryId: string
  adminItemCode: string
  adminItemName: string
  adminItemPrice: string
  adminItemTaxType: 'INCLUDED' | 'EXCLUDED' | 'NONE'
  adminItemImageUrl: string
  itemImageUploadBusy: boolean
  adminItemSortOrder: string
  adminItemIsActive: boolean
  adminItemIsSoldOut: boolean
  editingMenuItemId: string | null
  adminPlacementMenuBookId: string
  adminPlacementTopCategoryId: string
  adminPlacementCategoryId: string
  adminPlacementItemId: string
  adminPlacementDisplayNameOverride: string
  adminPlacementDescriptionOverride: string
  editingPlacementId: string | null
  adminStoreName: string
  adminStoreSlug: string
  adminStoreTimezone: string
  adminStoreBusinessOffsetMinutes: string
  adminStorePaymentTimingMode: 'PREPAID' | 'POSTPAID'
  adminStoreTicketNoResetMode: 'DAILY' | 'SEQUENCE'
  adminStoreTicketNoDigits: string
  adminTableLabel: string
  adminTableQrToken: string
  adminTableGroupName: string
  adminTableSortOrder: string
  adminTableIsActive: boolean
  editingTableId: string | null
  adminStaffEmail: string
  adminStaffPassword: string
  adminStaffDisplayName: string
  adminStaffRoleType: 'ADMIN' | 'STAFF' | 'KDS'
  adminStaffIsActive: boolean
  editingStaffUserId: string | null
  yen: (value: number) => string
  messageTone: (message: string | null) => 'success' | 'error'
  onMenuBookNameChange: (value: string) => void
  onMenuBookCodeChange: (value: string) => void
  onMenuBookDescriptionChange: (value: string) => void
  onMenuBookSortOrderChange: (value: string) => void
  onMenuBookIsActiveChange: (value: boolean) => void
  onMenuBookAvailableFromTimeChange: (value: string) => void
  onMenuBookAvailableToTimeChange: (value: string) => void
  onMenuBookValidFromChange: (value: string) => void
  onMenuBookValidToChange: (value: string) => void
  onCreateMenuBook: () => void
  onCancelMenuBookEdit: () => void
  onCategoryNameChange: (value: string) => void
  onCategorySortOrderChange: (value: string) => void
  onCreateCategory: () => void
  onCancelCategoryEdit: () => void
  onSubCategoryNameChange: (value: string) => void
  onSubCategorySortOrderChange: (value: string) => void
  onSubCategoryParentCategoryChange: (value: string) => void
  onCreateSubCategory: () => void
  onCancelSubCategoryEdit: () => void
  onMenuBookChange: (value: string) => void
  onItemCategoryChange: (value: string) => void
  onItemCodeChange: (value: string) => void
  onItemNameChange: (value: string) => void
  onItemPriceChange: (value: string) => void
  onItemTaxTypeChange: (value: 'INCLUDED' | 'EXCLUDED' | 'NONE') => void
  onItemImageUrlChange: (value: string) => void
  onUploadItemImage: (file: File) => Promise<void>
  onClearItemImage: () => void
  onItemSortOrderChange: (value: string) => void
  onItemIsActiveChange: (value: boolean) => void
  onItemIsSoldOutChange: (value: boolean) => void
  onCreateMenuItem: () => Promise<boolean>
  onCancelMenuItemEdit: () => void
  onPlacementMenuBookChange: (value: string) => void
  onPlacementTopCategoryChange: (value: string) => void
  onPlacementCategoryChange: (value: string) => void
  onPlacementItemChange: (value: string) => void
  onPlacementDisplayNameOverrideChange: (value: string) => void
  onPlacementDescriptionOverrideChange: (value: string) => void
  onCreatePlacement: () => Promise<boolean>
  onCreateBookCategory: () => Promise<boolean>
  onCreateBookCategorySubcategory: () => Promise<boolean>
  onCancelPlacementEdit: () => void
  onStoreNameChange: (value: string) => void
  onStoreSlugChange: (value: string) => void
  onStoreTimezoneChange: (value: string) => void
  onStoreBusinessOffsetMinutesChange: (value: string) => void
  onStorePaymentTimingModeChange: (value: 'PREPAID' | 'POSTPAID') => void
  onStoreTicketNoResetModeChange: (value: 'DAILY' | 'SEQUENCE') => void
  onStoreTicketNoDigitsChange: (value: string) => void
  onSaveStoreSettings: () => void
  onTableLabelChange: (value: string) => void
  onTableQrTokenChange: (value: string) => void
  onTableGroupNameChange: (value: string) => void
  onTableSortOrderChange: (value: string) => void
  onTableIsActiveChange: (value: boolean) => void
  onSaveTableRef: () => Promise<boolean>
  onCancelTableEdit: () => void
  onStaffEmailChange: (value: string) => void
  onStaffPasswordChange: (value: string) => void
  onStaffDisplayNameChange: (value: string) => void
  onStaffRoleTypeChange: (value: 'ADMIN' | 'STAFF' | 'KDS') => void
  onStaffIsActiveChange: (value: boolean) => void
  onSaveStaffUser: () => void | boolean | Promise<boolean | void>
  onCancelStaffUserEdit: () => void
  onToggleSoldOut: (itemId: string, nextValue: boolean) => void
  onEditMenuBook: (id: string) => void
  onDeleteMenuBook: (id: string) => void
  onEditCategory: (id: string) => void
  onDeleteCategory: (id: string) => void
  onEditSubCategory: (id: string) => void
  onDeleteSubCategory: (id: string) => void
  onEditMenuItem: (id: string) => void
  onDeleteMenuItem: (id: string) => void
  onDeleteBookCategory: (id: string) => void
  onDeleteBookCategorySubcategory: (id: string) => void
  onSaveBookCategorySort: (id: string, sortOrder: string) => void
  onSaveBookCategorySubcategorySort: (id: string, sortOrder: string) => void
  onSavePlacementSort: (id: string, sortOrder: string) => void
  onEditPlacement: (id: string) => void
  onDeletePlacement: (id: string) => void
  onEditTable: (id: string) => void
  onDeleteTable: (id: string) => void
  onEditStaffUser: (id: string) => void
  onDeleteStaffUser: (id: string) => void
  onOpenLauncher?: () => void
}

function checkBox(checked: boolean, onChange: (next: boolean) => void, disabled = false) {
  return <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
}

export function AdminScreen(props: Props) {
  const [activeTab, setActiveTab] = useState<AdminTab>(props.mode === 'sales' ? 'sales' : 'menuBooks')
  
  useEffect(() => {
    setActiveTab(props.mode === 'sales' ? 'sales' : 'menuBooks')
  }, [props.mode])

  const tabs = useMemo(() => {
    if (props.mode === 'sales') {
      return ADMIN_TABS.filter((t) => t.id === 'sales' || t.id === 'salesHistory' || t.id === 'paymentHistory')
    } else {
      return ADMIN_TABS.filter((t) => t.id !== 'sales' && t.id !== 'salesHistory' && t.id !== 'paymentHistory')
    }
  }, [props.mode])
  const [menuBookModalOpen, setMenuBookModalOpen] = useState(false)
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false)
  const [tableModalOpen, setTableModalOpen] = useState(false)
  const [tableQrModalTableId, setTableQrModalTableId] = useState<string | null>(null)
  const [staffModalOpen, setStaffModalOpen] = useState(false)
  const [placementModalOpen, setPlacementModalOpen] = useState(false)
  const [placementCategoryModalOpen, setPlacementCategoryModalOpen] = useState(false)
  const [placementSubcategoryModalOpen, setPlacementSubcategoryModalOpen] = useState(false)

  const [scopedPlacementBookId, setScopedPlacementBookId] = useState('')
  const [scopedPlacementCategoryId, setScopedPlacementCategoryId] = useState('')
  const [scopedPlacementSubcategoryId, setScopedPlacementSubcategoryId] = useState('')

  useEffect(() => {
    if (props.mode !== 'sales' && props.adminReadOnlyMode && !D1_EDITABLE_ADMIN_TABS.includes(activeTab)) {
      setActiveTab('menuBooks')
    }
  }, [activeTab, props.adminReadOnlyMode, props.mode])

  useEffect(() => {
    if (activeTab !== 'placements') return
    setScopedPlacementBookId('')
    setScopedPlacementCategoryId('')
    setScopedPlacementSubcategoryId('')
  }, [activeTab])

  const readOnly = props.roleType !== 'ADMIN'
  const disabled = readOnly || Boolean(props.mutationBusy)
  const filterDisabled = readOnly
  const prototypeLimitedMode = Boolean(props.adminReadOnlyMode)
  const tabEnabled = (tab: AdminTab) => !prototypeLimitedMode || D1_EDITABLE_ADMIN_TABS.includes(tab)

  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const category of props.liveParentCategories) map.set(category.id, category.name)
    for (const category of props.liveCategories) map.set(category.id, category.name)
    return map
  }, [props.liveParentCategories, props.liveCategories])

  const itemCategoryOptions = useMemo(() => {
    return props.liveCategories
      .filter((category) => category.id)
      .map((category) => ({
        id: category.id,
        name: category.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ja'))
  }, [props.liveCategories])

  const tableQrModalTable = useMemo(
    () => props.liveTables.find((table) => table.id === tableQrModalTableId) ?? null,
    [props.liveTables, tableQrModalTableId],
  )

  return (
    <section className="admin-shell">
      {props.roleType !== 'ADMIN' ? <div className="notice error">この画面は ADMIN のみ利用できます。</div> : null}
      {props.adminMessage ? <div className={`notice ${props.messageTone(props.adminMessage)} admin-floating-notice`}>{props.adminMessage}</div> : null}

      <div className="admin-layout">
        <aside className="panel admin-side-panel">
          <div className="admin-side-head">
            <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px'}}>
              <button className="menu-trigger" onClick={props.onOpenLauncher} aria-label="Open Menu" style={{background:'rgba(0,0,0,0.05)', border:'none', color:'var(--text-main)', width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <span className="material-icons">menu</span>
              </button>
              <p className="eyebrow" style={{margin:0}}>ADMIN</p>
            </div>
            <h2>{props.mode === 'sales' ? '売上管理' : 'マスタメンテナンス'}</h2>
          </div>
          <div className="admin-side-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`admin-nav-button admin-nav-button-${tab.id} ${activeTab === tab.id ? 'active' : ''}`}
                disabled={!tabEnabled(tab.id)}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                <strong>{tab.label}</strong>
              </button>
            ))}
          </div>
        </aside>

        <div className="admin-main">
          {activeTab === 'menuBooks' ? (
            <AdminMenuBooksTab
              liveMenuBooks={props.liveMenuBooks}
              disabled={disabled}
              onEditMenuBook={(id) => {
                props.onEditMenuBook(id)
                setMenuBookModalOpen(true)
              }}
              onDeleteMenuBook={props.onDeleteMenuBook}
              onOpenModal={() => {
                props.onCancelMenuBookEdit()
                setMenuBookModalOpen(true)
              }}
            />
          ) : null}

          {activeTab === 'categories' ? (
            <AdminCategoriesTab
              liveParentCategories={props.liveParentCategories}
              disabled={disabled}
              onEditCategory={(id) => {
                props.onEditCategory(id)
                setCategoryModalOpen(true)
              }}
              onDeleteCategory={props.onDeleteCategory}
              onOpenModal={() => {
                props.onCancelCategoryEdit()
                setCategoryModalOpen(true)
              }}
            />
          ) : null}

          {activeTab === 'subcategories' ? (
            <AdminSubcategoriesTab
              liveCategories={props.liveCategories}
              disabled={disabled}
              onEditSubCategory={(id) => {
                props.onEditSubCategory(id)
                setSubcategoryModalOpen(true)
              }}
              onDeleteSubCategory={props.onDeleteSubCategory}
              onOpenModal={() => {
                props.onCancelSubCategoryEdit()
                setSubcategoryModalOpen(true)
              }}
            />
          ) : null}

          {activeTab === 'items' ? (
            <AdminItemsTab
              liveMenuItems={props.liveMenuItems}
              categoryNameMap={categoryNameMap}
              itemCategoryOptions={itemCategoryOptions}
              yen={props.yen}
              disabled={disabled}
              onEditMenuItem={(id) => {
                props.onEditMenuItem(id)
                setItemModalOpen(true)
              }}
              onToggleSoldOut={props.onToggleSoldOut}
              onDeleteMenuItem={props.onDeleteMenuItem}
              onOpenModal={() => {
                props.onCancelMenuItemEdit()
                setItemModalOpen(true)
              }}
            />
          ) : null}

          {activeTab === 'placements' ? (
            <AdminPlacementsTab
              liveMenuBooks={props.liveMenuBooks}
              liveParentCategories={props.liveParentCategories}
              liveCategories={props.liveCategories}
              liveMenuItems={props.liveMenuItems}
              liveBookCategoryRows={props.liveBookCategoryRows}
              liveBookCategorySubcategoryRows={props.liveBookCategorySubcategoryRows}
              livePlacements={props.livePlacements}
              categoryNameMap={categoryNameMap}
              disabled={disabled}
              onEditPlacement={(id) => {
                props.onEditPlacement(id)
                setPlacementModalOpen(true)
              }}
              onDeletePlacement={props.onDeletePlacement}
              onDeleteBookCategory={props.onDeleteBookCategory}
              onDeleteBookCategorySubcategory={props.onDeleteBookCategorySubcategory}
              onSaveBookCategorySort={props.onSaveBookCategorySort}
              onSaveBookCategorySubcategorySort={props.onSaveBookCategorySubcategorySort}
              onSavePlacementSort={props.onSavePlacementSort}
              onOpenPlacementModal={(bookId, categoryId, subcategoryId) => {
                props.onCancelPlacementEdit()
                setScopedPlacementBookId(bookId || '')
                setScopedPlacementCategoryId(categoryId || '')
                setScopedPlacementSubcategoryId(subcategoryId || '')
                if (bookId) props.onPlacementMenuBookChange(bookId)
                if (categoryId) props.onPlacementTopCategoryChange(categoryId)
                if (subcategoryId) props.onPlacementCategoryChange(subcategoryId)
                setPlacementModalOpen(true)
              }}
              onOpenCategoryModal={(bookId) => {
                setScopedPlacementBookId(bookId || '')
                if (bookId) props.onPlacementMenuBookChange(bookId)
                setPlacementCategoryModalOpen(true)
              }}
              onOpenSubcategoryModal={(bookId, categoryId) => {
                setScopedPlacementBookId(bookId || '')
                setScopedPlacementCategoryId(categoryId || '')
                if (bookId) props.onPlacementMenuBookChange(bookId)
                if (categoryId) props.onPlacementTopCategoryChange(categoryId)
                setPlacementSubcategoryModalOpen(true)
              }}
            />
          ) : null}

          {activeTab === 'store' ? (
            <AdminStoreTab
              adminStoreName={props.adminStoreName}
              adminStoreSlug={props.adminStoreSlug}
              adminStoreTimezone={props.adminStoreTimezone}
              adminStoreBusinessOffsetMinutes={props.adminStoreBusinessOffsetMinutes}
              adminStorePaymentTimingMode={props.adminStorePaymentTimingMode}
              adminStoreTicketNoResetMode={props.adminStoreTicketNoResetMode}
              adminStoreTicketNoDigits={props.adminStoreTicketNoDigits}
              disabled={disabled}
              onStoreNameChange={props.onStoreNameChange}
              onStoreSlugChange={props.onStoreSlugChange}
              onStoreTimezoneChange={props.onStoreTimezoneChange}
              onStoreBusinessOffsetMinutesChange={props.onStoreBusinessOffsetMinutesChange}
              onStorePaymentTimingModeChange={props.onStorePaymentTimingModeChange}
              onStoreTicketNoResetModeChange={props.onStoreTicketNoResetModeChange}
              onStoreTicketNoDigitsChange={props.onStoreTicketNoDigitsChange}
              onSaveStoreSettings={props.onSaveStoreSettings}
            />
          ) : null}

          {activeTab === 'tables' ? (
            <AdminTablesTab
              liveTables={props.liveTables}
              disabled={disabled}
              onEditTable={(id) => {
                props.onEditTable(id)
                setTableModalOpen(true)
              }}
              onDeleteTable={props.onDeleteTable}
              onShowQr={setTableQrModalTableId}
              onOpenModal={() => {
                props.onCancelTableEdit()
                setTableModalOpen(true)
              }}
            />
          ) : null}

          {activeTab === 'staff' ? (
            <AdminStaffTab
              liveStaffUsers={props.liveStaffUsers}
              disabled={disabled}
              prototypeLimitedMode={prototypeLimitedMode}
              onEditStaffUser={(id) => {
                props.onEditStaffUser(id)
                setStaffModalOpen(true)
              }}
              onDeleteStaffUser={props.onDeleteStaffUser}
              onOpenModal={() => {
                props.onCancelStaffUserEdit()
                setStaffModalOpen(true)
              }}
            />
          ) : null}

          {activeTab === 'sales' ? (
            <AdminSalesTab
              storeSlug={props.adminStoreSlug}
              disabled={disabled}
              yen={props.yen}
              setAdminMessage={(msg) => msg ? alert(msg) : null}
              setError={(msg) => msg ? alert(msg) : null}
            />
          ) : null}

          {activeTab === 'salesHistory' ? (
            <AdminSalesHistoryTab
              storeSlug={props.adminStoreSlug}
              disabled={disabled}
              yen={props.yen}
              setError={(msg) => msg ? alert(msg) : null}
            />
          ) : null}

          {activeTab === 'paymentHistory' ? (
            <AdminPaymentHistoryTab
              storeSlug={props.adminStoreSlug}
              disabled={disabled}
              yen={props.yen}
              setError={(msg) => msg ? alert(msg) : null}
            />
          ) : null}

          <AdminItemModal
            isOpen={activeTab === 'items' && itemModalOpen}
            editingMenuItemId={props.editingMenuItemId}
            adminItemCategoryId={props.adminItemCategoryId}
            adminItemCode={props.adminItemCode}
            adminItemName={props.adminItemName}
            adminItemPrice={props.adminItemPrice}
            adminItemTaxType={props.adminItemTaxType}
            adminItemImageUrl={props.adminItemImageUrl}
            adminItemSortOrder={props.adminItemSortOrder}
            adminItemIsActive={props.adminItemIsActive}
            adminItemIsSoldOut={props.adminItemIsSoldOut}
            itemImageUploadBusy={props.itemImageUploadBusy}
            disabled={disabled}
            itemCategoryOptions={itemCategoryOptions}
            onClose={() => {
              setItemModalOpen(false)
              props.onCancelMenuItemEdit()
            }}
            onItemCategoryChange={props.onItemCategoryChange}
            onItemCodeChange={props.onItemCodeChange}
            onItemNameChange={props.onItemNameChange}
            onItemPriceChange={props.onItemPriceChange}
            onItemTaxTypeChange={props.onItemTaxTypeChange}
            onItemImageUrlChange={props.onItemImageUrlChange}
            onUploadItemImage={props.onUploadItemImage}
            onClearItemImage={props.onClearItemImage}
            onItemSortOrderChange={props.onItemSortOrderChange}
            onItemIsActiveChange={props.onItemIsActiveChange}
            onItemIsSoldOutChange={props.onItemIsSoldOutChange}
            onCreateMenuItem={props.onCreateMenuItem}
            checkBox={checkBox}
          />

          <AdminMenuBookModal
            isOpen={activeTab === 'menuBooks' && menuBookModalOpen}
            editingMenuBookId={props.editingMenuBookId}
            adminMenuBookCode={props.adminMenuBookCode}
            adminMenuBookName={props.adminMenuBookName}
            adminMenuBookDescription={props.adminMenuBookDescription}
            adminMenuBookSortOrder={props.adminMenuBookSortOrder}
            adminMenuBookAvailableFromTime={props.adminMenuBookAvailableFromTime}
            adminMenuBookAvailableToTime={props.adminMenuBookAvailableToTime}
            adminMenuBookValidFrom={props.adminMenuBookValidFrom}
            adminMenuBookValidTo={props.adminMenuBookValidTo}
            adminMenuBookIsActive={props.adminMenuBookIsActive}
            disabled={disabled}
            onClose={() => {
              setMenuBookModalOpen(false)
              props.onCancelMenuBookEdit()
            }}
            onMenuBookCodeChange={props.onMenuBookCodeChange}
            onMenuBookNameChange={props.onMenuBookNameChange}
            onMenuBookDescriptionChange={props.onMenuBookDescriptionChange}
            onMenuBookSortOrderChange={props.onMenuBookSortOrderChange}
            onMenuBookAvailableFromTimeChange={props.onMenuBookAvailableFromTimeChange}
            onMenuBookAvailableToTimeChange={props.onMenuBookAvailableToTimeChange}
            onMenuBookValidFromChange={props.onMenuBookValidFromChange}
            onMenuBookValidToChange={props.onMenuBookValidToChange}
            onMenuBookIsActiveChange={props.onMenuBookIsActiveChange}
            onCreateMenuBook={props.onCreateMenuBook}
            checkBox={checkBox}
          />

          <AdminCategoryModal
            isOpen={activeTab === 'categories' && categoryModalOpen}
            editingCategoryId={props.editingCategoryId}
            adminCategoryName={props.adminCategoryName}
            adminCategorySortOrder={props.adminCategorySortOrder}
            disabled={disabled}
            onClose={() => {
              setCategoryModalOpen(false)
              props.onCancelCategoryEdit()
            }}
            onCategoryNameChange={props.onCategoryNameChange}
            onCategorySortOrderChange={props.onCategorySortOrderChange}
            onCreateCategory={props.onCreateCategory}
          />

          <AdminSubcategoryModal
            isOpen={activeTab === 'subcategories' && subcategoryModalOpen}
            editingSubCategoryId={props.editingSubCategoryId}
            adminSubCategoryName={props.adminSubCategoryName}
            adminSubCategoryParentCategoryId={props.adminSubCategoryParentCategoryId}
            adminSubCategorySortOrder={props.adminSubCategorySortOrder}
            liveParentCategories={props.liveParentCategories}
            disabled={disabled}
            onClose={() => {
              setSubcategoryModalOpen(false)
              props.onCancelSubCategoryEdit()
            }}
            onSubCategoryNameChange={props.onSubCategoryNameChange}
            onSubCategoryParentCategoryChange={props.onSubCategoryParentCategoryChange}
            onSubCategorySortOrderChange={props.onSubCategorySortOrderChange}
            onCreateSubCategory={props.onCreateSubCategory}
          />

          <AdminTableModal
            isOpen={activeTab === 'tables' && tableModalOpen}
            editingTableId={props.editingTableId}
            adminTableLabel={props.adminTableLabel}
            adminTableQrToken={props.adminTableQrToken}
            adminTableGroupName={props.adminTableGroupName}
            adminTableSortOrder={props.adminTableSortOrder}
            adminTableIsActive={props.adminTableIsActive}
            disabled={disabled}
            onClose={() => {
              setTableModalOpen(false)
              props.onCancelTableEdit()
            }}
            onTableLabelChange={props.onTableLabelChange}
            onTableQrTokenChange={props.onTableQrTokenChange}
            onTableGroupNameChange={props.onTableGroupNameChange}
            onTableSortOrderChange={props.onTableSortOrderChange}
            onTableIsActiveChange={props.onTableIsActiveChange}
            onSaveTableRef={props.onSaveTableRef}
            checkBox={checkBox}
          />

          <AdminStaffModal
            isOpen={activeTab === 'staff' && staffModalOpen}
            editingStaffUserId={props.editingStaffUserId}
            adminStaffEmail={props.adminStaffEmail}
            adminStaffPassword={props.adminStaffPassword}
            adminStaffDisplayName={props.adminStaffDisplayName}
            adminStaffRoleType={props.adminStaffRoleType}
            adminStaffIsActive={props.adminStaffIsActive}
            disabled={disabled}
            onClose={() => {
              setStaffModalOpen(false)
              props.onCancelStaffUserEdit()
            }}
            onStaffEmailChange={props.onStaffEmailChange}
            onStaffPasswordChange={props.onStaffPasswordChange}
            onStaffDisplayNameChange={props.onStaffDisplayNameChange}
            onStaffRoleTypeChange={props.onStaffRoleTypeChange}
            onStaffIsActiveChange={props.onStaffIsActiveChange}
            onSaveStaffUser={props.onSaveStaffUser}
            checkBox={checkBox}
          />

          <AdminPlacementModal
            isOpen={activeTab === 'placements' && placementModalOpen}
            editingPlacementId={props.editingPlacementId}
            scopedPlacementBookId={scopedPlacementBookId}
            scopedPlacementCategoryId={scopedPlacementCategoryId}
            scopedPlacementSubcategoryId={scopedPlacementSubcategoryId}
            adminPlacementMenuBookId={props.adminPlacementMenuBookId}
            adminPlacementTopCategoryId={props.adminPlacementTopCategoryId}
            adminPlacementCategoryId={props.adminPlacementCategoryId}
            adminPlacementItemId={props.adminPlacementItemId}
            adminPlacementDisplayNameOverride={props.adminPlacementDisplayNameOverride}
            adminPlacementDescriptionOverride={props.adminPlacementDescriptionOverride}
            liveMenuBooks={props.liveMenuBooks}
            liveParentCategories={props.liveParentCategories}
            liveCategories={props.liveCategories}
            liveMenuItems={props.liveMenuItems}
            categoryNameMap={categoryNameMap}
            itemCategoryOptions={itemCategoryOptions}
            disabled={disabled}
            filterDisabled={filterDisabled}
            onClose={() => {
              setPlacementModalOpen(false)
              props.onCancelPlacementEdit()
            }}
            onPlacementMenuBookChange={props.onPlacementMenuBookChange}
            onPlacementTopCategoryChange={props.onPlacementTopCategoryChange}
            onPlacementCategoryChange={props.onPlacementCategoryChange}
            onPlacementItemChange={props.onPlacementItemChange}
            onPlacementDisplayNameOverrideChange={props.onPlacementDisplayNameOverrideChange}
            onPlacementDescriptionOverrideChange={props.onPlacementDescriptionOverrideChange}
            onCreatePlacement={props.onCreatePlacement}
          />

          <AdminPlacementCategoryModal
            isOpen={activeTab === 'placements' && placementCategoryModalOpen}
            scopedPlacementBookId={scopedPlacementBookId}
            adminPlacementMenuBookId={props.adminPlacementMenuBookId}
            adminPlacementTopCategoryId={props.adminPlacementTopCategoryId}
            liveMenuBooks={props.liveMenuBooks}
            liveParentCategories={props.liveParentCategories}
            disabled={disabled}
            onClose={() => setPlacementCategoryModalOpen(false)}
            onPlacementMenuBookChange={props.onPlacementMenuBookChange}
            onPlacementTopCategoryChange={props.onPlacementTopCategoryChange}
            onCreateBookCategory={props.onCreateBookCategory}
          />

          <AdminPlacementSubcategoryModal
            isOpen={activeTab === 'placements' && placementSubcategoryModalOpen}
            scopedPlacementBookId={scopedPlacementBookId}
            scopedPlacementCategoryId={scopedPlacementCategoryId}
            adminPlacementMenuBookId={props.adminPlacementMenuBookId}
            adminPlacementTopCategoryId={props.adminPlacementTopCategoryId}
            adminPlacementCategoryId={props.adminPlacementCategoryId}
            liveMenuBooks={props.liveMenuBooks}
            liveParentCategories={props.liveParentCategories}
            liveCategories={props.liveCategories}
            disabled={disabled}
            onClose={() => setPlacementSubcategoryModalOpen(false)}
            onPlacementMenuBookChange={props.onPlacementMenuBookChange}
            onPlacementTopCategoryChange={props.onPlacementTopCategoryChange}
            onPlacementCategoryChange={props.onPlacementCategoryChange}
            onCreateBookCategorySubcategory={props.onCreateBookCategorySubcategory}
          />

          <TableQrModal
            isOpen={Boolean(tableQrModalTable)}
            storeName={props.storeName}
            tableLabel={tableQrModalTable?.label ?? ''}
            qrToken={tableQrModalTable?.qr_token ?? ''}
            customerUrl={tableQrModalTable?.customer_url ?? null}
            onClose={() => setTableQrModalTableId(null)}
          />
        </div>
      </div>
    </section>
  )
}

function TableQrModal({
  isOpen,
  storeName,
  tableLabel,
  qrToken,
  customerUrl,
  onClose,
}: {
  isOpen: boolean
  storeName: string
  tableLabel: string
  qrToken: string
  customerUrl: string | null
  onClose: () => void
}) {
  if (!isOpen) return null
  return (
    <div className="payment-modal-backdrop">
      <section className="panel admin-modal-panel admin-modal-panel-qr">
        <div className="admin-modal-head">
          <div>
            <p className="eyebrow">TABLE QR</p>
            <h2>{tableLabel}</h2>
          </div>
          <button className="secondary-button" type="button" onClick={onClose}>
            閉じる
          </button>
        </div>
        <div className="admin-qr-content">
          <p>{storeName}</p>
          <div className="admin-qr-wrap">
            {/* 実際は QR コードコンポーネントを置く */}
            <div className="admin-qr-placeholder">QR: {qrToken}</div>
          </div>
          {customerUrl ? (
            <div className="admin-qr-url">
              <a href={customerUrl} target="_blank" rel="noreferrer">
                {customerUrl}
              </a>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
