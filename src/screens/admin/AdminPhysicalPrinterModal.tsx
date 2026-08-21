import React from 'react'

type Props = {
  isOpen: boolean
  editingPhysicalPrinterId: string | null
  adminPrinterName: string
  adminPrinterIp: string
  adminPrinterPort: string
  adminPrinterIsActive: boolean
  adminPrinterBackupPrinterId: string
  adminPrinterIsDefaultFallback: boolean
  physicalPrinters: any[]
  disabled: boolean
  onClose: () => void
  onPrinterNameChange: (value: string) => void
  onPrinterIpChange: (value: string) => void
  onPrinterPortChange: (value: string) => void
  onPrinterIsActiveChange: (value: boolean) => void
  onPrinterBackupPrinterIdChange: (value: string) => void
  onPrinterIsDefaultFallbackChange: (value: boolean) => void
  onSavePrinter: () => Promise<boolean>
  checkBox: (checked: boolean, onChange: (next: boolean) => void, disabled?: boolean) => React.ReactNode
}

export function AdminPhysicalPrinterModal(props: Props) {
  if (!props.isOpen) return null

  // Filter out self from backup options
  const backupOptions = props.physicalPrinters.filter(
    (p) => p.id !== props.editingPhysicalPrinterId
  )

  return (
    <div className="payment-modal-backdrop">
      <section className="panel admin-modal-panel">
        <div className="admin-modal-head admin-modal-head-printers">
          <div>
            <h2>{props.editingPhysicalPrinterId ? '物理プリンター編集' : '物理プリンター登録'}</h2>
          </div>
          <button className="secondary-button" type="button" onClick={props.onClose}>閉じる</button>
        </div>
        <div className="form-stack">
          <label>プリンター名<input value={props.adminPrinterName} onChange={(event) => props.onPrinterNameChange(event.target.value)} disabled={props.disabled} placeholder="例: 厨房フード用" /></label>
          <label>IPアドレス<input value={props.adminPrinterIp} onChange={(event) => props.onPrinterIpChange(event.target.value)} disabled={props.disabled} placeholder="例: 192.168.45.99" /></label>
          <label>ポート番号<input type="number" value={props.adminPrinterPort} onChange={(event) => props.onPrinterPortChange(event.target.value)} disabled={props.disabled} placeholder="デフォルト: 9100" /></label>
          <label>
            故障時の代替プリンター
            <select
              value={props.adminPrinterBackupPrinterId}
              onChange={(e) => props.onPrinterBackupPrinterIdChange(e.target.value)}
              disabled={props.disabled}
              className="select-input"
            >
              <option value="">なし (エラー終了)</option>
              {backupOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.ip_address}:{p.port})
                </option>
              ))}
            </select>
          </label>
          <label>標準の出力先 (デフォルト){props.checkBox(props.adminPrinterIsDefaultFallback, props.onPrinterIsDefaultFallbackChange, props.disabled)}</label>
          <label>有効{props.checkBox(props.adminPrinterIsActive, props.onPrinterIsActiveChange, props.disabled)}</label>
          <div className="button-row">
            <button className="primary-button" onClick={async () => {
              const success = await props.onSavePrinter()
              if (success) {
                props.onClose()
              }
            }} disabled={props.disabled}>{props.editingPhysicalPrinterId ? '保存' : '追加'}</button>
            <button className="secondary-button" onClick={props.onClose}>キャンセル</button>
          </div>
        </div>
      </section>
    </div>
  )
}
