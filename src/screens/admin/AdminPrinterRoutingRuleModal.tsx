import React from 'react'
import { AdminPhysicalPrinter, AdminFloor, AdminLogicalPrinter } from './types'

type Props = {
  isOpen: boolean
  editingPrinterRoutingRuleId: string | null
  adminRuleFloorId: string
  adminRuleLogicalPrinterId: string
  adminRulePhysicalPrinterId: string
  physicalPrinters: AdminPhysicalPrinter[]
  liveFloors: AdminFloor[]
  logicalPrinters: AdminLogicalPrinter[]
  disabled: boolean
  onClose: () => void
  onRuleFloorIdChange: (value: string) => void
  onRuleLogicalPrinterIdChange: (value: string) => void
  onRulePhysicalPrinterIdChange: (value: string) => void
  onSaveRule: () => Promise<boolean>
}

export function AdminPrinterRoutingRuleModal(props: Props) {
  if (!props.isOpen) return null

  return (
    <div className="payment-modal-backdrop">
      <section className="panel admin-modal-panel">
        <div className="admin-modal-head admin-modal-head-rules">
          <div>
            <h2>{props.editingPrinterRoutingRuleId ? 'ルーティングルール編集' : 'ルーティングルール登録'}</h2>
          </div>
          <button className="secondary-button" type="button" onClick={props.onClose}>閉じる</button>
        </div>
        <div className="form-stack">
          <label>
            対象フロア
            <select
              value={props.adminRuleFloorId}
              onChange={(event) => props.onRuleFloorIdChange(event.target.value)}
              disabled={props.disabled}
              style={{ width: '100%', height: '36px', borderRadius: '4px', border: '1px solid #ccc', padding: '0 8px', marginTop: '4px' }}
            >
              <option value="">選択してください</option>
              {props.liveFloors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.name}
                </option>
              ))}
            </select>
            {props.liveFloors.length === 0 && (
              <div className="panel-copy" style={{ color: '#d9534f', marginTop: '4px' }}>
                ※フロアが登録されていません。管理画面メニューの「フロア設定」からフロアを作成してください。
              </div>
            )}
          </label>
          <label>
            対象の部門別プリンター (論理)
            <select
              value={props.adminRuleLogicalPrinterId}
              onChange={(event) => props.onRuleLogicalPrinterIdChange(event.target.value)}
              disabled={props.disabled}
              style={{ marginTop: '4px' }}
            >
              <option value="">選択してください</option>
              {props.logicalPrinters.map((lp) => (
                <option key={lp.id} value={lp.id}>
                  {lp.name} ({lp.code})
                </option>
              ))}
            </select>
            {props.logicalPrinters.length === 0 && (
              <div className="panel-copy" style={{ color: '#d9534f', marginTop: '4px' }}>
                ※部門別出力プリンター設定がありません。管理画面メニューの「部門別プリンター設定」から作成してください。
              </div>
            )}
          </label>
          <label>
            出力先物理プリンター
            <select
              value={props.adminRulePhysicalPrinterId}
              onChange={(event) => props.onRulePhysicalPrinterIdChange(event.target.value)}
              disabled={props.disabled}
              style={{ marginTop: '4px' }}
            >
              <option value="">選択してください</option>
              {props.physicalPrinters.map((printer) => (
                <option key={printer.id} value={printer.id}>
                  {printer.name} ({printer.ip_address}:{printer.port})
                </option>
              ))}
            </select>
          </label>
          <div className="button-row">
            <button className="primary-button" onClick={async () => {
              const success = await props.onSaveRule()
              if (success) {
                props.onClose()
              }
            }} disabled={props.disabled}>{props.editingPrinterRoutingRuleId ? '保存' : '追加'}</button>
            <button className="secondary-button" onClick={props.onClose}>キャンセル</button>
          </div>
        </div>
      </section>
    </div>
  )
}
