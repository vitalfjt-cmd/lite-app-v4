import React from 'react'
import { AdminMenuItem } from './types'

type Props = {
  isOpen: boolean
  editingMenuItemId: string | null
  adminItemCategoryId: string
  adminItemCode: string
  adminItemName: string
  adminItemPrice: string
  adminItemTaxType: 'INCLUDED' | 'EXCLUDED' | 'NONE'
  adminItemImageUrl: string
  adminItemSortOrder: string
  adminItemIsActive: boolean
  adminItemIsSoldOut: boolean
  itemImageUploadBusy: boolean
  disabled: boolean
  itemCategoryOptions: { id: string; name: string }[]
  onClose: () => void
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
  checkBox: (checked: boolean, onChange: (next: boolean) => void, disabled?: boolean) => React.ReactNode
}

export function AdminItemModal(props: Props) {
  if (!props.isOpen) return null

  const { disabled } = props

  return (
    <div className="payment-modal-backdrop">
      <section className="panel admin-modal-panel">
        <div className="admin-modal-head admin-modal-head-items">
          <div>
            <p className="eyebrow">MENU ITEM</p>
            <h2>{props.editingMenuItemId ? 'メニュー編集' : 'メニュー登録'}</h2>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={props.onClose}
          >
            閉じる
          </button>
        </div>
        <div className="form-stack">
          <label>
            検索グループ
            <select value={props.adminItemCategoryId} onChange={(event) => props.onItemCategoryChange(event.target.value)} disabled={disabled}>
              <option value="">選択してください</option>
              {props.itemCategoryOptions.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label>メニューコード<input value={props.adminItemCode} onChange={(event) => props.onItemCodeChange(event.target.value)} disabled={disabled} /></label>
          <label>メニュー名<input value={props.adminItemName} onChange={(event) => props.onItemNameChange(event.target.value)} disabled={disabled} /></label>
          <label>価格<input type="number" value={props.adminItemPrice} onChange={(event) => props.onItemPriceChange(event.target.value)} disabled={disabled} /></label>
          <label>
            税区分
            <select value={props.adminItemTaxType} onChange={(event) => props.onItemTaxTypeChange(event.target.value as 'INCLUDED' | 'EXCLUDED' | 'NONE')} disabled={disabled}>
              <option value="INCLUDED">税込</option>
              <option value="EXCLUDED">税抜</option>
              <option value="NONE">なし</option>
            </select>
          </label>
          <label>
            画像アップロード
            <div className="inline-upload-row">
              <input
                type="file"
                accept="image/*"
                disabled={disabled || props.itemImageUploadBusy}
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  await props.onUploadItemImage(file)
                  event.target.value = ''
                }}
              />
            </div>
            <small className="field-help">長辺 1600px を上限に自動で縮小します。GIF は元画像のままです。</small>
          </label>
          <label>画像URL<input value={props.adminItemImageUrl} onChange={(event) => props.onItemImageUrlChange(event.target.value)} disabled={disabled || props.itemImageUploadBusy} /></label>
          {props.adminItemImageUrl ? (
            <div className="admin-image-preview">
              <span>プレビュー</span>
              <img src={props.adminItemImageUrl} alt="メニュー画像プレビュー" />
              <div className="button-row compact">
                <button className="secondary-button" type="button" onClick={props.onClearItemImage} disabled={disabled || props.itemImageUploadBusy}>
                  画像を外す
                </button>
              </div>
            </div>
          ) : null}
          <label>表示順<input type="number" value={props.adminItemSortOrder} onChange={(event) => props.onItemSortOrderChange(event.target.value)} disabled={disabled} /></label>
          <label>有効{props.checkBox(props.adminItemIsActive, props.onItemIsActiveChange, disabled)}</label>
          <label>売切{props.checkBox(props.adminItemIsSoldOut, props.onItemIsSoldOutChange, disabled)}</label>
          <div className="button-row">
            <button
              className="primary-button"
              type="button"
              onClick={async () => {
                const saved = await props.onCreateMenuItem()
                if (saved) {
                  props.onClose()
                }
              }}
              disabled={disabled}
            >
              {props.editingMenuItemId ? '保存' : '追加'}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={props.onClose}
            >
              キャンセル
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
