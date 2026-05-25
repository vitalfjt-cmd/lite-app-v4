import React from 'react'
import { AdminMenuBook } from './types'

type Props = {
  isOpen: boolean
  editingMenuBookId: string | null
  adminMenuBookCode: string
  adminMenuBookName: string
  adminMenuBookDescription: string
  adminMenuBookSortOrder: string
  adminMenuBookAvailableFromTime: string
  adminMenuBookAvailableToTime: string
  adminMenuBookValidFrom: string
  adminMenuBookValidTo: string
  adminMenuBookIsActive: boolean
  disabled: boolean
  onClose: () => void
  onMenuBookCodeChange: (value: string) => void
  onMenuBookNameChange: (value: string) => void
  onMenuBookDescriptionChange: (value: string) => void
  onMenuBookSortOrderChange: (value: string) => void
  onMenuBookAvailableFromTimeChange: (value: string) => void
  onMenuBookAvailableToTimeChange: (value: string) => void
  onMenuBookValidFromChange: (value: string) => void
  onMenuBookValidToChange: (value: string) => void
  onMenuBookIsActiveChange: (value: boolean) => void
  onCreateMenuBook: () => void
  checkBox: (checked: boolean, onChange: (next: boolean) => void, disabled?: boolean) => React.ReactNode
}

export function AdminMenuBookModal(props: Props) {
  if (!props.isOpen) return null

  return (
    <div className="payment-modal-backdrop">
      <section className="panel admin-modal-panel">
        <div className="admin-modal-head admin-modal-head-menuBooks">
          <div>
            <p className="eyebrow">MENU BOOK</p>
            <h2>{props.editingMenuBookId ? 'メニューブック編集' : 'メニューブック登録'}</h2>
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
          <label>コード<input value={props.adminMenuBookCode} onChange={(event) => props.onMenuBookCodeChange(event.target.value)} disabled={props.disabled} /></label>
          <label>名称<input value={props.adminMenuBookName} onChange={(event) => props.onMenuBookNameChange(event.target.value)} disabled={props.disabled} /></label>
          <label>説明<input value={props.adminMenuBookDescription} onChange={(event) => props.onMenuBookDescriptionChange(event.target.value)} disabled={props.disabled} /></label>
          <label>表示順<input type="number" value={props.adminMenuBookSortOrder} onChange={(event) => props.onMenuBookSortOrderChange(event.target.value)} disabled={props.disabled} /></label>
          <label>開始時刻<input type="time" value={props.adminMenuBookAvailableFromTime} onChange={(event) => props.onMenuBookAvailableFromTimeChange(event.target.value)} disabled={props.disabled} /></label>
          <label>終了時刻<input type="time" value={props.adminMenuBookAvailableToTime} onChange={(event) => props.onMenuBookAvailableToTimeChange(event.target.value)} disabled={props.disabled} /></label>
          <label>開始日<input type="date" value={props.adminMenuBookValidFrom} onChange={(event) => props.onMenuBookValidFromChange(event.target.value)} disabled={props.disabled} /></label>
          <label>終了日<input type="date" value={props.adminMenuBookValidTo} onChange={(event) => props.onMenuBookValidToChange(event.target.value)} disabled={props.disabled} /></label>
          <label>有効{props.checkBox(props.adminMenuBookIsActive, props.onMenuBookIsActiveChange, props.disabled)}</label>
          <div className="button-row">
            <button className="primary-button" onClick={props.onCreateMenuBook} disabled={props.disabled}>{props.editingMenuBookId ? '保存' : '追加'}</button>
            <button
              className="secondary-button"
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
