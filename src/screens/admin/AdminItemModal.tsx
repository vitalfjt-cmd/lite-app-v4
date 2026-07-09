import React from 'react'
import { AdminMenuItem } from './types'

type Props = {
  isOpen: boolean
  editingMenuItemId: string | null
  adminItemCategoryId: string
  adminItemCode: string
  adminItemName: string
  adminItemNameEn: string
  adminItemPrice: string
  adminItemTaxType: 'INCLUDED' | 'EXCLUDED' | 'NONE'
  adminItemImageUrl: string
  adminItemSortOrder: string
  adminItemIsActive: boolean
  adminItemIsSoldOut: boolean
  adminItemToppingIds: string[]
  itemImageUploadBusy: boolean
  disabled: boolean
  itemCategoryOptions: { id: string; name: string }[]
  allMenuItems: AdminMenuItem[]
  onClose: () => void
  onItemCategoryChange: (value: string) => void
  onItemCodeChange: (value: string) => void
  onItemNameChange: (value: string) => void
  onItemNameEnChange: (value: string) => void
  onItemPriceChange: (value: string) => void
  onItemTaxTypeChange: (value: 'INCLUDED' | 'EXCLUDED' | 'NONE') => void
  onItemImageUrlChange: (value: string) => void
  onUploadItemImage: (file: File) => Promise<void>
  onClearItemImage: () => void
  onItemSortOrderChange: (value: string) => void
  onItemIsActiveChange: (value: boolean) => void
  onItemIsSoldOutChange: (value: boolean) => void
  onItemToppingIdsChange: (value: string[]) => void
  onCreateMenuItem: () => Promise<boolean>
  checkBox: (checked: boolean, onChange: (next: boolean) => void, disabled?: boolean) => React.ReactNode
}

export function AdminItemModal(props: Props) {
  if (!props.isOpen) return null

  const { disabled } = props

  const [filterCategoryId, setFilterCategoryId] = React.useState<string>('')
  const [filterKeyword, setFilterKeyword] = React.useState<string>('')

  const filteredItems = React.useMemo(() => {
    return props.allMenuItems.filter(item => {
      if (item.id === props.editingMenuItemId) return false
      if (!item.is_active) return false
      if (filterCategoryId && item.category_id !== filterCategoryId) return false
      if (filterKeyword) {
        const keyword = filterKeyword.toLowerCase()
        const matchName = item.name.toLowerCase().includes(keyword)
        const matchCode = item.code ? item.code.toLowerCase().includes(keyword) : false
        if (!matchName && !matchCode) return false
      }
      return true
    })
  }, [props.allMenuItems, props.editingMenuItemId, filterCategoryId, filterKeyword])

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
          <label>英語表記<input value={props.adminItemNameEn} onChange={(event) => props.onItemNameEnChange(event.target.value)} disabled={disabled} /></label>
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
          <div className="admin-topping-select-section" style={{ marginTop: '16px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
            <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>トッピング・オプション設定</span>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <select
                value={filterCategoryId}
                onChange={(e) => setFilterCategoryId(e.target.value)}
                style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #ccc', background: 'white' }}
                disabled={disabled}
              >
                <option value="">すべてのグループ</option>
                {props.itemCategoryOptions.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="商品名・コードで検索..."
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #ccc', background: 'white' }}
                disabled={disabled}
              />
            </div>
            <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '8px', padding: '12px', background: '#f9f9f9' }}>
              {filteredItems.map(item => {
                const isChecked = props.adminItemToppingIds.includes(item.id)
                return (
                  <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', color: '#333' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          props.onItemToppingIdsChange([...props.adminItemToppingIds, item.id])
                        } else {
                          props.onItemToppingIdsChange(props.adminItemToppingIds.filter(id => id !== item.id))
                        }
                      }}
                      disabled={disabled}
                    />
                    <div>
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                      {item.code && <span style={{ fontSize: '0.8em', color: '#888', marginLeft: '6px' }}>[{item.code}]</span>}
                      <span style={{ fontSize: '0.85em', color: '#666', marginLeft: '8px' }}>(¥{item.price})</span>
                    </div>
                  </label>
                )
              })}
              {filteredItems.length === 0 && (
                <div style={{ color: '#999', fontSize: '0.9em', textAlign: 'center', padding: '12px 0' }}>該当する商品が見つかりません。</div>
              )}
            </div>
          </div>
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
