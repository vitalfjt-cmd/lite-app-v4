import React from 'react'

type Props = {
  isOpen: boolean
  editingLogicalPrinterId: string | null
  adminLogicalPrinterCode: string
  adminLogicalPrinterName: string
  adminLogicalPrinterSortOrder: string
  adminLogicalPrinterIsReceiptPrinter: boolean
  disabled: boolean
  onClose: () => void
  onLogicalPrinterCodeChange: (value: string) => void
  onLogicalPrinterNameChange: (value: string) => void
  onLogicalPrinterSortOrderChange: (value: string) => void
  onLogicalPrinterIsReceiptPrinterChange: (value: boolean) => void
  onSaveLogicalPrinter: () => Promise<boolean>
}

export function AdminLogicalPrinterModal(props: Props) {
  if (!props.isOpen) return null

  return (
    <div className="payment-modal-backdrop">
      <section className="panel admin-modal-panel">
        <div className="admin-modal-head admin-modal-head-printers">
          <div>
            <h2>{props.editingLogicalPrinterId ? '部門別出力プリンター編集' : '部門別出力プリンター登録'}</h2>
          </div>
          <button className="secondary-button" type="button" onClick={props.onClose}>閉じる</button>
        </div>
        <div className="form-stack">
          <label>論理プリンターコード (例: KP1, KP2, DRINK)<input value={props.adminLogicalPrinterCode} onChange={(event) => props.onLogicalPrinterCodeChange(event.target.value)} disabled={props.disabled} placeholder="例: KP1" /></label>
          <label>部門名/出力エリア名 (例: 焼き場, ドリンク)<input value={props.adminLogicalPrinterName} onChange={(event) => props.onLogicalPrinterNameChange(event.target.value)} disabled={props.disabled} placeholder="例: 焼き場" /></label>
          <label>表示順<input type="number" value={props.adminLogicalPrinterSortOrder} onChange={(event) => props.onLogicalPrinterSortOrderChange(event.target.value)} disabled={props.disabled} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: '8px 0' }}>
            <input
              type="checkbox"
              style={{ width: 'auto', margin: 0 }}
              checked={props.adminLogicalPrinterIsReceiptPrinter}
              onChange={(event) => props.onLogicalPrinterIsReceiptPrinterChange(event.target.checked)}
              disabled={props.disabled}
            />
            <span>会計伝票（レシート）を出力する</span>
          </label>
          <div className="button-row">
            <button className="primary-button" onClick={async () => {
              const saved = await props.onSaveLogicalPrinter()
              if (saved) props.onClose()
            }} disabled={props.disabled}>{props.editingLogicalPrinterId ? '保存' : '追加'}</button>
            <button className="secondary-button" onClick={props.onClose}>キャンセル</button>
          </div>
        </div>
      </section>
    </div>
  )
}
