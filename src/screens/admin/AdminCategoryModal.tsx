
import { AdminCategory } from './types'

type Props = {
  isOpen: boolean
  editingCategoryId: string | null
  adminCategoryName: string
  adminCategorySortOrder: string
  disabled: boolean
  onClose: () => void
  onCategoryNameChange: (value: string) => void
  onCategorySortOrderChange: (value: string) => void
  onCreateCategory: () => void
}

export function AdminCategoryModal(props: Props) {
  if (!props.isOpen) return null

  return (
    <div className="payment-modal-backdrop">
      <section className="panel admin-modal-panel">
        <div className="admin-modal-head admin-modal-head-categories">
          <div>
            <p className="eyebrow">CATEGORY</p>
            <h2>{props.editingCategoryId ? 'カテゴリ編集' : 'カテゴリ登録'}</h2>
          </div>
          <button className="secondary-button" type="button" onClick={props.onClose}>閉じる</button>
        </div>
        <div className="form-stack">
          <label>カテゴリ名<input value={props.adminCategoryName} onChange={(event) => props.onCategoryNameChange(event.target.value)} disabled={props.disabled} /></label>
          <label>表示順<input type="number" value={props.adminCategorySortOrder} onChange={(event) => props.onCategorySortOrderChange(event.target.value)} disabled={props.disabled} /></label>
          <div className="button-row">
            <button className="primary-button" onClick={() => {
              props.onCreateCategory()
              props.onClose()
            }} disabled={props.disabled}>{props.editingCategoryId ? '保存' : '追加'}</button>
            <button className="secondary-button" onClick={props.onClose}>キャンセル</button>
          </div>
        </div>
      </section>
    </div>
  )
}
