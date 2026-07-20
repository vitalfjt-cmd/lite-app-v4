import React from 'react'

type Props = {
  isOpen: boolean
  editingPaymentMethodId: string | null
  adminPaymentMethodName: string
  adminPaymentMethodSortOrder: string
  adminPaymentMethodIsActive: boolean
  adminPaymentMethodIsChangeAllowed: boolean
  disabled: boolean
  onClose: () => void
  onPaymentMethodNameChange: (value: string) => void
  onPaymentMethodSortOrderChange: (value: string) => void
  onPaymentMethodIsActiveChange: (value: boolean) => void
  onPaymentMethodIsChangeAllowedChange: (value: boolean) => void
  onSavePaymentMethod: () => Promise<boolean>
  checkBox: (checked: boolean, onChange: (next: boolean) => void, disabled?: boolean) => React.ReactNode
}

export function AdminPaymentMethodModal(props: Props) {
  if (!props.isOpen) return null

  return (
    <div className="payment-modal-backdrop">
      <section className="panel admin-modal-panel">
        <div className="admin-modal-head admin-modal-head-payment-methods">
          <div>
            <p className="eyebrow">PAYMENT METHOD</p>
            <h2>{props.editingPaymentMethodId ? '決済種別編集' : '決済種別登録'}</h2>
          </div>
          <button className="secondary-button" type="button" onClick={props.onClose}>閉じる</button>
        </div>
        <div className="form-stack">
          <label>決済種別名<input value={props.adminPaymentMethodName} onChange={(event) => props.onPaymentMethodNameChange(event.target.value)} disabled={props.disabled} placeholder="例: PayPay, 電子マネーなど" /></label>
          <label>表示順<input type="number" value={props.adminPaymentMethodSortOrder} onChange={(event) => props.onPaymentMethodSortOrderChange(event.target.value)} disabled={props.disabled} /></label>
          <label>有効{props.checkBox(props.adminPaymentMethodIsActive, props.onPaymentMethodIsActiveChange, props.disabled)}</label>
          <label>釣銭を出す{props.checkBox(props.adminPaymentMethodIsChangeAllowed, props.onPaymentMethodIsChangeAllowedChange, props.disabled)}</label>
          <div className="button-row">
            <button className="primary-button" onClick={async () => {
              const saved = await props.onSavePaymentMethod()
              if (saved) props.onClose()
            }} disabled={props.disabled}>{props.editingPaymentMethodId ? '保存' : '追加'}</button>
            <button className="secondary-button" onClick={props.onClose}>キャンセル</button>
          </div>
        </div>
      </section>
    </div>
  )
}
