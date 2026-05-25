
import { useMemo, useState } from 'react'
import { AdminBookCategoryRow, AdminBookCategorySubcategoryRow, AdminPlacementRow, AdminMenuBook, AdminCategory, AdminMenuItem } from './types'

type Props = {
  liveMenuBooks: AdminMenuBook[]
  liveParentCategories: AdminCategory[]
  liveCategories: AdminCategory[]
  liveMenuItems: AdminMenuItem[]
  liveBookCategoryRows: AdminBookCategoryRow[]
  liveBookCategorySubcategoryRows: AdminBookCategorySubcategoryRow[]
  livePlacements: AdminPlacementRow[]
  categoryNameMap: Map<string, string>
  disabled: boolean
  onEditPlacement: (id: string) => void
  onDeletePlacement: (id: string) => void
  onDeleteBookCategory: (id: string) => void
  onDeleteBookCategorySubcategory: (id: string) => void
  onSaveBookCategorySort: (id: string, sortOrder: string) => void
  onSaveBookCategorySubcategorySort: (id: string, sortOrder: string) => void
  onSavePlacementSort: (id: string, sortOrder: string) => void
  onOpenPlacementModal: (bookId?: string, categoryId?: string, subcategoryId?: string) => void
  onOpenCategoryModal: (bookId?: string) => void
  onOpenSubcategoryModal: (bookId?: string, categoryId?: string) => void
}

export function AdminPlacementsTab(props: Props) {
  const [placementScopeBookId, setPlacementScopeBookId] = useState('')
  const [placementScopeCategoryId, setPlacementScopeCategoryId] = useState('')
  const [placementScopeSubcategoryId, setPlacementScopeSubcategoryId] = useState('')

  const [bookCategorySortDrafts, setBookCategorySortDrafts] = useState<Record<string, string>>({})
  const [bookCategorySubcategorySortDrafts, setBookCategorySubcategorySortDrafts] = useState<Record<string, string>>({})
  const [placementSortDrafts, setPlacementSortDrafts] = useState<Record<string, string>>({})

  const selectedBook = props.liveMenuBooks.find(b => b.id === placementScopeBookId)
  const selectedCategory = props.liveBookCategoryRows.find(r => r.topCategoryId === placementScopeCategoryId && r.menuBookId === placementScopeBookId)
  const selectedSubcategory = props.liveBookCategorySubcategoryRows.find(r => r.subcategoryId === placementScopeSubcategoryId && r.menuBookId === placementScopeBookId && r.topCategoryId === placementScopeCategoryId)

  const scopedBookCategories = useMemo(
    () => (placementScopeBookId ? props.liveBookCategoryRows.filter((row) => row.menuBookId === placementScopeBookId) : []),
    [props.liveBookCategoryRows, placementScopeBookId],
  )

  const scopedBookSubcategories = useMemo(
    () =>
      placementScopeBookId && placementScopeCategoryId
        ? props.liveBookCategorySubcategoryRows.filter(
            (row) => row.menuBookId === placementScopeBookId && row.topCategoryId === placementScopeCategoryId,
          )
        : [],
    [props.liveBookCategorySubcategoryRows, placementScopeBookId, placementScopeCategoryId],
  )

  const scopedPlacements = useMemo(
    () =>
      placementScopeBookId && placementScopeCategoryId && placementScopeSubcategoryId
        ? props.livePlacements.filter(
            (row) =>
              row.menuBookId === placementScopeBookId &&
              row.topCategoryId === placementScopeCategoryId &&
              row.subcategoryId === placementScopeSubcategoryId,
          )
        : [],
    [props.livePlacements, placementScopeBookId, placementScopeCategoryId, placementScopeSubcategoryId],
  )

  const currentLevel: 'books' | 'categories' | 'subcategories' | 'items' = 
    !placementScopeBookId ? 'books' :
    !placementScopeCategoryId ? 'categories' :
    !placementScopeSubcategoryId ? 'subcategories' : 'items'

  return (
    <div className="ops-grid">
      <section className="panel admin-section-placements">
        <div className="admin-list-head">
          <div>
            <p className="eyebrow">PLACEMENT EXPLORER</p>
            <h2>メニューブック構成</h2>
          </div>
          <div className="admin-list-actions">
            {currentLevel === 'categories' && (
              <button className="primary-button" type="button" disabled={props.disabled} onClick={() => props.onOpenCategoryModal(placementScopeBookId)}>
                カテゴリ追加
              </button>
            )}
            {currentLevel === 'subcategories' && (
              <button className="primary-button" type="button" disabled={props.disabled} onClick={() => props.onOpenSubcategoryModal(placementScopeBookId, placementScopeCategoryId)}>
                サブカテゴリ追加
              </button>
            )}
            {currentLevel === 'items' && (
              <button className="primary-button" type="button" disabled={props.disabled} onClick={() => props.onOpenPlacementModal(placementScopeBookId, placementScopeCategoryId, placementScopeSubcategoryId)}>
                メニュー追加
              </button>
            )}
          </div>
        </div>

        <div className="placement-explorer">
          <div className="placement-breadcrumbs">
            <span 
              className={`breadcrumb-item ${currentLevel === 'books' ? 'active' : ''}`}
              onClick={() => {
                setPlacementScopeBookId('')
                setPlacementScopeCategoryId('')
                setPlacementScopeSubcategoryId('')
              }}
            >
              📂 メニューブック一覧
            </span>
            {selectedBook && (
              <>
                <span className="breadcrumb-separator">/</span>
                <span 
                  className={`breadcrumb-item ${currentLevel === 'categories' ? 'active' : ''}`}
                  onClick={() => {
                    setPlacementScopeCategoryId('')
                    setPlacementScopeSubcategoryId('')
                  }}
                >
                  📖 {selectedBook.name}
                </span>
              </>
            )}
            {selectedCategory && (
              <>
                <span className="breadcrumb-separator">/</span>
                <span 
                  className={`breadcrumb-item ${currentLevel === 'subcategories' ? 'active' : ''}`}
                  onClick={() => {
                    setPlacementScopeSubcategoryId('')
                  }}
                >
                  🏷️ {selectedCategory.topCategoryName}
                </span>
              </>
            )}
            {selectedSubcategory && (
              <>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-item active">
                  📎 {selectedSubcategory.subcategoryName}
                </span>
              </>
            )}
          </div>

          <div className="placement-view-container">
            {currentLevel === 'books' && (
              <div className="placement-grid">
                {props.liveMenuBooks.map((book) => (
                  <div key={book.id} className="placement-card" onClick={() => setPlacementScopeBookId(book.id)}>
                    <div className="placement-card-content">
                      <div className="placement-card-icon">📖</div>
                      <div className="placement-card-info">
                        <span className="placement-card-title">{book.name}</span>
                        <span className="placement-card-subtitle">{book.code}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {props.liveMenuBooks.length === 0 && (
                  <div className="placement-empty">
                    <span className="placement-empty-icon">📭</span>
                    <p>メニューブックが登録されていません</p>
                  </div>
                )}
              </div>
            )}

            {currentLevel === 'categories' && (
              <div className="placement-grid">
                {scopedBookCategories.map((row) => (
                  <div key={row.id} className="placement-card" onClick={() => setPlacementScopeCategoryId(row.topCategoryId)}>
                    <div className="placement-card-content">
                      <div className="placement-card-icon">🏷️</div>
                      <div className="placement-card-info">
                        <span className="placement-card-title">{row.topCategoryName}</span>
                        <span className="placement-card-subtitle">表示順: {row.sortOrder}</span>
                      </div>
                    </div>
                    <div className="placement-card-actions" onClick={(e) => e.stopPropagation()}>
                      <div className="sort-input-wrapper">
                        <span>順序</span>
                        <input
                          type="number"
                          className="sort-input"
                          value={bookCategorySortDrafts[row.id] ?? String(row.sortOrder)}
                          onChange={(e) => setBookCategorySortDrafts({ ...bookCategorySortDrafts, [row.id]: e.target.value })}
                          onBlur={() => props.onSaveBookCategorySort(row.id, bookCategorySortDrafts[row.id] ?? String(row.sortOrder))}
                        />
                      </div>
                      <button className="danger-icon-button" onClick={() => props.onDeleteBookCategory(row.id)} disabled={props.disabled}>×</button>
                    </div>
                  </div>
                ))}
                {scopedBookCategories.length === 0 && (
                  <div className="placement-empty">
                    <span className="placement-empty-icon">➕</span>
                    <p>掲載カテゴリが設定されていません</p>
                    <button className="secondary-button" onClick={() => props.onOpenCategoryModal(placementScopeBookId)}>カテゴリを追加する</button>
                  </div>
                )}
              </div>
            )}

            {currentLevel === 'subcategories' && (
              <div className="placement-grid">
                {scopedBookSubcategories.map((row) => (
                  <div key={row.id} className="placement-card" onClick={() => setPlacementScopeSubcategoryId(row.subcategoryId)}>
                    <div className="placement-card-content">
                      <div className="placement-card-icon">📎</div>
                      <div className="placement-card-info">
                        <span className="placement-card-title">{row.subcategoryName}</span>
                        <span className="placement-card-subtitle">表示順: {row.sortOrder}</span>
                      </div>
                    </div>
                    <div className="placement-card-actions" onClick={(e) => e.stopPropagation()}>
                      <div className="sort-input-wrapper">
                        <span>順序</span>
                        <input
                          type="number"
                          className="sort-input"
                          value={bookCategorySubcategorySortDrafts[row.id] ?? String(row.sortOrder)}
                          onChange={(e) => setBookCategorySubcategorySortDrafts({ ...bookCategorySubcategorySortDrafts, [row.id]: e.target.value })}
                          onBlur={() => props.onSaveBookCategorySubcategorySort(row.id, bookCategorySubcategorySortDrafts[row.id] ?? String(row.sortOrder))}
                        />
                      </div>
                      <button className="danger-icon-button" onClick={() => props.onDeleteBookCategorySubcategory(row.id)} disabled={props.disabled}>×</button>
                    </div>
                  </div>
                ))}
                {scopedBookSubcategories.length === 0 && (
                  <div className="placement-empty">
                    <span className="placement-empty-icon">➕</span>
                    <p>掲載サブカテゴリが設定されていません</p>
                    <button className="secondary-button" onClick={() => props.onOpenSubcategoryModal(placementScopeBookId, placementScopeCategoryId)}>サブカテゴリを追加する</button>
                  </div>
                )}
              </div>
            )}

            {currentLevel === 'items' && (
              <div className="placement-item-table-container">
                <table className="admin-table compact">
                  <thead>
                    <tr>
                      <th>メニュー</th>
                      <th>表示名上書き</th>
                      <th>表示順</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scopedPlacements.map((row) => (
                      <tr key={row.id}>
                        <td><strong>{row.itemName}</strong></td>
                        <td>{row.displayNameOverride || '-'}</td>
                        <td>
                          <input
                            type="number"
                            className="sort-input"
                            value={placementSortDrafts[row.id] ?? String(row.sortOrder)}
                            onChange={(e) => setPlacementSortDrafts({ ...placementSortDrafts, [row.id]: e.target.value })}
                            onBlur={() => props.onSavePlacementSort(row.id, placementSortDrafts[row.id] ?? String(row.sortOrder))}
                          />
                        </td>
                        <td>
                          <div className="admin-table-actions">
                            <button className="secondary-button" onClick={() => props.onEditPlacement(row.id)}>編集</button>
                            <button className="danger-button" onClick={() => props.onDeletePlacement(row.id)} disabled={props.disabled}>解除</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {scopedPlacements.length === 0 && (
                  <div className="placement-empty">
                    <span className="placement-empty-icon">🍽️</span>
                    <p>メニューが掲載されていません</p>
                    <button className="secondary-button" onClick={() => props.onOpenPlacementModal(placementScopeBookId, placementScopeCategoryId, placementScopeSubcategoryId)}>メニューを掲載する</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
