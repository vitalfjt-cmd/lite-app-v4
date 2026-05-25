
import { useMemo, useState } from 'react'
import { AdminCategory } from './types'

type Props = {
  liveParentCategories: AdminCategory[]
  disabled: boolean
  onEditCategory: (id: string) => void
  onDeleteCategory: (id: string) => void
  onOpenModal: () => void
}

export function AdminCategoriesTab(props: Props) {
  const [categorySearchDraft, setCategorySearchDraft] = useState('')
  const [categorySearch, setCategorySearch] = useState('')

  const filteredCategories = useMemo(() => {
    const search = categorySearch.trim().toLowerCase()
    return props.liveParentCategories
      .filter((category) => !search || category.name.toLowerCase().includes(search))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, 'ja'))
  }, [categorySearch, props.liveParentCategories])

  return (
    <div className="ops-grid">
      <section className="panel admin-list-panel admin-list-panel-wide admin-section-categories">
        <div className="admin-list-head">
          <div>
            <p className="eyebrow">CATEGORY</p>
            <h2>カテゴリ一覧</h2>
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
            <input value={categorySearchDraft} onChange={(event) => setCategorySearchDraft(event.target.value)} placeholder="カテゴリ名で検索" />
          </label>
          <div className="admin-filter-actions">
            <button className="primary-button" type="button" onClick={() => setCategorySearch(categorySearchDraft)}>検索</button>
            <button className="secondary-button" type="button" onClick={() => {
              setCategorySearchDraft('')
              setCategorySearch('')
            }}>クリア</button>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>カテゴリ名</th>
                <th>表示順</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.sort_order ?? 0}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button className="secondary-button" onClick={() => {
                        props.onEditCategory(category.id)
                      }}>編集</button>
                      <button className="danger-button" onClick={() => props.onDeleteCategory(category.id)} disabled={props.disabled}>削除</button>
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
