
import { useMemo, useState } from 'react'
import { AdminMenuBook } from './types'

type Props = {
  liveMenuBooks: AdminMenuBook[]
  disabled: boolean
  onEditMenuBook: (id: string) => void
  onDeleteMenuBook: (id: string) => void
  onOpenModal: () => void
}

export function AdminMenuBooksTab(props: Props) {
  const [menuBookSearchDraft, setMenuBookSearchDraft] = useState('')
  const [menuBookSortKeyDraft, setMenuBookSortKeyDraft] = useState<'sort_order' | 'name' | 'code'>('sort_order')
  const [menuBookSortDirectionDraft, setMenuBookSortDirectionDraft] = useState<'asc' | 'desc'>('asc')
  
  const [menuBookSearch, setMenuBookSearch] = useState('')
  const [menuBookSortKey, setMenuBookSortKey] = useState<'sort_order' | 'name' | 'code'>('sort_order')
  const [menuBookSortDirection, setMenuBookSortDirection] = useState<'asc' | 'desc'>('asc')

  const filteredMenuBooks = useMemo(() => {
    const search = menuBookSearch.trim().toLowerCase()
    const rows = props.liveMenuBooks.filter((book) => {
      if (!search) return true
      return [book.name, book.code ?? '', book.description ?? ''].some((value) => value.toLowerCase().includes(search))
    })
    rows.sort((a, b) => {
      const dir = menuBookSortDirection === 'asc' ? 1 : -1
      if (menuBookSortKey === 'name') return a.name.localeCompare(b.name, 'ja') * dir
      if (menuBookSortKey === 'code') return (a.code ?? '').localeCompare(b.code ?? '', 'ja') * dir
      return ((a.sort_order ?? 0) - (b.sort_order ?? 0)) * dir
    })
    return rows
  }, [menuBookSearch, menuBookSortDirection, menuBookSortKey, props.liveMenuBooks])

  return (
    <div className="ops-grid">
      <section className="panel admin-list-panel admin-list-panel-wide admin-section-menuBooks">
        <div className="admin-list-head">
          <div>
            <p className="eyebrow">MENU BOOK</p>
            <h2>メニューブック一覧</h2>
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
        <div className="admin-filter-bar compact">
          <label className="admin-filter-field wide">
            <span>検索</span>
            <input value={menuBookSearchDraft} onChange={(event) => setMenuBookSearchDraft(event.target.value)} placeholder="名称・コード・説明で検索" />
          </label>
          <label className="admin-filter-field">
            <span>並び替え</span>
            <select value={menuBookSortKeyDraft} onChange={(event) => setMenuBookSortKeyDraft(event.target.value as 'sort_order' | 'name' | 'code')}>
              <option value="sort_order">表示順</option>
              <option value="name">名称</option>
              <option value="code">コード</option>
            </select>
          </label>
          <label className="admin-filter-field">
            <span>順序</span>
            <select value={menuBookSortDirectionDraft} onChange={(event) => setMenuBookSortDirectionDraft(event.target.value as 'asc' | 'desc')}>
              <option value="asc">昇順</option>
              <option value="desc">降順</option>
            </select>
          </label>
          <div className="admin-filter-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                setMenuBookSearch(menuBookSearchDraft)
                setMenuBookSortKey(menuBookSortKeyDraft)
                setMenuBookSortDirection(menuBookSortDirectionDraft)
              }}
            >
              検索
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setMenuBookSearchDraft('')
                setMenuBookSortKeyDraft('sort_order')
                setMenuBookSortDirectionDraft('asc')
                setMenuBookSearch('')
                setMenuBookSortKey('sort_order')
                setMenuBookSortDirection('asc')
              }}
            >
              クリア
            </button>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>コード</th>
                <th>表示順</th>
                <th>公開</th>
                <th>時間帯</th>
                <th>期間</th>
                <th>制限時間</th>
                <th>ラストオーダー</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredMenuBooks.map((book) => (
                <tr key={book.id}>
                  <td>{book.name}</td>
                  <td>{book.code || '未設定'}</td>
                  <td>{book.sort_order}</td>
                  <td>{book.is_active ? '有効' : '無効'}</td>
                  <td>{book.available_from_time || '-'} - {book.available_to_time || '-'}</td>
                  <td>{book.valid_from || '-'} - {book.valid_to || '-'}</td>
                  <td>{book.time_limit_minutes != null ? `${book.time_limit_minutes}分` : '無制限'}</td>
                  <td>{book.last_order_offset_minutes != null ? `終了${book.last_order_offset_minutes}分前` : 'なし'}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        className="secondary-button"
                        onClick={() => {
                          props.onEditMenuBook(book.id)
                        }}
                      >
                        編集
                      </button>
                      <button className="danger-button" onClick={() => props.onDeleteMenuBook(book.id)} disabled={props.disabled}>削除</button>
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
