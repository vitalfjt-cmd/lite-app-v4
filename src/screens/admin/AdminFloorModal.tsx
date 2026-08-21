import React from 'react'

type Props = {
  isOpen: boolean
  editingFloorId: string | null
  adminFloorName: string
  adminFloorSortOrder: string
  adminFloorIsActive: boolean
  disabled: boolean
  onClose: () => void
  onFloorNameChange: (value: string) => void
  onFloorSortOrderChange: (value: string) => void
  onFloorIsActiveChange: (value: boolean) => void
  onSaveFloor: () => Promise<boolean>
  checkBox: (checked: boolean, onChange: (next: boolean) => void, disabled?: boolean) => React.ReactNode
}

export function AdminFloorModal(props: Props) {
  if (!props.isOpen) return null

  return (
    <div className="payment-modal-backdrop">
      <section className="panel admin-modal-panel">
        <div className="admin-modal-head admin-modal-head-floors">
          <div>
            <h2>{props.editingFloorId ? 'フロア編集' : 'フロア登録'}</h2>
          </div>
          <button className="secondary-button" type="button" onClick={props.onClose}>閉じる</button>
        </div>
        <div className="form-stack">
          <label>フロア名<input value={props.adminFloorName} onChange={(event) => props.onFloorNameChange(event.target.value)} disabled={props.disabled} placeholder="例: 1F, 2F, テラス席など" /></label>
          <label>表示順<input type="number" value={props.adminFloorSortOrder} onChange={(event) => props.onFloorSortOrderChange(event.target.value)} disabled={props.disabled} /></label>
          <label>有効{props.checkBox(props.adminFloorIsActive, props.onFloorIsActiveChange, props.disabled)}</label>
          <div className="button-row">
            <button className="primary-button" onClick={async () => {
              const saved = await props.onSaveFloor()
              if (saved) props.onClose()
            }} disabled={props.disabled}>{props.editingFloorId ? '保存' : '追加'}</button>
            <button className="secondary-button" onClick={props.onClose}>キャンセル</button>
          </div>
        </div>
      </section>
    </div>
  )
}
