
import { AdminCategory } from './types'

type Props = {
  isOpen: boolean
  editingSubCategoryId: string | null
  adminSubCategoryName: string
  adminSubCategoryParentCategoryId?: string
  adminSubCategorySortOrder: string
  liveParentCategories: AdminCategory[]
  disabled: boolean
  onClose: () => void
  onSubCategoryNameChange: (value: string) => void
  onSubCategoryParentCategoryChange: (value: string) => void
  onSubCategorySortOrderChange: (value: string) => void
  onCreateSubCategory: () => void
}

export function AdminSubcategoryModal(props: Props) {
  if (!props.isOpen) return null

  return (
    <div className="payment-modal-backdrop">
      <section className="panel admin-modal-panel">
        <div className="admin-modal-head admin-modal-head-subcategories">
          <div>
            <p className="eyebrow">SUBCATEGORY</p>
            <h2>{props.editingSubCategoryId ? 'サブカテゴリ編集' : 'サブカテゴリ登録'}</h2>
          </div>
          <button className="secondary-button" type="button" onClick={props.onClose}>閉じる</button>
        </div>
        <div className="form-stack">
          <label>サブカテゴリ名<input value={props.adminSubCategoryName} onChange={(event) => props.onSubCategoryNameChange(event.target.value)} disabled={props.disabled} /></label>
          <label>
            親カテゴリ
            <select value={props.adminSubCategoryParentCategoryId ?? ''} onChange={(event) => props.onSubCategoryParentCategoryChange(event.target.value)} disabled={props.disabled}>
              <option value="">未選択</option>
              {props.liveParentCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label>表示順<input type="number" value={props.adminSubCategorySortOrder} onChange={(event) => props.onSubCategorySortOrderChange(event.target.value)} disabled={props.disabled} /></label>
          <div className="button-row">
            <button className="primary-button" onClick={() => {
              props.onCreateSubCategory()
              props.onClose()
            }} disabled={props.disabled}>{props.editingSubCategoryId ? '保存' : '追加'}</button>
            <button className="secondary-button" onClick={props.onClose}>キャンセル</button>
          </div>
        </div>
      </section>
    </div>
  )
}
