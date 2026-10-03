import { useMemo, useState } from 'react'
import { AdminPhysicalPrinter, AdminPrinterRoutingRule, AdminLogicalPrinter, AdminFloor } from './types'

type Props = {
  physicalPrinters: AdminPhysicalPrinter[]
  routingRules: AdminPrinterRoutingRule[]
  logicalPrinters: AdminLogicalPrinter[]
  liveFloors?: AdminFloor[]
  disabled: boolean
  onEditPrinter: (id: string) => void
  onDeletePrinter: (id: string) => void
  onOpenPrinterModal: () => void
  onEditRule: (id: string) => void
  onDeleteRule: (id: string) => void
  onOpenRuleModal: () => void
  onSaveQrPrinterRouting?: (floorId: string | null, physicalPrinterId: string | null) => Promise<boolean>
}

export function AdminPrintersTab(props: Props) {
  const printerNameMap = useMemo(() => {
    return new Map(props.physicalPrinters.map((p) => [p.id, p.name]))
  }, [props.physicalPrinters])

  const logicalPrinterMap = useMemo(() => {
    return new Map(props.logicalPrinters.map((lp) => [lp.id, lp]))
  }, [props.logicalPrinters])

  const qrLogicalPrinter = useMemo(() => {
    return props.logicalPrinters.find((lp) => lp.is_qr_printer)
  }, [props.logicalPrinters])

  const [savingFloorKey, setSavingFloorKey] = useState<string | null>(null)
  const [selectedQrPrinters, setSelectedQrPrinters] = useState<Record<string, string>>({})

  const getInitialQrPrinter = (floorId: string | null) => {
    if (!qrLogicalPrinter) return ''
    const rule = props.routingRules.find((r) =>
      (floorId ? r.floor_id === floorId : (!r.floor_id || r.floor_id === '')) &&
      (r.logical_printer_id === qrLogicalPrinter.id || r.logical_printer_code === qrLogicalPrinter.code)
    )
    return rule?.physical_printer_id ?? ''
  }

  const getSelectedQrPrinter = (floorId: string | null) => {
    const key = floorId || '__global__'
    if (selectedQrPrinters[key] !== undefined) {
      return selectedQrPrinters[key]
    }
    return getInitialQrPrinter(floorId)
  }

  const handleSelectQrPrinter = (floorId: string | null, printerId: string) => {
    const key = floorId || '__global__'
    setSelectedQrPrinters((prev) => ({ ...prev, [key]: printerId }))
  }

  const handleSaveQrRouting = async (floorId: string | null) => {
    if (!props.onSaveQrPrinterRouting) return
    const key = floorId || '__global__'
    setSavingFloorKey(key)
    try {
      const printerId = getSelectedQrPrinter(floorId)
      await props.onSaveQrPrinterRouting(floorId, printerId || null)
    } finally {
      setSavingFloorKey(null)
    }
  }

  return (
    <div className="ops-grid" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 注文用QRコード出力先プリンター設定 */}
      <section className="panel admin-list-panel admin-list-panel-wide admin-section-qr-printers" style={{ borderLeft: '4px solid #6a1b9a' }}>
        <div className="admin-list-head">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-icons" style={{ color: '#6a1b9a', fontSize: '24px' }}>qr_code_2</span>
              <h2>注文用QRコード出力先プリンター設定</h2>
            </div>
            <p className="hint" style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
              伝票一覧の詳細画面およびスマホ用QRコード発行画面で「印刷」をクリックした際に出力する物理プリンターを設定します。
            </p>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>対象フロア</th>
                <th style={{ width: '50%' }}>出力先プリンター</th>
                <th style={{ width: '20%' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>店舗共通（デフォルト）</strong></td>
                <td>
                  <select
                    value={getSelectedQrPrinter(null)}
                    onChange={(e) => handleSelectQrPrinter(null, e.target.value)}
                    disabled={props.disabled || savingFloorKey === '__global__'}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  >
                    <option value="">未設定（物理プリンターのデフォルトを使用）</option>
                    {props.physicalPrinters.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.ip_address}:{p.port})
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    className="primary-button"
                    type="button"
                    disabled={props.disabled || savingFloorKey === '__global__'}
                    onClick={() => handleSaveQrRouting(null)}
                  >
                    {savingFloorKey === '__global__' ? '保存中...' : '保存'}
                  </button>
                </td>
              </tr>
              {(props.liveFloors ?? []).map((floor) => (
                <tr key={floor.id}>
                  <td>{floor.name}</td>
                  <td>
                    <select
                      value={getSelectedQrPrinter(floor.id)}
                      onChange={(e) => handleSelectQrPrinter(floor.id, e.target.value)}
                      disabled={props.disabled || savingFloorKey === floor.id}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                      <option value="">店舗共通設定に従う</option>
                      {props.physicalPrinters.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.ip_address}:{p.port})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className="primary-button"
                      type="button"
                      disabled={props.disabled || savingFloorKey === floor.id}
                      onClick={() => handleSaveQrRouting(floor.id)}
                    >
                      {savingFloorKey === floor.id ? '保存中...' : '保存'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
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
                    <td>{rule.area_group || '店舗共通'}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {lpLabel}
                        {lp?.is_qr_printer && (
                          <span style={{ backgroundColor: '#f3e5f5', color: '#6a1b9a', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            注文用QR
                          </span>
                        )}
                        {lp?.is_receipt_printer && (
                          <span style={{ backgroundColor: '#e3f2fd', color: '#0d47a1', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            領収書レシート
                          </span>
                        )}
                        {lp?.is_order_printer && (
                          <span style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            会計伝票
                          </span>
                        )}
                      </span>
                    </td>
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
