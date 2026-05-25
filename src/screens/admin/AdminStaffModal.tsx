import React from 'react'
import { AdminStaffUserRow } from './types'

type Props = {
  isOpen: boolean
  editingStaffUserId: string | null
  adminStaffEmail: string
  adminStaffPassword: string
  adminStaffDisplayName: string
  adminStaffRoleType: 'ADMIN' | 'STAFF' | 'KDS'
  adminStaffIsActive: boolean
  disabled: boolean
  onClose: () => void
  onStaffEmailChange: (value: string) => void
  onStaffPasswordChange: (value: string) => void
  onStaffDisplayNameChange: (value: string) => void
  onStaffRoleTypeChange: (value: 'ADMIN' | 'STAFF' | 'KDS') => void
  onStaffIsActiveChange: (value: boolean) => void
  onSaveStaffUser: () => void | boolean | Promise<boolean | void>
  checkBox: (checked: boolean, onChange: (next: boolean) => void, disabled?: boolean) => React.ReactNode
}

export function AdminStaffModal(props: Props) {
  if (!props.isOpen) return null

  return (
    <div className="payment-modal-backdrop">
      <section className="panel admin-modal-panel">
        <div className="admin-modal-head admin-modal-head-staff">
          <div>
            <p className="eyebrow">STAFF</p>
            <h2>{props.editingStaffUserId ? 'スタッフ編集' : 'スタッフ登録'}</h2>
          </div>
          <button className="secondary-button" type="button" onClick={props.onClose}>閉じる</button>
        </div>
        <div className="form-stack">
          <label>メールアドレス<input value={props.adminStaffEmail} onChange={(event) => props.onStaffEmailChange(event.target.value)} disabled={props.disabled} /></label>
          <label>パスワード<input type="password" value={props.adminStaffPassword} onChange={(event) => props.onStaffPasswordChange(event.target.value)} disabled={props.disabled} /></label>
          <label>表示名<input value={props.adminStaffDisplayName} onChange={(event) => props.onStaffDisplayNameChange(event.target.value)} disabled={props.disabled} /></label>
          <label>
            ロール
            <select value={props.adminStaffRoleType} onChange={(event) => props.onStaffRoleTypeChange(event.target.value as 'ADMIN' | 'STAFF' | 'KDS')} disabled={props.disabled}>
              <option value="ADMIN">ADMIN</option>
              <option value="STAFF">STAFF</option>
              <option value="KDS">KDS</option>
            </select>
          </label>
          <label>有効{props.checkBox(props.adminStaffIsActive, props.onStaffIsActiveChange, props.disabled)}</label>
          <div className="button-row">
            <button className="primary-button" onClick={() => {
              void Promise.resolve(props.onSaveStaffUser()).then((ok) => {
                if (ok !== false) {
                  props.onClose()
                }
              })
            }} disabled={props.disabled}>{props.editingStaffUserId ? '保存' : '追加'}</button>
            <button className="secondary-button" onClick={props.onClose}>キャンセル</button>
          </div>
        </div>
      </section>
    </div>
  )
}
