
import { useMemo, useState } from 'react'
import { AdminCategory } from './types'

type Props = {
  liveCategories: AdminCategory[]
  disabled: boolean
  onEditSubCategory: (id: string) => void
  onDeleteSubCategory: (id: string) => void
  onOpenModal: () => void
}

export function AdminSubcategoriesTab(props: Props) {
  const [subcategorySearchDraft, setSubcategorySearchDraft] = useState('')
  const [subcategorySearch, setSubcategorySearch] = useState('')

  const filteredSubcategories = useMemo(() => {
    const search = subcategorySearch.trim().toLowerCase()
    return props.liveCategories
      .filter((category) => !search || category.name.toLowerCase().includes(search))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, 'ja'))
  }, [subcategorySearch, props.liveCategories])

  return (
    <div className="ops-grid">
      <section className="panel admin-list-panel admin-list-panel-wide admin-section-subcategories">
        <div className="admin-list-head">
          <div>
            <p className="eyebrow">SUBCATEGORY</p>
            <h2>サブカテゴリ一覧</h2>
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
            <input value={subcategorySearchDraft} onChange={(event) => setSubcategorySearchDraft(event.target.value)} placeholder="サブカテゴリ名で検索" />
          </label>
          <div className="admin-filter-actions">
            <button className="primary-button" type="button" onClick={() => setSubcategorySearch(subcategorySearchDraft)}>検索</button>
            <button className="secondary-button" type="button" onClick={() => {
              setSubcategorySearchDraft('')
              setSubcategorySearch('')
            }}>クリア</button>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>サブカテゴリ名</th>
                <th>表示順</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubcategories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.sort_order ?? 0}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button className="secondary-button" onClick={() => {
                        props.onEditSubCategory(category.id)
                      }}>編集</button>
                      <button className="danger-button" onClick={() => props.onDeleteSubCategory(category.id)} disabled={props.disabled}>削除</button>
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
