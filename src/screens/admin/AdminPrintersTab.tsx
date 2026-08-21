import { useMemo } from 'react'
import { AdminPhysicalPrinter, AdminPrinterRoutingRule, AdminLogicalPrinter } from './types'

type Props = {
  physicalPrinters: AdminPhysicalPrinter[]
  routingRules: AdminPrinterRoutingRule[]
  logicalPrinters: AdminLogicalPrinter[]
  disabled: boolean
  onEditPrinter: (id: string) => void
  onDeletePrinter: (id: string) => void
  onOpenPrinterModal: () => void
  onEditRule: (id: string) => void
  onDeleteRule: (id: string) => void
  onOpenRuleModal: () => void
}

export function AdminPrintersTab(props: Props) {
  const printerNameMap = useMemo(() => {
    return new Map(props.physicalPrinters.map((p) => [p.id, p.name]))
  }, [props.physicalPrinters])

  const logicalPrinterMap = useMemo(() => {
    return new Map(props.logicalPrinters.map((lp) => [lp.id, lp]))
  }, [props.logicalPrinters])

  return (
    <div className="ops-grid" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 物理プリンター一覧 */}
      <section className="panel admin-list-panel admin-list-panel-wide admin-section-printers">
        <div className="admin-list-head">
          <div>
            <h2>物理プリンター一覧</h2>
          </div>
          <div className="admin-list-actions">
            <button
              className="primary-button"
              type="button"
              disabled={props.disabled}
              onClick={props.onOpenPrinterModal}
            >
              物理プリンター登録
            </button>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>プリンター名</th>
                <th>IPアドレス</th>
                <th>ポート番号</th>
                <th>故障時代替先</th>
                <th>状態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {props.physicalPrinters.map((printer) => {
                const backupPrinter = printer.backup_printer_id
                  ? props.physicalPrinters.find(p => p.id === printer.backup_printer_id)
                  : null
                return (
                  <tr key={printer.id}>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {printer.name}
                        {printer.is_default_fallback && (
                          <span style={{ backgroundColor: '#e8f5e9', color: '#1b5e20', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            デフォルト
                          </span>
                        )}
                      </span>
                    </td>
                    <td>{printer.ip_address}</td>
                    <td>{printer.port}</td>
                    <td>{backupPrinter ? `${backupPrinter.name} (${backupPrinter.ip_address})` : 'なし (エラー)'}</td>
                    <td>{printer.is_active ? '有効' : '無効'}</td>
                    <td>
                      <div className="admin-table-actions">
                        <button className="secondary-button" onClick={() => props.onEditPrinter(printer.id)} disabled={props.disabled}>
                          編集
                        </button>
                        <button className="danger-button" onClick={() => props.onDeletePrinter(printer.id)} disabled={props.disabled}>
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {props.physicalPrinters.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: '12px' }}>物理プリンターが登録されていません。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* プリンター割り当てルール一覧 */}
      <section className="panel admin-list-panel admin-list-panel-wide admin-section-rules">
        <div className="admin-list-head">
          <div>
            <h2>プリンター割り当てルール一覧</h2>
          </div>
          <div className="admin-list-actions">
            <button
              className="primary-button"
              type="button"
              disabled={props.disabled}
              onClick={props.onOpenRuleModal}
            >
              ルーティングルール登録
            </button>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>エリアグループ</th>
                <th>対象部門別プリンター</th>
                <th>割り当て先物理プリンター</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {props.routingRules.map((rule) => {
                const printerName = printerNameMap.get(rule.physical_printer_id) || `未定義 (${rule.physical_printer_id})`
                const lp = rule.logical_printer_id ? logicalPrinterMap.get(rule.logical_printer_id) : null
                const lpLabel = lp ? `${lp.name} (${lp.code})` : (rule.logical_printer_code || '未指定')

                return (
                  <tr key={rule.id}>
                    <td>{rule.area_group}</td>
                    <td>{lpLabel}</td>
                    <td>{printerName}</td>
                    <td>
                      <div className="admin-table-actions">
                        <button className="secondary-button" onClick={() => props.onEditRule(rule.id)} disabled={props.disabled}>
                          編集
                        </button>
                        <button className="danger-button" onClick={() => props.onDeleteRule(rule.id)} disabled={props.disabled}>
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {props.routingRules.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#999', padding: '12px' }}>割り当てルールが設定されていません。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
