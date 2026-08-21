import React from 'react'
import { AdminFloor } from './types'

type Props = {
  isOpen: boolean
  editingTableId: string | null
  adminTableLabel: string
  adminTableQrToken: string
  adminTableFloorId: string
  adminTableSortOrder: string
  adminTableIsActive: boolean
  liveFloors: AdminFloor[]
  disabled: boolean
  onClose: () => void
  onTableLabelChange: (value: string) => void
  onTableQrTokenChange: (value: string) => void
  onTableFloorIdChange: (value: string) => void
  onTableSortOrderChange: (value: string) => void
  onTableIsActiveChange: (value: boolean) => void
  onSaveTableRef: () => Promise<boolean>
  checkBox: (checked: boolean, onChange: (next: boolean) => void, disabled?: boolean) => React.ReactNode
}

export function AdminTableModal(props: Props) {
  if (!props.isOpen) return null

  return (
    <div className="payment-modal-backdrop">
      <section className="panel admin-modal-panel">
        <div className="admin-modal-head admin-modal-head-tables">
          <div>
            <h2>{props.editingTableId ? 'テーブル編集' : 'テーブル登録'}</h2>
          </div>
          <button className="secondary-button" type="button" onClick={props.onClose}>閉じる</button>
        </div>
        <div className="form-stack">
          <label>テーブル名<input value={props.adminTableLabel} onChange={(event) => props.onTableLabelChange(event.target.value)} disabled={props.disabled} /></label>
          <label>QRトークン<input value={props.adminTableQrToken} onChange={(event) => props.onTableQrTokenChange(event.target.value)} disabled={props.disabled} /></label>
          <div className="panel-copy">未入力の場合は店舗 slug とテーブル名から自動生成します。</div>
          <label>
            所属フロア
            <select
              value={props.adminTableFloorId}
              onChange={(event) => props.onTableFloorIdChange(event.target.value)}
              disabled={props.disabled}
              style={{ width: '100%', height: '36px', borderRadius: '4px', border: '1px solid #ccc', padding: '0 8px', marginTop: '4px' }}
            >
              <option value="">選択してください（未設定）</option>
              {props.liveFloors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            {props.liveFloors.length === 0 && (
              <div className="panel-copy" style={{ color: '#d9534f', marginTop: '4px' }}>
                ※フロアが登録されていません。管理画面メニューの「フロア設定」からフロアを作成してください。
              </div>
            )}
          </label>
          <label>表示順<input type="number" value={props.adminTableSortOrder} onChange={(event) => props.onTableSortOrderChange(event.target.value)} disabled={props.disabled} /></label>
          <label>有効{props.checkBox(props.adminTableIsActive, props.onTableIsActiveChange, props.disabled)}</label>
          <div className="button-row">
            <button className="primary-button" onClick={async () => {
              const saved = await props.onSaveTableRef()
              if (saved) props.onClose()
            }} disabled={props.disabled}>{props.editingTableId ? '保存' : '追加'}</button>
            <button className="secondary-button" onClick={props.onClose}>キャンセル</button>
          </div>
        </div>
      </section>
    </div>
  )
}
