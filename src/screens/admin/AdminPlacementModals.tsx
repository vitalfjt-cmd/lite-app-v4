
import { useMemo, useState } from 'react'
import { AdminMenuBook, AdminCategory, AdminMenuItem } from './types'

type Props = {
  isOpen: boolean
  editingPlacementId: string | null
  scopedPlacementBookId: string
  scopedPlacementCategoryId: string
  scopedPlacementSubcategoryId: string
  adminPlacementMenuBookId: string
  adminPlacementTopCategoryId: string
  adminPlacementCategoryId: string
  adminPlacementItemId: string
  adminPlacementDisplayNameOverride: string
  adminPlacementDescriptionOverride: string
  liveMenuBooks: AdminMenuBook[]
  liveParentCategories: AdminCategory[]
  liveCategories: AdminCategory[]
  liveMenuItems: AdminMenuItem[]
  categoryNameMap: Map<string, string>
  itemCategoryOptions: { id: string; name: string }[]
  disabled: boolean
  filterDisabled: boolean
  onClose: () => void
  onPlacementMenuBookChange: (value: string) => void
  onPlacementTopCategoryChange: (value: string) => void
  onPlacementCategoryChange: (value: string) => void
  onPlacementItemChange: (value: string) => void
  onPlacementDisplayNameOverrideChange: (value: string) => void
  onPlacementDescriptionOverrideChange: (value: string) => void
  onCreatePlacement: () => Promise<boolean>
}

export function AdminPlacementModal(props: Props) {
  const [placementItemSearch, setPlacementItemSearch] = useState('')
  const [placementItemCategoryFilter, setPlacementItemCategoryFilter] = useState('')

  if (!props.isOpen) return null

  const filteredPlacementItems = props.liveMenuItems
    .filter((item) => item.is_active)
    .filter((item) => (placementItemCategoryFilter ? item.category_id === placementItemCategoryFilter : true))
    .filter((item) => {
      const keyword = placementItemSearch.trim().toLowerCase()
      if (!keyword) return true
      const categoryName = props.categoryNameMap.get(item.category_id) ?? ''
      return (
        item.name.toLowerCase().includes(keyword) ||
        (item.code ?? '').toLowerCase().includes(keyword) ||
        categoryName.toLowerCase().includes(keyword)
      )
    })
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'ja'))

  const currentPlacementBookName = props.liveMenuBooks.find((book) => book.id === props.adminPlacementMenuBookId)?.name ?? '-'
  const currentPlacementTopCategoryName = props.liveParentCategories.find((category) => category.id === props.adminPlacementTopCategoryId)?.name ?? '-'
  const currentPlacementSubcategoryName = props.liveCategories.find((category) => category.id === props.adminPlacementCategoryId)?.name ?? '-'

  return (
    <div className="payment-modal-backdrop">
      <section className="panel admin-modal-panel">
        <div className="admin-modal-head admin-modal-head-placements">
          <div>
            <p className="eyebrow">PLACEMENT</p>
            <h2>{props.editingPlacementId ? '掲載設定編集' : '掲載設定登録'}</h2>
          </div>
          <button className="secondary-button" type="button" onClick={props.onClose}>閉じる</button>
        </div>
        <div className="form-stack">
          {props.scopedPlacementBookId ? (
            <label>メニューブック<div className="admin-readonly-field">{currentPlacementBookName}</div></label>
          ) : (
            <label>
              メニューブック
              <select value={props.adminPlacementMenuBookId} onChange={(event) => props.onPlacementMenuBookChange(event.target.value)} disabled={props.disabled}>
                <option value="">選択してください</option>
                {props.liveMenuBooks.map((book) => <option key={book.id} value={book.id}>{book.name}</option>)}
              </select>
            </label>
          )}
          {props.scopedPlacementCategoryId ? (
            <label>親カテゴリ<div className="admin-readonly-field">{currentPlacementTopCategoryName}</div></label>
          ) : (
            <label>
              親カテゴリ
              <select value={props.adminPlacementTopCategoryId} onChange={(event) => props.onPlacementTopCategoryChange(event.target.value)} disabled={props.disabled}>
                <option value="">選択してください</option>
                {props.liveParentCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
          )}
          {props.scopedPlacementSubcategoryId ? (
            <label>サブカテゴリ<div className="admin-readonly-field">{currentPlacementSubcategoryName}</div></label>
          ) : (
            <label>
              サブカテゴリ
              <select value={props.adminPlacementCategoryId} onChange={(event) => props.onPlacementCategoryChange(event.target.value)} disabled={props.disabled}>
                <option value="">選択してください</option>
                {props.liveCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
          )}
          <label>
            検索グループ
            <select
              value={placementItemCategoryFilter}
              onChange={(event) => setPlacementItemCategoryFilter(event.target.value)}
              disabled={props.filterDisabled}
            >
              <option value="">すべて表示</option>
              {props.itemCategoryOptions.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label>
            検索
            <input value={placementItemSearch} onChange={(event) => setPlacementItemSearch(event.target.value)} placeholder="メニュー名・コードで検索" />
          </label>
          <label>
            メニュー
            <select value={props.adminPlacementItemId} onChange={(event) => props.onPlacementItemChange(event.target.value)} disabled={props.disabled}>
              <option value="">選択してください</option>
              {filteredPlacementItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code ? `${item.code} / ` : ''}{item.name}
                </option>
              ))}
            </select>
          </label>
          <label>表示名上書き<input value={props.adminPlacementDisplayNameOverride} onChange={(event) => props.onPlacementDisplayNameOverrideChange(event.target.value)} disabled={props.disabled} /></label>
          <label>説明文<input value={props.adminPlacementDescriptionOverride} onChange={(event) => props.onPlacementDescriptionOverrideChange(event.target.value)} disabled={props.disabled} /></label>
          <div className="button-row">
            <button className="primary-button" type="button" onClick={async () => {
              if (await props.onCreatePlacement()) props.onClose()
            }} disabled={props.disabled}>{props.editingPlacementId ? '保存' : '追加'}</button>
            <button className="secondary-button" type="button" onClick={props.onClose}>キャンセル</button>
          </div>
        </div>
      </section>
    </div>
  )
}

export function AdminPlacementCategoryModal(props: {
  isOpen: boolean
  scopedPlacementBookId: string
  adminPlacementMenuBookId: string
  adminPlacementTopCategoryId: string
  liveMenuBooks: AdminMenuBook[]
  liveParentCategories: AdminCategory[]
  disabled: boolean
  onClose: () => void
  onPlacementMenuBookChange: (value: string) => void
  onPlacementTopCategoryChange: (value: string) => void
  onCreateBookCategory: () => Promise<boolean>
}) {
  if (!props.isOpen) return null
  const currentPlacementBookName = props.liveMenuBooks.find((book) => book.id === props.adminPlacementMenuBookId)?.name ?? '-'

  return (
    <div className="payment-modal-backdrop">
      <section className="panel admin-modal-panel">
        <div className="admin-modal-head admin-modal-head-placements">
          <div>
            <p className="eyebrow">PLACEMENT</p>
            <h2>カテゴリ追加</h2>
          </div>
          <button className="secondary-button" type="button" onClick={props.onClose}>閉じる</button>
        </div>
        <div className="form-stack">
          {props.scopedPlacementBookId ? (
            <label>メニューブック<div className="admin-readonly-field">{currentPlacementBookName}</div></label>
          ) : (
            <label>
              メニューブック
              <select value={props.adminPlacementMenuBookId} onChange={(event) => props.onPlacementMenuBookChange(event.target.value)} disabled={props.disabled}>
                <option value="">選択してください</option>
                {props.liveMenuBooks.map((book) => <option key={book.id} value={book.id}>{book.name}</option>)}
              </select>
            </label>
          )}
          <label>
            親カテゴリ
            <select value={props.adminPlacementTopCategoryId} onChange={(event) => props.onPlacementTopCategoryChange(event.target.value)} disabled={props.disabled}>
              <option value="">選択してください</option>
              {props.liveParentCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <div className="button-row">
            <button className="primary-button" onClick={async () => {
              if (await props.onCreateBookCategory()) props.onClose()
            }} disabled={props.disabled}>追加</button>
            <button className="secondary-button" onClick={props.onClose}>キャンセル</button>
          </div>
        </div>
      </section>
    </div>
  )
}

export function AdminPlacementSubcategoryModal(props: {
  isOpen: boolean
  scopedPlacementBookId: string
  scopedPlacementCategoryId: string
  adminPlacementMenuBookId: string
  adminPlacementTopCategoryId: string
  adminPlacementCategoryId: string
  liveMenuBooks: AdminMenuBook[]
  liveParentCategories: AdminCategory[]
  liveCategories: AdminCategory[]
  disabled: boolean
  onClose: () => void
  onPlacementMenuBookChange: (value: string) => void
  onPlacementTopCategoryChange: (value: string) => void
  onPlacementCategoryChange: (value: string) => void
  onCreateBookCategorySubcategory: () => Promise<boolean>
}) {
  if (!props.isOpen) return null
  const currentPlacementBookName = props.liveMenuBooks.find((book) => book.id === props.adminPlacementMenuBookId)?.name ?? '-'
  const currentPlacementTopCategoryName = props.liveParentCategories.find((category) => category.id === props.adminPlacementTopCategoryId)?.name ?? '-'

  return (
    <div className="payment-modal-backdrop">
      <section className="panel admin-modal-panel">
        <div className="admin-modal-head admin-modal-head-placements">
          <div>
            <p className="eyebrow">PLACEMENT</p>
            <h2>サブカテゴリ追加</h2>
          </div>
          <button className="secondary-button" type="button" onClick={props.onClose}>閉じる</button>
        </div>
        <div className="form-stack">
          {props.scopedPlacementBookId ? (
            <label>メニューブック<div className="admin-readonly-field">{currentPlacementBookName}</div></label>
          ) : (
            <label>
              メニューブック
              <select value={props.adminPlacementMenuBookId} onChange={(event) => props.onPlacementMenuBookChange(event.target.value)} disabled={props.disabled}>
                <option value="">選択してください</option>
                {props.liveMenuBooks.map((book) => <option key={book.id} value={book.id}>{book.name}</option>)}
              </select>
            </label>
          )}
          {props.scopedPlacementCategoryId ? (
            <label>親カテゴリ<div className="admin-readonly-field">{currentPlacementTopCategoryName}</div></label>
          ) : (
            <label>
              親カテゴリ
              <select value={props.adminPlacementTopCategoryId} onChange={(event) => props.onPlacementTopCategoryChange(event.target.value)} disabled={props.disabled}>
                <option value="">選択してください</option>
                {props.liveParentCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
          )}
          <label>
            サブカテゴリ
            <select value={props.adminPlacementCategoryId} onChange={(event) => props.onPlacementCategoryChange(event.target.value)} disabled={props.disabled}>
              <option value="">選択してください</option>
              {props.liveCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <div className="button-row">
            <button className="primary-button" onClick={async () => {
              if (await props.onCreateBookCategorySubcategory()) props.onClose()
            }} disabled={props.disabled}>追加</button>
            <button className="secondary-button" onClick={props.onClose}>キャンセル</button>
          </div>
        </div>
      </section>
    </div>
  )
}
