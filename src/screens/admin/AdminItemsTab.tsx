
import { useMemo, useState } from 'react'
import { AdminMenuItem, AdminLogicalPrinter } from './types'

type Props = {
  liveMenuItems: AdminMenuItem[]
  categoryNameMap: Map<string, string>
  itemCategoryOptions: { id: string; name: string }[]
  logicalPrinters: AdminLogicalPrinter[]
  yen: (value: number) => string
  adminStoreTaxRate?: string | number
  adminStoreReducedTaxRate?: string | number
  disabled: boolean
  onEditMenuItem: (id: string) => void
  onToggleSoldOut: (itemId: string, nextValue: boolean) => void
  onDeleteMenuItem: (id: string) => void
  onOpenModal: () => void
}

export function AdminItemsTab(props: Props) {
  const [itemSearchDraft, setItemSearchDraft] = useState('')
  const [itemCategoryFilterDraft, setItemCategoryFilterDraft] = useState('')
  const [itemSortKeyDraft, setItemSortKeyDraft] = useState<'sort_order' | 'name' | 'price' | 'code'>('code')
  const [itemSortDirectionDraft, setItemSortDirectionDraft] = useState<'asc' | 'desc'>('asc')
  
  const [itemSearch, setItemSearch] = useState('')
  const [itemCategoryFilter, setItemCategoryFilter] = useState('')
  const [itemSortKey, setItemSortKey] = useState<'sort_order' | 'name' | 'price' | 'code'>('code')
  const [itemSortDirection, setItemSortDirection] = useState<'asc' | 'desc'>('asc')

  const filteredMenuItems = useMemo(() => {
    const search = itemSearch.trim().toLowerCase()
    const rows = props.liveMenuItems.filter((item) => {
      if (itemCategoryFilter && item.category_id !== itemCategoryFilter) return false
      if (!search) return true
      const categoryName = props.categoryNameMap.get(item.category_id) ?? ''
      return [item.name, item.code ?? '', categoryName].some((value) => value.toLowerCase().includes(search))
    })
    rows.sort((a, b) => {
      const dir = itemSortDirection === 'asc' ? 1 : -1
      if (itemSortKey === 'code') {
        const codeA = a.code?.trim() || ''
        const codeB = b.code?.trim() || ''
        if (codeA === '' && codeB !== '') return 1
        if (codeB === '' && codeA !== '') return -1
        if (codeA === '' && codeB === '') return ((a.sort_order ?? 0) - (b.sort_order ?? 0)) * dir
        return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' }) * dir
      }
      if (itemSortKey === 'name') return a.name.localeCompare(b.name, 'ja') * dir
      if (itemSortKey === 'price') return (a.price - b.price) * dir
      return ((a.sort_order ?? 0) - (b.sort_order ?? 0)) * dir
    })
    return rows
  }, [props.categoryNameMap, itemCategoryFilter, itemSearch, itemSortDirection, itemSortKey, props.liveMenuItems])

  return (
    <div className="ops-grid">
      <section className="panel admin-list-panel admin-list-panel-wide admin-section-items">
        <div className="admin-list-head">
          <div>
<h2>メニュー一覧</h2>
          </div>
          <div className="admin-list-actions">
            <button
              className="primary-button"
              type="button"
              disabled={props.disabled}
              onClick={props.onOpenModal}
            >
              新規追加
            </button>
          </div>
        </div>
        <div className="admin-filter-bar admin-filter-bar-items">
          <label className="admin-filter-field wide">
            <span>検索</span>
            <input value={itemSearchDraft} onChange={(event) => setItemSearchDraft(event.target.value)} placeholder="メニュー名・コード・カテゴリで検索" />
          </label>
          <label className="admin-filter-field">
            <span>カテゴリ</span>
            <select value={itemCategoryFilterDraft} onChange={(event) => setItemCategoryFilterDraft(event.target.value)}>
              <option value="">すべて表示</option>
              {props.itemCategoryOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </label>
          <label className="admin-filter-field">
            <span>並び替え</span>
            <select value={itemSortKeyDraft} onChange={(event) => setItemSortKeyDraft(event.target.value as 'sort_order' | 'name' | 'price' | 'code')}>
              <option value="code">メニューコード</option>
              <option value="sort_order">表示順</option>
              <option value="name">メニュー名</option>
              <option value="price">価格</option>
            </select>
          </label>
          <label className="admin-filter-field">
            <span>順序</span>
            <select value={itemSortDirectionDraft} onChange={(event) => setItemSortDirectionDraft(event.target.value as 'asc' | 'desc')}>
              <option value="asc">昇順</option>
              <option value="desc">降順</option>
            </select>
          </label>
          <div className="admin-filter-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                setItemSearch(itemSearchDraft)
                setItemCategoryFilter(itemCategoryFilterDraft)
                setItemSortKey(itemSortKeyDraft)
                setItemSortDirection(itemSortDirectionDraft)
              }}
            >
              検索
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setItemSearchDraft('')
                setItemCategoryFilterDraft('')
                setItemSortKeyDraft('code')
                setItemSortDirectionDraft('asc')
                setItemSearch('')
                setItemCategoryFilter('')
                setItemSortKey('code')
                setItemSortDirection('asc')
              }}
            >
              クリア
            </button>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table admin-table-menu-items">
            <colgroup>
              <col className="col-menu-thumb" />
              <col className="col-menu-name" />
              <col className="col-menu-code" />
              <col className="col-menu-category" />
              <col className="col-menu-price" />
              <col className="col-menu-tax" />
              <col className="col-menu-sort" />
              <col className="col-menu-kp" />
              <col className="col-menu-status" />
              <col className="col-menu-actions" />
            </colgroup>
            <thead>
              <tr>
                <th>画像</th>
                <th>メニュー名</th>
                <th>コード</th>
                <th>カテゴリ</th>
                <th>価格</th>
                <th>税区分</th>
                <th>表示順</th>
                <th>出力先</th>
                <th>状態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredMenuItems.map((item) => (
                <tr key={item.id}>
                  <td className="admin-cell-thumb">
                    {item.image_url ? (
                      <img className="admin-item-thumb" src={item.image_url} alt={item.name} />
                    ) : (
                      <div className="admin-item-thumb admin-item-thumb-placeholder" aria-hidden="true">
                        {item.name.slice(0, 1)}
                      </div>
                    )}
                  </td>
                  <td className="admin-cell-name">{item.name}</td>
                  <td className="admin-cell-code">{item.code || '未設定'}</td>
                  <td className="admin-cell-category">{props.categoryNameMap.get(item.category_id) ?? `未設定 (${item.category_id.slice(0, 8)})`}</td>
                  <td className="admin-cell-price">{props.yen(item.price)}</td>
                  <td className="admin-cell-tax">
                    {item.tax_type || 'INCLUDED'}
                    {item.tax_rate_type === 'REDUCED'
                      ? ` (${props.adminStoreReducedTaxRate || '8'}%)`
                      : item.tax_rate_type === 'NONE'
                      ? ' (0%)'
                      : ` (${props.adminStoreTaxRate || '10'}%)`}
                  </td>
                  <td className="admin-cell-sort">{item.sort_order}</td>
                  <td className="admin-cell-kp">
                    {(() => {
                      const itemLpIds = item.logical_printer_ids || []
                      const codes = itemLpIds
                        .map((id) => props.logicalPrinters.find((lp) => lp.id === id)?.code)
                        .filter(Boolean) as string[]
                      
                      return codes.join(',') || '未設定'
                    })()}
                  </td>
                  <td className="admin-cell-status">{item.is_active ? (item.is_sold_out ? '売切' : '有効') : '無効'}</td>
                  <td className="admin-cell-actions">
                    <div className="admin-table-actions">
                      <button
                        className="secondary-button"
                        onClick={() => {
                          props.onEditMenuItem(item.id)
                        }}
                      >
                        編集
                      </button>
                      <button className="secondary-button" onClick={() => props.onToggleSoldOut(item.id, !item.is_sold_out)} disabled={props.disabled}>
                        {item.is_sold_out ? '売切解除' : '売切'}
                      </button>
                      <button className="danger-button" onClick={() => props.onDeleteMenuItem(item.id)} disabled={props.disabled}>削除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
